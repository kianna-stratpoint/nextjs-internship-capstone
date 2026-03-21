"use server"

/* ============================================
   Analytics Server Action

   Single action that fetches all analytics
   data for a project in one call.
   Permission: any project member can view.
   ============================================ */

import { requireAuth } from "@/lib/auth"
import { requirePermission } from "@/lib/permissions"
import {
  getProjectStats,
  getProjectVelocity,
  getActivityTimeline,
  getRecentActivity,
  getMemberLeaderboard,
  getTasksByStatus,
  getTasksByPriority,
  type TimeRange,
} from "@/lib/db/queries/analytics"

export async function getProjectAnalyticsAction(projectId: string, range: TimeRange = "30d") {
  try {
    const { dbUserId: userId } = await requireAuth()

    // Any member can view analytics (read permission on project)
    const { error: permError } = await requirePermission(projectId, userId, "project", "read")
    if (permError) return { success: false, error: permError }

    // Fetch all data in parallel
    const [stats, velocity, timeline, activity, leaderboard, tasksByStatus, tasksByPriority] =
      await Promise.all([
        getProjectStats(projectId, range),
        getProjectVelocity(projectId, range),
        getActivityTimeline(projectId, range),
        getRecentActivity(projectId, range),
        getMemberLeaderboard(projectId, range),
        getTasksByStatus(projectId),
        getTasksByPriority(projectId),
      ])

    return {
      success: true,
      data: {
        stats,
        velocity,
        timeline,
        activity,
        leaderboard,
        tasksByStatus,
        tasksByPriority,
      },
    }
  } catch (error) {
    return { success: false, error: "Failed to load analytics." }
  }
}
