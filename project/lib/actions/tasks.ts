"use server"

import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"

import {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  toggleTaskCompletion,
  assignTask,
  unassignTask,
  reorderTasks,
  getTaskById,
  getTasksByListId,
  getTaskActivityLogs,
  addTaskAttachments,
  deleteTaskAttachment,
} from "@/lib/db/queries/tasks"

import { getUserProjectRole } from "@/lib/db/queries/projects"

import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  assignTaskSchema,
} from "@/lib/validations/task"
import { UTApi } from "uploadthing/server"

const utapi = new UTApi()

/**
 * Create a new task
 */
export async function createTaskAction(data: unknown) {
  try {
    const { dbUserId: userId } = await requireAuth()

    if (!(data instanceof FormData)) {
      return { success: false, error: "Invalid form data format." }
    }

    const rawData = {
      title: data.get("title"),
      description: data.get("description") || null,
      priority: data.get("priority") || null,
      listId: data.get("listId"),
      projectId: data.get("projectId"),
      startDate: data.get("startDate") ? new Date(data.get("startDate") as string) : null,
      dueDate: data.get("dueDate") ? new Date(data.get("dueDate") as string) : null,
    }

    const validatedData = createTaskSchema.parse(rawData)
    const { listId, projectId, ...taskData } = validatedData

    const labelsString = data.get("labels") as string
    const labels = labelsString ? JSON.parse(labelsString) : []

    const attachmentsString = data.get("attachments") as string
    const attachments = attachmentsString ? JSON.parse(attachmentsString) : []

    const role = await getUserProjectRole(projectId, userId)
    if (!role) return { success: false, error: "Unauthorized: Not a project member." }
    if (role === "viewer")
      return { success: false, error: "Unauthorized: Viewers cannot create tasks." }

    const task = await createTask(taskData, listId, projectId, userId, labels, attachments)

    revalidatePath(`/projects/${projectId}`)
    return { success: true, data: task }
  } catch (error) {
    return { success: false, error: "Failed to create task. Please check your inputs." }
  }
}

/**
 * Update an existing task (fields only — no attachment wipe-and-replace)
 */
export async function updateTaskAction(taskId: string, projectId: string, data: unknown) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const payload = data as Record<string, any>
    const labels = payload.labels || []

    const validatedData = updateTaskSchema.parse(data)

    const role = await getUserProjectRole(projectId, userId)
    if (!role) return { success: false, error: "Unauthorized: Not a project member." }
    if (role === "viewer")
      return { success: false, error: "Unauthorized: Viewers cannot edit tasks." }

    // RBAC: Contributor can only edit their own
    if (role === "contributor") {
      const existingTask = await getTaskById(taskId)
      if (existingTask?.createdById !== userId) {
        return {
          success: false,
          error: "Unauthorized: Contributors can only edit tasks they created.",
        }
      }
    }

    const updatedTask = await updateTask(taskId, validatedData, userId, labels)

    revalidatePath(`/projects/${projectId}`)
    return { success: true, data: updatedTask }
  } catch (error) {
    return { success: false, error: "Failed to update task." }
  }
}

/**
 * Add attachments to a task (after uploading to UploadThing on client)
 */
export async function addTaskAttachmentsAction(
  taskId: string,
  projectId: string,
  attachments: { url: string; name: string; size: number; type: string }[]
) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const role = await getUserProjectRole(projectId, userId)
    if (!role) return { success: false, error: "Unauthorized: Not a project member." }
    if (role === "viewer")
      return { success: false, error: "Unauthorized: Viewers cannot add attachments." }

    const inserted = await addTaskAttachments(taskId, projectId, userId, attachments)

    revalidatePath(`/projects/${projectId}`)
    return { success: true, data: inserted }
  } catch (error) {
    return { success: false, error: "Failed to add attachments." }
  }
}

/**
 * Delete a single attachment (only uploader can delete; also removes from UploadThing)
 */
export async function deleteTaskAttachmentAction(
  attachmentId: string,
  taskId: string,
  projectId: string
) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const role = await getUserProjectRole(projectId, userId)
    if (!role) return { success: false, error: "Unauthorized: Not a project member." }
    if (role === "viewer")
      return { success: false, error: "Unauthorized: Viewers cannot delete attachments." }

    // This will throw if user is not the uploader
    const deleted = await deleteTaskAttachment(attachmentId, taskId, projectId, userId)

    // Clean up from UploadThing storage
    if (deleted.url.includes("/f/")) {
      const fileKey = deleted.url.split("/f/")[1] as string
      try {
        await utapi.deleteFiles([fileKey])
      } catch (utError) {
        // Don't block the DB delete if UT cleanup fails
      }
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to delete attachment.",
    }
  }
}

/**
 * Delete a task
 */
