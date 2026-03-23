import { eq, and, asc, desc, count, sql, lte, gte, isNull, inArray, or } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  tasks,
  taskAssignees,
  activityLogs,
  lists,
  projects,
  labels,
  taskLabels,
  taskAttachments,
  notifications,
  users,
  type NewTask,
} from "@/lib/db/schema"
import { isNotificationEnabled } from "./settings"

// Define a type for incoming UploadThing attachments
type AttachmentInput = { url: string; name: string; size?: number; type?: string }

/**
 * Get all tasks in a project, ordered by position within each list.
 */
export async function getTasksByProjectId(projectId: string) {
  return db.query.tasks.findMany({
    where: eq(tasks.projectId, projectId),
    orderBy: asc(tasks.position),
    with: {
      assignees: {
        with: { user: true },
      },
      labels: {
        with: { label: true },
      },
      attachments: true,
    },
  })
}

/**
 * Get all tasks in a specific list, ordered by position.
 */
export async function getTasksByListId(listId: string) {
  return db.query.tasks.findMany({
    where: eq(tasks.listId, listId),
    orderBy: asc(tasks.position),
    with: {
      assignees: {
        with: { user: true },
      },
      labels: {
        with: { label: true },
      },
      attachments: true,
    },
  })
}

/**
 * Get a single task with full details (for task modal).
 */
export async function getTaskById(taskId: string) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: {
      list: true,
      createdBy: true,
      assignees: {
        with: { user: true },
      },
      labels: {
        with: { label: true },
      },
      attachments: true,
      comments: {
        with: { user: true },
        orderBy: asc(tasks.createdAt),
      },
    },
  })

  return task ?? null
}

/**
 * Create a new task in a list.
 */
export async function createTask(
  data: Pick<NewTask, "title" | "description" | "priority" | "startDate" | "dueDate">,
  listId: string,
  projectId: string,
  createdById: string,
  labelNames?: string[],
  attachments?: AttachmentInput[]
) {
  const [targetList] = await db
    .select({ type: lists.type })
    .from(lists)
    .where(eq(lists.id, listId))
    .limit(1)

  if (!targetList) throw new Error("List not found")

  const isCompleted = targetList.type === "done"

  const existingTasks = await db
    .select({ position: tasks.position })
    .from(tasks)
    .where(eq(tasks.listId, listId))
    .orderBy(desc(tasks.position))
    .limit(1)

  const maxPosition = existingTasks[0]?.position ?? 0

  const [task] = await db
    .insert(tasks)
    .values({
      ...data,
      listId,
      projectId,
      createdById,
      position: maxPosition + 1024,
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    })
    .returning()

  if (!task) {
    throw new Error("Failed to create task. Database returned undefined.")
  }

  // Handle Labels
  if (labelNames && labelNames.length > 0) {
    const existingLabels = await db
      .select({ id: labels.id, name: labels.name })
      .from(labels)
      .where(and(eq(labels.projectId, projectId), inArray(labels.name, labelNames)))

    const existingLabelNames = existingLabels.map((l) => l.name)
    const newLabelNames = labelNames.filter((name) => !existingLabelNames.includes(name))

    let newCreatedLabels: { id: string }[] = []

    if (newLabelNames.length > 0) {
      const labelsToInsert = newLabelNames.map((name) => ({
        projectId,
        name,
        color: "#6B7280",
      }))

      newCreatedLabels = await db.insert(labels).values(labelsToInsert).returning({ id: labels.id })
    }

    const allLabelIdsToLink = [
      ...existingLabels.map((l) => l.id),
      ...newCreatedLabels.map((l) => l.id),
    ]

    if (allLabelIdsToLink.length > 0) {
      const taskLabelsToInsert = allLabelIdsToLink.map((labelId) => ({
        taskId: task.id,
        labelId,
      }))

      await db.insert(taskLabels).values(taskLabelsToInsert)
    }
  }

  // Handle Attachments
  if (attachments && attachments.length > 0) {
    const attachmentsToInsert = attachments.map((att) => ({
      taskId: task.id,
      url: att.url,
      name: att.name,
      size: att.size || 0,
      type: att.type || "application/octet-stream",
      uploadedById: createdById,
    }))
    await db.insert(taskAttachments).values(attachmentsToInsert)

    // Log attachment activity separately from the "created" log
    await db.insert(activityLogs).values({
      projectId,
      userId: createdById,
      action: "updated",
      entityType: "task",
      entityId: task.id,
      metadata: {
        type: "attachments_added",
        fileNames: attachments.map((a) => a.name),
        count: attachments.length,
      },
    })
  }

  await db.insert(activityLogs).values({
    projectId,
    userId: createdById,
    action: "created",
    entityType: "task",
    entityId: task.id,
    metadata: { title: task.title, listType: targetList.type },
  })

  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId))

  return task
}

