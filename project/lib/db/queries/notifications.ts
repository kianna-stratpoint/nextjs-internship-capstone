/* ============================================
   File: lib/db/queries/notifications.ts
   Action: CREATE new file
   Task: 3.5
   ============================================ */

import { eq, and, desc, count } from "drizzle-orm"
import { db } from "@/lib/db"
import { notifications, type NewNotification } from "@/lib/db/schema"

/**
 * Get notifications for a user, newest first.
 */
export async function getNotificationsByUserId(userId: string, limit = 20) {
  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: desc(notifications.createdAt),
    limit,
  })
}

/**
 * Get unread notification count for a user.
 * Used for the bell icon badge.
 */
export async function getUnreadNotificationCount(userId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))

  return result?.count ?? 0
}

/**
 * Create a notification.
 */
export async function createNotification(data: NewNotification) {
  const [notification] = await db.insert(notifications).values(data).returning()

  return notification
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(notificationId: string) {
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId))
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsAsRead(userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
}
