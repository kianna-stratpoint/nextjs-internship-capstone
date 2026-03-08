import { eq, desc, and, inArray, gte, sql, count } from "drizzle-orm"
import { db } from "@/lib/db"
import { activityLogs, projectMembers, type NewActivityLog } from "@/lib/db/schema"

/**
 * Get recent activity for a specific project.
 * Used on the Kanban board project page.
 */
export async function getActivityByProjectId(projectId: string, limit = 20) {
  return db.query.activityLogs.findMany({
    where: eq(activityLogs.projectId, projectId),
    orderBy: desc(activityLogs.createdAt),
    limit,
    with: {
      user: true,
    },
  })
}

/**
 * Get recent activity across all projects a user is a member of.
 * Used on the Dashboard "Recent Activity" section.
 */
export async function getActivityForUser(userId: string, limit = 20) {
  // Get all project IDs the user is a member of
  const memberships = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.userId, userId))

  const projectIds = memberships.map((m) => m.projectId)

  if (projectIds.length === 0) return []

  return db.query.activityLogs.findMany({
    where: inArray(activityLogs.projectId, projectIds),
    orderBy: desc(activityLogs.createdAt),
    limit,
    with: {
      user: true,
      project: true,
    },
  })
}

/**
 * Log an activity. Convenience wrapper for direct inserts.
 */
export async function logActivity(data: NewActivityLog) {
  const [log] = await db.insert(activityLogs).values(data).returning()
  return log
}

/**
 * Get activity count grouped by day for a project.
 * Used for Analytics "Team Activity Timeline".
 */
export async function getActivityTimeline(projectId: string, days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const result = await db
    .select({
      date: sql<string>`DATE(${activityLogs.createdAt})`,
      count: count(activityLogs.id),
    })
    .from(activityLogs)
    .where(and(eq(activityLogs.projectId, projectId), gte(activityLogs.createdAt, since)))
    .groupBy(sql`DATE(${activityLogs.createdAt})`)
    .orderBy(sql`DATE(${activityLogs.createdAt})`)

  return result
}