/**
 * Update task details.
 */
export async function updateTask(
  taskId: string,
  data: Partial<Pick<NewTask, "title" | "description" | "priority" | "startDate" | "dueDate">>,
  userId: string,
  labelNames?: string[]
) {
  const [updated] = await db
    .update(tasks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning()

  if (updated) {
    const projectId = updated.projectId

    // Handle Labels (Wipe and replace)
    if (labelNames !== undefined) {
      await db.delete(taskLabels).where(eq(taskLabels.taskId, taskId))

      if (labelNames.length > 0) {
        const existingLabels = await db
          .select({ id: labels.id, name: labels.name })
          .from(labels)
          .where(and(eq(labels.projectId, projectId), inArray(labels.name, labelNames)))

        const existingLabelNames = existingLabels.map((l) => l.name)
        const newLabelNames = labelNames.filter((name) => !existingLabelNames.includes(name))

        let newCreatedLabels: { id: string }[] = []

        if (newLabelNames.length > 0) {
          const labelsToInsert = newLabelNames.map((name) => ({
            projectId,
            name,
            color: "#6B7280",
          }))

          newCreatedLabels = await db
            .insert(labels)
            .values(labelsToInsert)
            .returning({ id: labels.id })
        }

        const allLabelIdsToLink = [
          ...existingLabels.map((l) => l.id),
          ...newCreatedLabels.map((l) => l.id),
        ]

        if (allLabelIdsToLink.length > 0) {
          const taskLabelsToInsert = allLabelIdsToLink.map((labelId) => ({
            taskId,
            labelId,
          }))

          await db.insert(taskLabels).values(taskLabelsToInsert)
        }
      }
    }

    await db.insert(activityLogs).values({
      projectId,
      userId,
      action: "updated",
      entityType: "task",
      entityId: taskId,
      metadata: data,
    })

    await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId))
  }

  return updated ?? null
}

/**
 * Add attachments to a task (append, not replace).
 */
export async function addTaskAttachments(
  taskId: string,
  projectId: string,
  userId: string,
  attachments: AttachmentInput[]
) {
  if (attachments.length === 0) return []

  const attachmentsToInsert = attachments.map((att) => ({
    taskId,
    url: att.url,
    name: att.name,
    size: att.size || 0,
    type: att.type || "application/octet-stream",
    uploadedById: userId,
  }))

  const inserted = await db.insert(taskAttachments).values(attachmentsToInsert).returning()

  // Log activity for each file added
  await db.insert(activityLogs).values({
    projectId,
    userId,
    action: "updated",
    entityType: "task",
    entityId: taskId,
    metadata: {
      type: "attachments_added",
      fileNames: attachments.map((a) => a.name),
      count: attachments.length,
    },
  })

  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId))

  return inserted
}

/**
 * Delete a single attachment (only the uploader can delete).
 */
export async function deleteTaskAttachment(
  attachmentId: string,
  taskId: string,
  projectId: string,
  userId: string
) {
  // Verify the attachment exists and belongs to the user
  const [attachment] = await db
    .select()
    .from(taskAttachments)
    .where(
      and(
        eq(taskAttachments.id, attachmentId),
        eq(taskAttachments.taskId, taskId),
        eq(taskAttachments.uploadedById, userId)
      )
    )
    .limit(1)

  if (!attachment) {
    throw new Error("Attachment not found or you do not have permission to delete it.")
  }

  await db.delete(taskAttachments).where(eq(taskAttachments.id, attachmentId))

  await db.insert(activityLogs).values({
    projectId,
    userId,
    action: "updated",
    entityType: "task",
    entityId: taskId,
    metadata: {
      type: "attachment_deleted",
      fileName: attachment.name,
    },
  })

  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId))

  return attachment
}

