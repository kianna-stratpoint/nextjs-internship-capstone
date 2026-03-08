/* ============================================
   Aggregation queries for the Dashboard stats
   cards and Analytics page.
   ============================================ */

import { eq, and, count, sql, gte, inArray, desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { projects, projectMembers, tasks, users } from "@/lib/db/schema"

/**
 * Get dashboard stats for a user.
 * Returns: active projects, pending tasks, completed tasks, team members.
 * Also computes trends by comparing to the previous period.
 */
export async function getDashboardStats(userId: string) {
  // Get all project IDs the user is a member of
  const memberships = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.userId, userId))

  const projectIds = memberships.map((m) => m.projectId)

  if (projectIds.length === 0) {
    return {
      activeProjects: 0,
      pendingTasks: 0,
      completedTasks: 0,
      teamMembers: 0,
      activeProjectsTrend: 0,
      pendingTasksTrend: 0,
      completedTasksTrend: 0,
      teamMembersTrend: 0,
    }
  }

  // Active projects count
  const [activeProjectsResult] = await db
    .select({ count: count() })
    .from(projects)
    .where(
      and(
        inArray(projects.id, projectIds),
        eq(projects.status, "active"),
        eq(projects.isArchived, false)
      )
    )

  // Task counts across user's projects
  const [taskStats] = await db
    .select({
      pending: count(sql`CASE WHEN ${tasks.isCompleted} = false THEN 1 END`),
      completed: count(sql`CASE WHEN ${tasks.isCompleted} = true THEN 1 END`),
    })
    .from(tasks)
    .where(inArray(tasks.projectId, projectIds))

  // Unique team members across all user's projects
  const [teamResult] = await db
    .select({
      count: sql<number>`COUNT(DISTINCT ${projectMembers.userId})`,
    })
    .from(projectMembers)
    .where(inArray(projectMembers.projectId, projectIds))

  // Trends: completed tasks this week vs last week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  const [thisWeekCompleted] = await db
    .select({ count: count() })
    .from(tasks)
    .where(
      and(
        inArray(tasks.projectId, projectIds),
        eq(tasks.isCompleted, true),
        gte(tasks.completedAt, oneWeekAgo)
      )
    )

  const [lastWeekCompleted] = await db
    .select({ count: count() })
    .from(tasks)
    .where(
      and(
        inArray(tasks.projectId, projectIds),
        eq(tasks.isCompleted, true),
        gte(tasks.completedAt, twoWeeksAgo),
        sql`${tasks.completedAt} < ${oneWeekAgo}`
      )
    )

  const completedTrend = (thisWeekCompleted?.count ?? 0) - (lastWeekCompleted?.count ?? 0)

  return {
    activeProjects: activeProjectsResult?.count ?? 0,
    pendingTasks: taskStats?.pending ?? 0,
    completedTasks: taskStats?.completed ?? 0,
    teamMembers: Number(teamResult?.count ?? 0),
    activeProjectsTrend: 0, // Projects change slowly, trend less meaningful
    pendingTasksTrend: 0,
    completedTasksTrend: completedTrend,
    teamMembersTrend: 0,
  }
}

/**
 * Get recent projects for the dashboard.
 * Returns the 5 most recently updated projects the user is a member of.
 */
export async function getRecentProjects(userId: string, limit = 5) {
  const memberships = await db.query.projectMembers.findMany({
    where: eq(projectMembers.userId, userId),
    with: {
      project: {
        with: {
          members: {
            with: { user: true },
          },
        },
      },
    },
    orderBy: desc(projectMembers.joinedAt),
    limit,
  })

  // Enrich with task counts
  const enriched = await Promise.all(
    memberships.map(async (pm) => {
      const [taskStats] = await db
        .select({
          total: count(tasks.id),
          completed: count(sql`CASE WHEN ${tasks.isCompleted} = true THEN 1 END`),
        })
        .from(tasks)
        .where(eq(tasks.projectId, pm.project.id))

      return {
        ...pm.project,
        memberRole: pm.role,
        isPinned: pm.isPinned,
        members: pm.project.members,
        _count: {
          tasks: taskStats?.total ?? 0,
          completedTasks: taskStats?.completed ?? 0,
        },
      }
    })
  )

  return enriched
}

/**
 * Get project velocity — tasks completed per week over the last N weeks.
 * Used in Analytics page charts.
 */
export async function getProjectVelocity(projectId: string, weeks = 8) {
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

    results.push({
      period: `Week ${weeks - i}`,
      completed: stats?.completed ?? 0,
      created: stats?.created ?? 0,
    })
  }

  return results
}

/**
 * Get average task completion time for a project (in hours).
 * Used in Analytics page.
 */
export async function getAverageTaskTime(projectId: string) {
  const [result] = await db
    .select({
      avgHours: sql<number>`
        AVG(
          EXTRACT(EPOCH FROM (${tasks.completedAt} - ${tasks.createdAt})) / 3600
        )
      `,
      taskCount: count(),
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.projectId, projectId),
        eq(tasks.isCompleted, true),
        sql`${tasks.completedAt} IS NOT NULL`
      )
    )

  return {
    avgCompletionHours: Math.round(result?.avgHours ?? 0),
    taskCount: result?.taskCount ?? 0,
  }
}