export async function deleteTaskAction(taskId: string, projectId: string) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const role = await getUserProjectRole(projectId, userId)
    if (!role) return { success: false, error: "Unauthorized: Not a project member." }
    if (role === "viewer")
      return { success: false, error: "Unauthorized: Viewers cannot delete tasks." }

    if (role === "contributor") {
      const existingTask = await getTaskById(taskId)
      if (existingTask?.createdById !== userId) {
        return {
          success: false,
          error: "Unauthorized: Contributors can only delete tasks they created.",
        }
      }
    }

    await deleteTask(taskId, userId)

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete task." }
  }
}

/**
 * Move a task between lists or update its position
 */
export async function moveTaskAction(data: unknown, projectId: string) {
  try {
    const { dbUserId: userId } = await requireAuth()
    const { taskId, listId, position } = moveTaskSchema.parse(data)

    const role = await getUserProjectRole(projectId, userId)
    if (!role) return { success: false, error: "Unauthorized: Not a project member." }
    if (role === "viewer")
      return { success: false, error: "Unauthorized: Viewers cannot move tasks." }

    const updatedTask = await moveTask(taskId, listId, position, userId)

    revalidatePath(`/projects/${projectId}`, "layout")
    return { success: true, data: updatedTask }
  } catch (error) {
    return { success: false, error: "Failed to move task." }
  }
}

/**
 * Toggle task completion status
 */
export async function toggleTaskCompletionAction(
  taskId: string,
  projectId: string,
  isCompleted: boolean
) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const role = await getUserProjectRole(projectId, userId)
    if (!role) return { success: false, error: "Unauthorized: Not a project member." }
    if (role === "viewer")
      return { success: false, error: "Unauthorized: Viewers cannot modify tasks." }

    const updatedTask = await toggleTaskCompletion(taskId, isCompleted, userId)

    revalidatePath(`/projects/${projectId}`)
    return { success: true, data: updatedTask }
  } catch (error) {
    return { success: false, error: "Failed to update task status." }
  }
}

/**
 * Assign a user to a task
 */
export async function assignTaskAction(data: unknown, projectId: string) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const { taskId, assigneeUserId } = assignTaskSchema.parse(data)

    const role = await getUserProjectRole(projectId, userId)
    if (!role) return { success: false, error: "Unauthorized: Not a project member." }
    if (role === "viewer")
      return { success: false, error: "Unauthorized: Viewers cannot assign tasks." }

    const assignment = await assignTask(taskId, assigneeUserId, userId)

    revalidatePath(`/projects/${projectId}`)
    return { success: true, data: assignment }
  } catch (error) {
    return { success: false, error: "Failed to assign user to task." }
  }
}

/**
 * Unassign a user from a task
 */
export async function unassignTaskAction(data: unknown, projectId: string) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const { taskId, assigneeUserId } = assignTaskSchema.parse(data)

    const role = await getUserProjectRole(projectId, userId)
    if (!role) return { success: false, error: "Unauthorized: Not a project member." }
    if (role === "viewer")
      return { success: false, error: "Unauthorized: Viewers cannot modify assignments." }

    await unassignTask(taskId, assigneeUserId, userId)

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to remove user from task." }
  }
}

/**
 * Batch reorder tasks within a list (Called after Dnd-Kit drop)
 */
export async function reorderTasksAction(
  updates: { id: string; position: number }[],
  projectId: string
) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const role = await getUserProjectRole(projectId, userId)
    if (!role) return { success: false, error: "Unauthorized: Not a project member." }
    if (role === "viewer")
      return { success: false, error: "Unauthorized: Viewers cannot reorder tasks." }

    await reorderTasks(updates)

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to save new task order." }
  }
}

/**
 * Background task to re-space positions when they hit 0 or collide
 */
export async function rebalanceTasksAction(listId: string, projectId: string) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const role = await getUserProjectRole(projectId, userId)
    if (!role) return { success: false, error: "Unauthorized: Not a project member." }
    if (role === "viewer")
      return { success: false, error: "Unauthorized: Viewers cannot reorder tasks." }

    const existingTasks = await getTasksByListId(listId)

    if (!existingTasks || existingTasks.length === 0) {
      return { success: true }
    }

    const updates = existingTasks.map((task, index) => ({
      id: task.id,
      position: (index + 1) * 1024,
    }))

    await reorderTasks(updates)

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to rebalance task positions." }
  }
}

export async function getTaskActivityLogsAction(taskId: string) {
  try {
    const logs = await getTaskActivityLogs(taskId)
    return { data: logs }
  } catch (error) {
    return { error: "Failed to fetch activity logs" }
  }
}

/**
 * Get a single task with full details (attachments, labels, assignees, comments).
 * Used by TaskSheet to get fresh data independent of the board's list query.
 */
export async function getTaskByIdAction(taskId: string) {
  try {
    await requireAuth()
    const task = await getTaskById(taskId)
    if (!task) return { error: "Task not found" }
    return { data: task }
  } catch (error) {
    return { error: "Failed to fetch task details" }
  }
}
