import { eq, and, asc, desc, count, sql, lte, gte, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { tasks, taskAssignees, activityLogs, lists, type NewTask } from "@/lib/db/schema"

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
 * Position defaults to end of list (max + 1000).
 */
export async function createTask(
  data: Pick<NewTask, "title" | "description" | "priority" | "startDate" | "dueDate">,
  listId: string,
  projectId: string,
  createdById: string
) {
  // Find the highest position in the list
  const existingTasks = await db
    .select({ position: tasks.position })
    .from(tasks)
    .where(eq(tasks.listId, listId))
    .orderBy(desc(tasks.position))
    .limit(1)

  const maxPosition = existingTasks[0]?.position ?? -1000

  const [task] = await db
    .insert(tasks)
    .values({
      ...data,
      listId,
      projectId,
      createdById,
      position: maxPosition + 1000,
    })
    .returning()

  // SAFETY CHECK
  if (!task) {
    throw new Error("Failed to create task. Database returned undefined.")
  }

  await db.insert(activityLogs).values({
    projectId,
    userId: createdById,
    action: "created",
    entityType: "task",
    entityId: task.id,
    metadata: { title: task.title },
  })

  return task
}

/**
 * Update task details.
 */
export async function updateTask(
  taskId: string,
  data: Partial<Pick<NewTask, "title" | "description" | "priority" | "startDate" | "dueDate">>,
  userId: string
) {
  const [updated] = await db.update(tasks).set(data).where(eq(tasks.id, taskId)).returning()

  if (updated) {
    await db.insert(activityLogs).values({
      projectId: updated.projectId,
      userId,
      action: "updated",
      entityType: "task",
      entityId: taskId,
      metadata: data,
    })
  }

  return updated ?? null
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
}

/**
 * Move a task to a different list and/or position.
 * Used by dnd-kit drag-and-drop.
 */
export async function moveTask(
  taskId: string,
  targetListId: string,
  position: number,
  userId: string
) {
  // Get current task state for the activity log
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

  // Get list names for the activity log
  const [fromList] = await db
    .select({ title: lists.title })
    .from(lists)
    .where(eq(lists.id, currentTask.listId))
    .limit(1)

  const [toList] = await db
    .select({ title: lists.title })
    .from(lists)
    .where(eq(lists.id, targetListId))
    .limit(1)

  const [updated] = await db
    .update(tasks)
    .set({ listId: targetListId, position })
    .where(eq(tasks.id, taskId))
    .returning()

  // Only log if the list actually changed (not just reordering within same list)
  if (currentTask.listId !== targetListId) {
    await db.insert(activityLogs).values({
      projectId: currentTask.projectId,
      userId,
      action: "moved",
      entityType: "task",
      entityId: taskId,
      metadata: {
        taskTitle: currentTask.title,
        from: fromList?.title ?? "Unknown",
        to: toList?.title ?? "Unknown",
        fromListId: currentTask.listId,
        toListId: targetListId,
      },
    })
  }

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
  // Get task's projectId for the activity log
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
      },
    })
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

  await db.insert(activityLogs).values({
    projectId: task.projectId,
    userId: removedByUserId,
    action: "unassigned",
    entityType: "task",
    entityId: taskId,
    metadata: {
      taskTitle: task.title,
      assigneeId: assigneeUserId,
    },
  })
}

/**
 * Reorder tasks within a list (batch position update).
 * Used by dnd-kit after drag-and-drop.
 */
export async function reorderTasks(updates: { id: string; position: number }[]) {
  await Promise.all(
    updates.map(({ id, position }) => db.update(tasks).set({ position }).where(eq(tasks.id, id)))
  )
}

/**
 * Get tasks assigned to a specific user across all projects.
 * Used for "My Tasks" views.
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
        },
      },
    },
  })

  return assignments.map((a) => a.task)
}
