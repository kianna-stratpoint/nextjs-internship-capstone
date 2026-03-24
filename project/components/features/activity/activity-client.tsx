"use client"

import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Activity, Loader2 } from "lucide-react"
import { getActivityLogsAction } from "@/lib/actions/activity"
import { useTeamMembers } from "@/hooks/use-team-member"

import { ActivityFilters } from "@/components/features/activity/activity-filters"
import { ActivityItem } from "@/components/features/activity/activity-item"
import {
  getActivityCategory,
  formatActivityMessage,
  ActivityMetadata,
} from "@/components/features/activity/activity-utils"

import type { ActivityLogWithUser } from "@/types"

interface ActivityClientProps {
  initialActivities: ActivityLogWithUser[]
}

export function ActivityClient({ initialActivities }: ActivityClientProps) {
  const [isMounted, setIsMounted] = useState(false)

  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const { memberProjects } = useTeamMembers(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activity-logs", projectFilter],
    queryFn: async () => {
      const result = await getActivityLogsAction(
        projectFilter === "all" ? undefined : projectFilter
      )
      if (!result.success) throw new Error(result.error)
      return result.data
    },

    initialData: projectFilter === "all" ? initialActivities : undefined,
  })

  // Client-side filtering
  const filteredActivities = useMemo(() => {
    let filtered = activities

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (a: any) => getActivityCategory(a.action, a.entityType) === categoryFilter
      )
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((a: any) => {
        const userName = `${a.user?.firstName || ""} ${a.user?.lastName || ""}`.toLowerCase()
        const meta = a.metadata as ActivityMetadata | null
        const title = (meta?.title || meta?.taskTitle || "").toLowerCase()
        const projectTitle = (a.project?.title || "").toLowerCase()
        const message = formatActivityMessage(a.action, a.entityType, meta).toLowerCase()
        return (
          userName.includes(q) ||
          title.includes(q) ||
          projectTitle.includes(q) ||
          message.includes(q)
        )
      })
    }

    return filtered
  }, [activities, categoryFilter, searchQuery])

  // Group by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, any[]> = {}

    for (const activity of filteredActivities) {
      const date = isMounted
        ? new Date(activity.createdAt).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "Recent Activity" // Safe, static server fallback

      if (!groups[date]) groups[date] = []
      groups[date].push(activity)
    }

    return groups
  }, [filteredActivities, isMounted])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Activity</h1>
        <p className="mt-1 text-muted-foreground">Full history of actions across your projects</p>
      </div>

      <ActivityFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        projectFilter={projectFilter}
        setProjectFilter={setProjectFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        memberProjects={isMounted ? memberProjects : []}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <Activity className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-muted-foreground">
            {searchQuery || categoryFilter !== "all"
              ? "No matching activity found"
              : "No activity yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedActivities).map(([date, items]) => (
            <div key={date}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {date}
              </h3>
              <div className="space-y-1">
                {items.map((activity: any) => (
                  <ActivityItem key={activity.id} isMounted={isMounted} activity={activity} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