/**
 * Delete a task.
 */
export async function deleteTask(taskId: string, userId: string) {
  const [task] = await db
    .select({
      projectId: tasks.projectId,
      title: tasks.title,
    })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)

  if (!task) return

  await db.delete(tasks).where(eq(tasks.id, taskId))

  await db.insert(activityLogs).values({
    projectId: task.projectId,
    userId,
    action: "deleted",
    entityType: "task",
    entityId: taskId,
    metadata: { title: task.title },
  })

  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, task.projectId))
}

/**
 * Move a task to a different list and/or position.
 */
export async function moveTask(
  taskId: string,
  targetListId: string,
  position: number,
  userId: string
) {
  const [currentTask] = await db
    .select({
      listId: tasks.listId,
      projectId: tasks.projectId,
      title: tasks.title,
    })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)

  if (!currentTask) return null

  const [toList] = await db
    .select({ title: lists.title, type: lists.type, color: lists.color })
    .from(lists)
    .where(eq(lists.id, targetListId))
    .limit(1)

  if (!toList) throw new Error("Target list not found")

  const isNowCompleted = toList.type === "done"

  const [updated] = await db
    .update(tasks)
    .set({
      listId: targetListId,
      position,
      isCompleted: isNowCompleted,
      completedAt: isNowCompleted ? new Date() : null,
      version: sql`${tasks.version} + 1`,
    })
    .where(eq(tasks.id, taskId))
    .returning()

  if (currentTask.listId !== targetListId) {
    const [fromList] = await db
      .select({ title: lists.title, color: lists.color })
      .from(lists)
      .where(eq(lists.id, currentTask.listId))
      .limit(1)

    await db.insert(activityLogs).values({
      projectId: currentTask.projectId,
      userId,
      action: "moved",
      entityType: "task",
      entityId: taskId,
      metadata: {
        taskTitle: currentTask.title,
        from: fromList?.title ?? "Unknown",
        fromColor: fromList?.color ?? null,
        to: toList?.title ?? "Unknown",
        toColor: toList?.color ?? null,
        fromListId: currentTask.listId,
        toListId: targetListId,
        wasCompleted: isNowCompleted,
      },
    })
  }

  await db
    .update(projects)
    .set({ updatedAt: new Date() })
    .where(eq(projects.id, currentTask.projectId))

  return updated ?? null
}

/**
 * Mark a task as completed or uncompleted.
 */
export async function toggleTaskCompletion(taskId: string, isCompleted: boolean, userId: string) {
  const [updated] = await db
    .update(tasks)
    .set({
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    })
    .where(eq(tasks.id, taskId))
    .returning()

  if (updated) {
    await db.insert(activityLogs).values({
      projectId: updated.projectId,
      userId,
      action: isCompleted ? "completed" : "restored",
      entityType: "task",
      entityId: taskId,
      metadata: { title: updated.title },
    })
  }

  return updated ?? null
}

/**
 * Assign a user to a task.
 */
export async function assignTask(taskId: string, assigneeUserId: string, assignedByUserId: string) {
  const [task] = await db
    .select({ projectId: tasks.projectId, title: tasks.title })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)

  if (!task) return null

  const [assignee] = await db
    .insert(taskAssignees)
    .values({ taskId, userId: assigneeUserId })
    .onConflictDoNothing()
    .returning()

  const [assigneeUser] = await db
    .select({ firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.id, assigneeUserId))
    .limit(1)

  const assigneeName =
    [assigneeUser?.firstName, assigneeUser?.lastName].filter(Boolean).join(" ") || "a user"

  if (assignee) {
    await db.insert(activityLogs).values({
      projectId: task.projectId,
      userId: assignedByUserId,
      action: "assigned",
      entityType: "task",
      entityId: taskId,
      metadata: {
        taskTitle: task.title,
        assigneeId: assigneeUserId,
        assigneeName,
      },
    })

    // Notify assignee (skip self-assignment)
    if (assigneeUserId !== assignedByUserId) {
      const [project] = await db
        .select({ title: projects.title })
        .from(projects)
        .where(eq(projects.id, task.projectId))
        .limit(1)

      const [assigner] = await db
        .select({ firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, assignedByUserId))
        .limit(1)

      const assignerName =
        [assigner?.firstName, assigner?.lastName].filter(Boolean).join(" ") || "Someone"

      const shouldNotify = await isNotificationEnabled(assigneeUserId, "taskAssigned")
      if (shouldNotify) {
        await db.insert(notifications).values({
          userId: assigneeUserId,
          type: "task_assigned",
          title: "Task Assigned",
          message: `${assignerName} assigned you to "${task.title}" in ${project?.title || "a project"}.`,
          actionUrl: `/projects/${task.projectId}?taskId=${taskId}`,
          metadata: { projectId: task.projectId, taskId, assignedBy: assignedByUserId },
        })
      }
    }
  }

  return assignee ?? null
}

