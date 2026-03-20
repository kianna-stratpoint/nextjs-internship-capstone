"use server"

import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"
import { requirePermission } from "@/lib/permissions"
import { broadcastToProject } from "@/lib/pusher/server"
import { PUSHER_EVENTS } from "@/lib/pusher/events"
import { db } from "@/lib/db"
import { taskAssignees, notifications } from "@/lib/db/schema"
import { eq, and, ne } from "drizzle-orm"

import {
  createComment,
  deleteComment,
  updateComment,
  getCommentById,
  getCommentsByTaskId,
} from "@/lib/db/queries/comments"
import { createCommentSchema, updateCommentSchema } from "@/lib/validations/comment"

/**
 * Read-only — no permission check needed beyond auth
 */
export async function getCommentsAction(taskId: string) {
  try {
    const comments = await getCommentsByTaskId(taskId)
    return { success: true, data: comments }
  } catch (error) {
    return { success: false, error: "Failed to fetch comments." }
  }
}

/**
 * Create a new comment and notify assignees
 */
export async function createCommentAction(data: unknown, projectId: string) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const { taskId, content } = createCommentSchema.parse(data)

    const { error: permError } = await requirePermission(projectId, userId, "task", "comment")
    if (permError) return { success: false, error: permError }

    const comment = await createComment(taskId, userId, content)
    if (!comment) throw new Error("Failed to create comment.")

    // Notify assignees (exclude the commenter)
    const assignees = await db.query.taskAssignees.findMany({
      where: and(eq(taskAssignees.taskId, taskId), ne(taskAssignees.userId, userId)),
      with: { user: true },
    })

    if (assignees.length > 0) {
      const notificationValues = assignees.map((assignee) => ({
        userId: assignee.userId,
        type: "comment_added" as const,
        title: "New Task Comment",
        message: `Someone commented on a task you are assigned to.`,
        actionUrl: `/projects/${projectId}?task=${taskId}`,
        metadata: { taskId, commentId: comment.id },
      }))

      await db.insert(notifications).values(notificationValues)
    }

    await broadcastToProject(projectId, PUSHER_EVENTS.COMMENT_ADDED, {
      commentId: comment.id,
      taskId,
      userId,
      content,
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true, data: comment }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create comment." }
  }
}

/**
 * Update an existing comment (own comments only)
 */
export async function updateCommentAction(data: unknown, projectId: string) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const { commentId, content } = updateCommentSchema.parse(data)

    // Ownership check — only the author can edit their comment
    const existingComment = await getCommentById(commentId)
    if (!existingComment) {
      return { success: false, error: "Comment not found." }
    }
    if (existingComment.userId !== userId) {
      return { success: false, error: "Unauthorized: You can only edit your own comments." }
    }

    const updatedComment = await updateComment(commentId, content)

    revalidatePath(`/projects/${projectId}`)
    return { success: true, data: updatedComment }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update comment." }
  }
}

/**
 * Delete a comment (own comments only)
 */
export async function deleteCommentAction(commentId: string, projectId: string) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const existingComment = await getCommentById(commentId)
    if (!existingComment) {
      return { success: false, error: "Comment not found." }
    }

    if (existingComment.userId !== userId) {
      return { success: false, error: "Unauthorized: You can only delete your own comments." }
    }

    await deleteComment(commentId, userId)

    await broadcastToProject(projectId, PUSHER_EVENTS.COMMENT_DELETED, {
      commentId,
      taskId: existingComment.taskId,
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Failed to delete comment." }
  }
}
