/* ============================================
   Analytics Queries

   Aggregation layer for project & team
   productivity metrics. All queries are
   scoped to a single project.
   ============================================ */

import { eq, and, count, sql, gte, lte, desc, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { tasks, taskAssignees, projectMembers, activityLogs, users, lists } from "@/lib/db/schema"
import type { TimeRange } from "@/types/analytics"

export type { TimeRange } from "@/types/analytics"

function getDateThreshold(range: TimeRange): Date | null {
  if (range === "all") return null
  const date = new Date()
  date.setDate(date.getDate() - (range === "7d" ? 7 : 30))
  return date
}

/* ==================== SUMMARY STATS ==================== */

/**
 * Get overview stats for a project within a time range.
 */
export async function getProjectStats(projectId: string, range: TimeRange) {
  const since = getDateThreshold(range)

  // Total tasks in project
  const taskWhere = since
    ? and(eq(tasks.projectId, projectId), gte(tasks.createdAt, since))
    : eq(tasks.projectId, projectId)

  const [taskStats] = await db
    .select({
      total: count(),
      completed: count(sql`CASE WHEN ${tasks.isCompleted} = true THEN 1 END`),
      pending: count(sql`CASE WHEN ${tasks.isCompleted} = false THEN 1 END`),
    })
    .from(tasks)
    .where(taskWhere)

  // Team efficiency: completed / total assigned (not just total tasks)
  const assignedTaskIds = await db
    .select({ taskId: taskAssignees.taskId })
    .from(taskAssignees)
    .innerJoin(tasks, eq(tasks.id, taskAssignees.taskId))
    .where(
      since
        ? and(eq(tasks.projectId, projectId), gte(tasks.createdAt, since))
        : eq(tasks.projectId, projectId)
    )

  const uniqueAssignedIds = [...new Set(assignedTaskIds.map((r) => r.taskId))]

  let assignedCompleted = 0
  if (uniqueAssignedIds.length > 0) {
    const [result] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(inArray(tasks.id, uniqueAssignedIds), eq(tasks.isCompleted, true)))
    assignedCompleted = result?.count ?? 0
  }

  const efficiency =
    uniqueAssignedIds.length > 0
      ? Math.round((assignedCompleted / uniqueAssignedIds.length) * 100)
      : 0

  // Active users in last 7 days (always 7d regardless of range filter)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [activeUsersResult] = await db
    .select({
      count: sql<number>`COUNT(DISTINCT ${activityLogs.userId})`,
    })
    .from(activityLogs)
    .where(and(eq(activityLogs.projectId, projectId), gte(activityLogs.createdAt, sevenDaysAgo)))

  // Average completion time (hours)
  const completionWhere = since
    ? and(
        eq(tasks.projectId, projectId),
        eq(tasks.isCompleted, true),
        sql`${tasks.completedAt} IS NOT NULL`,
        gte(tasks.completedAt, since)
      )
    : and(
        eq(tasks.projectId, projectId),
        eq(tasks.isCompleted, true),
        sql`${tasks.completedAt} IS NOT NULL`
      )

  const [avgTime] = await db
    .select({
      avgHours: sql<number>`
        AVG(
          EXTRACT(EPOCH FROM (${tasks.completedAt} - ${tasks.createdAt})) / 3600
        )
      `,
    })
    .from(tasks)
    .where(completionWhere)

  const avgHours = avgTime?.avgHours ?? 0
  const avgDays = avgHours > 0 ? Math.round((avgHours / 24) * 10) / 10 : 0

  return {
    totalTasks: taskStats?.total ?? 0,
    completedTasks: taskStats?.completed ?? 0,
    pendingTasks: taskStats?.pending ?? 0,
    efficiency,
    activeUsers: Number(activeUsersResult?.count ?? 0),
    avgCompletionDays: avgDays,
    avgCompletionHours: Math.round(avgHours),
    totalAssigned: uniqueAssignedIds.length,
  }
}

/* ==================== VELOCITY (WEEKLY) ==================== */

/**
 * Tasks completed vs created per week.
 * Returns data points for a line/bar chart.
 */
export async function getProjectVelocity(projectId: string, range: TimeRange) {
  const weeks = range === "7d" ? 4 : range === "30d" ? 8 : 12
  const results = []
  const now = new Date()

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() - i * 7)

    const [stats] = await db
      .select({
        completed: count(
          sql`CASE WHEN ${tasks.isCompleted} = true AND ${tasks.completedAt} >= ${weekStart} AND ${tasks.completedAt} < ${weekEnd} THEN 1 END`
        ),
        created: count(
          sql`CASE WHEN ${tasks.createdAt} >= ${weekStart} AND ${tasks.createdAt} < ${weekEnd} THEN 1 END`
        ),
      })
      .from(tasks)
      .where(eq(tasks.projectId, projectId))

    // Format label
    const label = weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })

    results.push({
      period: label,
      completed: stats?.completed ?? 0,
      created: stats?.created ?? 0,
    })
  }

  return results
}

