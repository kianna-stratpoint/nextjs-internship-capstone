"use client"

import { TrendingUp, BarChart3, Users, Clock } from "lucide-react"
import type { AnalyticsStats, VelocityDataPoint } from "@/types/analytics"

interface AnalyticsStatsCardsProps {
  stats: AnalyticsStats
  velocity: VelocityDataPoint[]
}

export function AnalyticsStatsCards({ stats, velocity }: AnalyticsStatsCardsProps) {
  const latestVelocity = velocity.length > 0 ? (velocity[velocity.length - 1]?.completed ?? 0) : 0

  const metrics = [
    {
      label: "Project Velocity",
      value: `${latestVelocity}`,
      unit: "tasks/week",
      icon: TrendingUp,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Team Efficiency",
      value: `${stats.efficiency}%`,
      unit: "completion rate",
      icon: BarChart3,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Active Users",
      value: `${stats.activeUsers}`,
      unit: "this week",
      icon: Users,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Avg. Task Time",
      value: `${stats.avgCompletionDays}`,
      unit: "days",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${metric.bg}`}>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{metric.value}</p>
          <p className="text-xs text-muted-foreground">{metric.unit}</p>
          <p className="mt-1 text-xs font-medium text-foreground">{metric.label}</p>
        </div>
      ))}
    </div>
  )
}
