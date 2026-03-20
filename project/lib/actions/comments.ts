"use server"

import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { taskAssignees, notifications } from "@/lib/db/schema"
import { eq, and, ne } from "drizzle-orm"

import {
  createComment,
  deleteComment,
  updateComment,
  getCommentById,
} from "@/lib/db/queries/comments"
import { getUserProjectRole } from "@/lib/db/queries/projects"
import { createCommentSchema, updateCommentSchema } from "@/lib/validations/comment"
import { getCommentsByTaskId } from "@/lib/db/queries/comments"

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

    const role = await getUserProjectRole(projectId, userId)
    if (!role) return { success: false, error: "Unauthorized: Not a project member." }
    if (role === "viewer") {
      return { success: false, error: "Unauthorized: Viewers cannot comment." }
    }

    const comment = await createComment(taskId, userId, content)
    if (!comment) throw new Error("Failed to create comment.")

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

    revalidatePath(`/projects/${projectId}`)
    return { success: true, data: comment }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create comment." }
  }
}

/**
 * Update an existing comment
 */
export async function updateCommentAction(data: unknown, projectId: string) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const { commentId, content } = updateCommentSchema.parse(data)

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
 * Delete a comment
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

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Failed to delete comment." }
  }
}
