"use client"

import { useState } from "react"
import { Loader2, BarChart3 } from "lucide-react"
import { useAnalytics } from "@/hooks/use-analytics"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AnalyticsStatsCards } from "@/components/features/analytics/analytics-stats-cards"
import {
  TasksByStatusChart,
  TasksByPriorityChart,
  VelocityChart,
  ActivityTimelineChart,
} from "@/components/features/analytics/analytics-charts"
import { AnalyticsLeaderboard } from "@/components/features/analytics/analytics-leaderboard"
import { AnalyticsActivityFeed } from "@/components/features/analytics/analytics-activity-feed"
import type { TimeRange, ActivityLogEntry } from "@/types/analytics"

/* ==================== CONSTANTS ==================== */

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
]

/* ==================== COMPONENT ==================== */

interface AnalyticsDashboardProps {
  projects: { id: string; title: string; color: string | null }[]
}

export function AnalyticsDashboard({ projects }: AnalyticsDashboardProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [range, setRange] = useState<TimeRange>("30d")

  const effectiveProjectId = selectedProjectId ?? projects[0]?.id ?? null

  const {
    stats,
    velocity,
    timeline,
    activity,
    leaderboard,
    tasksByStatus,
    tasksByPriority,
    isLoading,
  } = useAnalytics(effectiveProjectId, range)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={effectiveProjectId ?? ""} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-[320px] text-foreground">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: project.color || "#3b82f6" }}
                  />
                  <span>{project.title}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={range} onValueChange={(val) => setRange(val as TimeRange)}>
          <SelectTrigger className="w-[160px] text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty — no project */}
      {!isLoading && !effectiveProjectId && (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-muted-foreground">Select a project to view analytics</p>
        </div>
      )}

      {/* Data */}
      {!isLoading && stats && (
        <>
          <AnalyticsStatsCards stats={stats} velocity={velocity} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TasksByStatusChart data={tasksByStatus} />
            <TasksByPriorityChart data={tasksByPriority} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <VelocityChart data={velocity} />
            <ActivityTimelineChart data={timeline} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AnalyticsLeaderboard data={leaderboard} />
            <AnalyticsActivityFeed data={activity as ActivityLogEntry[]} />
          </div>
        </>
      )}
    </div>
  )
}