/**
 * Unassign a user from a task.
 */
export async function unassignTask(
  taskId: string,
  assigneeUserId: string,
  removedByUserId: string
) {
  const [task] = await db
    .select({ projectId: tasks.projectId, title: tasks.title })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)

  if (!task) return

  await db
    .delete(taskAssignees)
    .where(and(eq(taskAssignees.taskId, taskId), eq(taskAssignees.userId, assigneeUserId)))

  const [removedUser] = await db
    .select({ firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.id, assigneeUserId))
    .limit(1)

  const removedName =
    [removedUser?.firstName, removedUser?.lastName].filter(Boolean).join(" ") || "a user"

  await db.insert(activityLogs).values({
    projectId: task.projectId,
    userId: removedByUserId,
    action: "unassigned",
    entityType: "task",
    entityId: taskId,
    metadata: {
      taskTitle: task.title,
      assigneeId: assigneeUserId,
      assigneeName: removedName,
    },
  })

  // Notify removed user (skip self-removal)
  if (assigneeUserId !== removedByUserId) {
    const [project] = await db
      .select({ title: projects.title })
      .from(projects)
      .where(eq(projects.id, task.projectId))
      .limit(1)

    const [remover] = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, removedByUserId))
      .limit(1)

    const removerName =
      [remover?.firstName, remover?.lastName].filter(Boolean).join(" ") || "Someone"

    const shouldNotify = await isNotificationEnabled(assigneeUserId, "taskAssigned")
    if (shouldNotify) {
      await db.insert(notifications).values({
        userId: assigneeUserId,
        type: "task_assigned",
        title: "Task Unassigned",
        message: `${removerName} removed you from "${task.title}" in ${project?.title || "a project"}.`,
        actionUrl: `/projects/${task.projectId}?taskId=${taskId}`,
        metadata: { projectId: task.projectId, taskId, removedBy: removedByUserId },
      })
    }
  }
}
/**
 * Reorder tasks within a list (batch position update).
 */
export async function reorderTasks(updates: { id: string; position: number }[]) {
  await Promise.all(
    updates.map(({ id, position }) => db.update(tasks).set({ position }).where(eq(tasks.id, id)))
  )
}

/**
 * Get tasks assigned to a specific user across all projects.
 */
export async function getTasksByAssignee(userId: string) {
  const assignments = await db.query.taskAssignees.findMany({
    where: eq(taskAssignees.userId, userId),
    with: {
      task: {
        with: {
          list: true,
          project: true,
          assignees: {
            with: { user: true },
          },
          labels: {
            with: { label: true },
          },
          attachments: true,
        },
      },
    },
  })

  return assignments.map((a) => a.task)
}

/**
 * Fetch chronological activity logs for a specific task.
 */
export async function getTaskActivityLogs(taskId: string) {
  return db.query.activityLogs.findMany({
    where: or(
      // Task-level activity (created, updated, moved, completed, assigned, etc.)
      and(eq(activityLogs.entityId, taskId), eq(activityLogs.entityType, "task")),
      // Comment activity (entityType is "comment" but metadata.taskId matches)
      and(
        eq(activityLogs.entityType, "comment"),
        sql`${activityLogs.metadata}->>'taskId' = ${taskId}`
      )
    ),
    orderBy: desc(activityLogs.createdAt),
    with: {
      user: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
        },
      },
    },
  })
}
