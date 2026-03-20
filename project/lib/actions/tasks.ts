"use server"

import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"
import { requirePermission } from "@/lib/permissions"
import { broadcastToProject } from "@/lib/pusher/server"
import { PUSHER_EVENTS } from "@/lib/pusher/events"

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

    const { error: permError } = await requirePermission(projectId, userId, "task", "create")
    if (permError) return { success: false, error: permError }

    const task = await createTask(taskData, listId, projectId, userId, labels, attachments)

    await broadcastToProject(projectId, PUSHER_EVENTS.TASK_CREATED, {
      taskId: task.id,
      listId,
      title: task.title,
      createdBy: userId,
    })

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

    const { error: permError } = await requirePermission(projectId, userId, "task", "update")
    if (permError) return { success: false, error: permError }

    const payload = data as Record<string, any>
    const labels = payload.labels || []

    const validatedData = updateTaskSchema.parse(data)

    const updatedTask = await updateTask(taskId, validatedData, userId, labels)

    await broadcastToProject(projectId, PUSHER_EVENTS.TASK_UPDATED, {
      taskId,
      changes: validatedData,
    })

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

    const { error: permError } = await requirePermission(projectId, userId, "task", "update")
    if (permError) return { success: false, error: permError }

    const inserted = await addTaskAttachments(taskId, projectId, userId, attachments)

    await broadcastToProject(projectId, PUSHER_EVENTS.TASK_UPDATED, {
      taskId,
      changes: { attachmentsAdded: attachments.length },
    })

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

    const { error: permError } = await requirePermission(projectId, userId, "task", "update")
    if (permError) return { success: false, error: permError }

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

    await broadcastToProject(projectId, PUSHER_EVENTS.TASK_UPDATED, {
      taskId,
      changes: { attachmentDeleted: attachmentId },
    })

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

    const { error: permError } = await requirePermission(projectId, userId, "task", "delete")
    if (permError) return { success: false, error: permError }

    // Grab listId before deleting so we can include it in the broadcast
    const task = await getTaskById(taskId)
    const listId = task?.listId ?? ""

    await deleteTask(taskId, userId)

    await broadcastToProject(projectId, PUSHER_EVENTS.TASK_DELETED, {
      taskId,
      listId,
    })

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

    const { error: permError } = await requirePermission(projectId, userId, "task", "move")
    if (permError) return { success: false, error: permError }

    // Grab current listId before moving so we can broadcast fromListId
    const currentTask = await getTaskById(taskId)
    const fromListId = currentTask?.listId ?? ""

    const updatedTask = await moveTask(taskId, listId, position, userId)

    await broadcastToProject(projectId, PUSHER_EVENTS.TASK_MOVED, {
      taskId,
      fromListId,
      toListId: listId,
      position,
    })

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

    const { error: permError } = await requirePermission(projectId, userId, "task", "update")
    if (permError) return { success: false, error: permError }

    const updatedTask = await toggleTaskCompletion(taskId, isCompleted, userId)

    await broadcastToProject(projectId, PUSHER_EVENTS.TASK_COMPLETED, {
      taskId,
      isCompleted,
    })

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

    const { error: permError } = await requirePermission(projectId, userId, "task", "assign")
    if (permError) return { success: false, error: permError }

    const assignment = await assignTask(taskId, assigneeUserId, userId)

    await broadcastToProject(projectId, PUSHER_EVENTS.TASK_ASSIGNED, {
      taskId,
      assigneeId: assigneeUserId,
      assignedBy: userId,
    })

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

    const { error: permError } = await requirePermission(projectId, userId, "task", "assign")
    if (permError) return { success: false, error: permError }

    await unassignTask(taskId, assigneeUserId, userId)

    await broadcastToProject(projectId, PUSHER_EVENTS.TASK_UNASSIGNED, {
      taskId,
      assigneeId: assigneeUserId,
      removedBy: userId,
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to remove user from task." }
  }
}

/**
 * Batch reorder tasks within a list (Called after Dnd-Kit drop)
 * No individual broadcast — the move events cover DnD scenarios
 */
export async function reorderTasksAction(
  updates: { id: string; position: number }[],
  projectId: string
) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const { error: permError } = await requirePermission(projectId, userId, "task", "move")
    if (permError) return { success: false, error: permError }

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

    const { error: permError } = await requirePermission(projectId, userId, "task", "move")
    if (permError) return { success: false, error: permError }

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

/**
 * Read-only — no permissions or broadcasts needed
 */
export async function getTaskActivityLogsAction(taskId: string) {
  try {
    const logs = await getTaskActivityLogs(taskId)
    return { data: logs }
  } catch (error) {
    return { error: "Failed to fetch activity logs" }
  }
}

/**
 * Read-only — no permissions or broadcasts needed
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