/* ==================== ACTIVITY TIMELINE ==================== */

/**
 * Activity count grouped by day.
 * Returns data points for an area chart.
 */
export async function getActivityTimeline(projectId: string, range: TimeRange) {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
  const since = new Date()
  since.setDate(since.getDate() - days)

  const result = await db
    .select({
      date: sql<string>`TO_CHAR(${activityLogs.createdAt}, 'YYYY-MM-DD')`,
      count: count(activityLogs.id),
    })
    .from(activityLogs)
    .where(and(eq(activityLogs.projectId, projectId), gte(activityLogs.createdAt, since)))
    .groupBy(sql`TO_CHAR(${activityLogs.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${activityLogs.createdAt}, 'YYYY-MM-DD')`)

  // Fill in missing days with 0
  const filled = []
  const dateMap = new Map(result.map((r) => [r.date, r.count]))

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    filled.push({
      date: label,
      activities: dateMap.get(key) ?? 0,
    })
  }

  return filled
}

/* ==================== TASKS BY STATUS (LIST TYPE) ==================== */

/**
 * Task count grouped by list type (To Do, In Progress, Review, Done).
 * Used for the donut/pie chart.
 */
export async function getTasksByStatus(projectId: string) {
  const result = await db
    .select({
      type: lists.type,
      title: lists.title,
      count: count(tasks.id),
    })
    .from(tasks)
    .innerJoin(lists, eq(lists.id, tasks.listId))
    .where(eq(tasks.projectId, projectId))
    .groupBy(lists.type, lists.title)
    .orderBy(lists.type)

  return result.map((r) => ({
    name: r.title,
    type: r.type,
    value: r.count,
  }))
}

/* ==================== TASKS BY PRIORITY ==================== */

/**
 * Open (non-completed) task count grouped by priority.
 * Includes "No Priority" for tasks without a priority set.
 */
export async function getTasksByPriority(projectId: string) {
  const result = await db
    .select({
      priority: tasks.priority,
      count: count(tasks.id),
    })
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.isCompleted, false)))
    .groupBy(tasks.priority)

  // Map to chart-friendly format with consistent ordering
  const priorityOrder = ["high", "medium", "low", null]
  const priorityLabels: Record<string, string> = {
    high: "High",
    medium: "Medium",
    low: "Low",
  }

  return priorityOrder
    .map((p) => {
      const found = result.find((r) => r.priority === p)
      return {
        name: p ? priorityLabels[p] || p : "No Priority",
        value: found?.count ?? 0,
      }
    })
    .filter((r) => r.value > 0)
}

/* ==================== RECENT ACTIVITY LIST ==================== */

/**
 * Recent activity log entries with user and project info.
 * Metadata contains task titles, move details, etc.
 */
export async function getRecentActivity(projectId: string, range: TimeRange, limit = 30) {
  const since = getDateThreshold(range)

  const where = since
    ? and(eq(activityLogs.projectId, projectId), gte(activityLogs.createdAt, since))
    : eq(activityLogs.projectId, projectId)

  return db.query.activityLogs.findMany({
    where,
    orderBy: [desc(activityLogs.createdAt)],
    limit,
    with: {
      user: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
        },
      },
      project: {
        columns: {
          id: true,
          title: true,
          color: true,
        },
      },
    },
  })
}

/* ==================== MEMBER LEADERBOARD ==================== */

/**
 * Top contributors by tasks completed.
 */
export async function getMemberLeaderboard(projectId: string, range: TimeRange) {
  const since = getDateThreshold(range)

  const completionWhere = since
    ? and(
        eq(tasks.projectId, projectId),
        eq(tasks.isCompleted, true),
        sql`${tasks.completedAt} IS NOT NULL`,
        gte(tasks.completedAt, since)
      )
    : and(
        eq(tasks.projectId, projectId),
        eq(tasks.isCompleted, true),
        sql`${tasks.completedAt} IS NOT NULL`
      )

  // Get completed task IDs
  const completedTasks = await db.select({ id: tasks.id }).from(tasks).where(completionWhere)

  const completedIds = completedTasks.map((t) => t.id)

  if (completedIds.length === 0) return []

  // Count completions per assignee
  const leaderboard = await db
    .select({
      userId: taskAssignees.userId,
      completedCount: count(),
    })
    .from(taskAssignees)
    .where(inArray(taskAssignees.taskId, completedIds))
    .groupBy(taskAssignees.userId)
    .orderBy(desc(count()))
    .limit(10)

  // Enrich with user details
  const enriched = await Promise.all(
    leaderboard.map(async (entry) => {
      const [user] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          imageUrl: users.imageUrl,
        })
        .from(users)
        .where(eq(users.id, entry.userId))
        .limit(1)

      return {
        ...entry,
        user: user ?? null,
      }
    })
  )

  return enriched
}
