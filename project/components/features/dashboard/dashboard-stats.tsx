import { requireAuth } from "@/lib/auth"
import { getDashboardStats } from "@/lib/db/queries/dashboard"
import { FolderOpen, Clock, CheckCircle, Users, type LucideIcon } from "lucide-react"

import type { DashboardStats as DashboardStatsType } from "@/types"

interface StatCard {
  label: string
  value: number
  trend: string
  trendUp: boolean
  icon: LucideIcon
  iconColor: string
  iconBg: string
  accent: string
}

export async function DashboardStats() {
  const { dbUserId: userId } = await requireAuth()

  const data: DashboardStatsType = await getDashboardStats(userId)

  const stats: StatCard[] = [
    {
      label: "Active Projects",
      value: data.activeProjects,
      trend: `${data.activeProjectsTrend >= 0 ? "+" : ""}${data.activeProjectsTrend} this week`,
      trendUp: data.activeProjectsTrend >= 0,
      icon: FolderOpen,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
      accent: "bg-blue-500",
    },
    {
      label: "Pending Tasks",
      value: data.pendingTasks,
      trend: "Current backlog",
      trendUp: false,
      icon: Clock,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500/10",
      accent: "bg-amber-500",
    },
    {
      label: "Completed Tasks",
      value: data.completedTasks,
      trend: `${data.completedTasksTrend >= 0 ? "+" : ""}${data.completedTasksTrend} this week`,
      trendUp: data.completedTasksTrend >= 0,
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
      accent: "bg-emerald-500",
    },
    {
      label: "Team Members",
      value: data.teamMembers,
      trend: "Across all projects",
      trendUp: true,
      icon: Users,
      iconColor: "text-violet-500",
      iconBg: "bg-violet-500/10",
      accent: "bg-violet-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="hover:bg-surface group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-colors"
        >
          <div
            className={`absolute left-0 top-0 h-1 w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${stat.accent}`}
          />

          <div
            className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconBg}`}
          >
            <stat.icon size={16} className={stat.iconColor} />
          </div>

          <div className="mt-6 font-display text-5xl font-bold tracking-tight text-foreground">
            {stat.value}
          </div>

          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {stat.label} • {stat.trend}
          </div>
        </div>
      ))}
    </div>
  )
}
