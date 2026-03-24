"use server"

import { requireAuth } from "@/lib/auth"
import { getActivityForUser, getActivityByProjectId } from "@/lib/db/queries/activity"

import type { ActionResult, ActivityLogWithUser } from "@/types"

export async function getActivityLogsAction(
  projectId?: string
): Promise<ActionResult<ActivityLogWithUser[]>> {
  try {
    const { dbUserId: userId } = await requireAuth()

    const activities = projectId
      ? await getActivityByProjectId(projectId, 100)
      : await getActivityForUser(userId, 100)

    return {
      success: true,
      data: activities ?? [],
    }
  } catch (error) {
    return {
      success: false,
      error: "Failed to load activity logs.",
    }
  }
}
