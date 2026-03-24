"use client"

/* ============================================
   useAnalytics Hook

   Fetches all analytics data for a project
   with time range filtering.
   ============================================ */

import { useQuery } from "@tanstack/react-query"
import { getProjectAnalyticsAction } from "@/lib/actions/analytics"
import type { TimeRange, AnalyticsData } from "@/types/analytics"

export function useAnalytics(projectId: string | null, range: TimeRange = "30d") {
  const {
    data: analyticsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["analytics", projectId, range],
    queryFn: async () => {
      if (!projectId) return null
      const result = await getProjectAnalyticsAction(projectId, range)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!projectId,
    staleTime: 60_000,
  })

  return {
    stats: analyticsData?.stats ?? null,
    velocity: analyticsData?.velocity ?? [],
    timeline: analyticsData?.timeline ?? [],
    activity: analyticsData?.activity ?? [],
    leaderboard: analyticsData?.leaderboard ?? [],
    tasksByStatus: analyticsData?.tasksByStatus ?? [],
    tasksByPriority: analyticsData?.tasksByPriority ?? [],
    isLoading,
    isError,
    error,
  }
}
