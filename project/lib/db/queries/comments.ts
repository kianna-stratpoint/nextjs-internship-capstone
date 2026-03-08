import { eq, asc } from "drizzle-orm"
import { db } from "@/lib/db"
import { comments, tasks, activityLogs } from "@/lib/db/schema"

/**
 * Get all comments for a task, ordered by creation date.
 */
export async function getCommentsByTaskId(taskId: string) {
  return db.query.comments.findMany({
    where: eq(comments.taskId, taskId),
    orderBy: asc(comments.createdAt),
    with: {
      user: true,
    },
  })
}

/**
 * Create a comment on a task.
 */
export async function createComment(taskId: string, userId: string, content: string) {
  // Get task's projectId for the activity log
  const [task] = await db
    .select({ projectId: tasks.projectId, title: tasks.title })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)

  if (!task) return null

  const [comment] = await db.insert(comments).values({ taskId, userId, content }).returning()

  // SAFETY CHECK
  if (!comment) {
    throw new Error("Failed to create comment. Database returned undefined.")
  }

  await db.insert(activityLogs).values({
    projectId: task.projectId,
    userId,
    action: "commented",
    entityType: "comment",
    entityId: comment.id,
    metadata: {
      taskId,
      taskTitle: task.title,
      preview: content.slice(0, 100),
    },
  })

  return comment
}

/**
 * Delete a comment.
 */
export async function deleteComment(commentId: string, userId: string) {
  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    with: { task: true },
  })

  if (!comment) return

  await db.delete(comments).where(eq(comments.id, commentId))

  await db.insert(activityLogs).values({
    projectId: comment.task.projectId,
    userId,
    action: "deleted",
    entityType: "comment",
    entityId: commentId,
    metadata: {
      taskId: comment.taskId,
      preview: comment.content.slice(0, 100),
    },
  })
}
