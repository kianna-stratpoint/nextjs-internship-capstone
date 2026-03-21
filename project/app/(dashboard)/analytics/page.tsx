"use client"

import { useState } from "react"
import { TrendingUp, BarChart3, Users, Clock, Loader2, Activity, Trophy } from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { useAnalytics } from "@/hooks/use-analytics"
import { useTeamMembers } from "@/hooks/use-team-member"
import { timeAgo } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { TimeRange } from "@/lib/db/queries/analytics"

/* ==================== HELPERS ==================== */

function getInitials(firstName?: string | null, lastName?: string | null) {
  return ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "U"
}

function getFullName(user: any) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Unknown"
}

function getActivityDescription(log: any) {
  const name = getFullName(log.user)
  const meta = log.metadata || {}
  const entityType = log.entityType

  switch (log.action) {
    case "created":
      if (entityType === "task")
        return (
          <>
            {name} created task <strong>&quot;{meta.title || "Untitled"}&quot;</strong>
          </>
        )
      if (entityType === "list")
        return (
          <>
            {name} created list <strong>&quot;{meta.title || "Untitled"}&quot;</strong>
          </>
        )
      if (entityType === "project")
        return (
          <>
            {name} created project <strong>&quot;{meta.title || "Untitled"}&quot;</strong>
          </>
        )
      return (
        <>
          {name} created a {entityType}
        </>
      )

    case "moved":
      if (meta.from && meta.to) {
        return (
          <>
            {name} moved <strong>&quot;{meta.taskTitle || "a task"}&quot;</strong> to {meta.to}
          </>
        )
      }
      return (
        <>
          {name} moved a {entityType}
        </>
      )

    case "updated":
      if (meta.type === "attachments_added") {
        const count = meta.count || 0
        return (
          <>
            {name} attached {count} file{count !== 1 ? "s" : ""}
          </>
        )
      }
      if (meta.type === "attachment_deleted") {
        return (
          <>
            {name} removed attachment &quot;{meta.fileName || "a file"}&quot;
          </>
        )
      }
      if (entityType === "task")
        return (
          <>
            {name} updated task {meta.title ? <strong>&quot;{meta.title}&quot;</strong> : "details"}
          </>
        )
      if (entityType === "project") return <>{name} updated project details</>
      return (
        <>
          {name} updated a {entityType}
        </>
      )

    case "completed":
      return (
        <>
          {name} completed <strong>&quot;{meta.title || "a task"}&quot;</strong>
        </>
      )

    case "restored":
      return (
        <>
          {name} reopened <strong>&quot;{meta.title || "a task"}&quot;</strong>
        </>
      )

    case "assigned": {
      if (meta.assigneeName)
        return (
          <>
            {name} assigned <strong>{meta.assigneeName}</strong> to{" "}
            <strong>&quot;{meta.taskTitle || "a task"}&quot;</strong>
          </>
        )
      return <>{name} assigned someone to a task</>
    }

    case "unassigned": {
      if (meta.assigneeName)
        return (
          <>
            {name} removed <strong>{meta.assigneeName}</strong> from{" "}
            <strong>&quot;{meta.taskTitle || "a task"}&quot;</strong>
          </>
        )
      return <>{name} removed an assignee</>
    }

    case "commented":
      return <>{name} commented on a task</>

    case "deleted":
      if (entityType === "task")
        return (
          <>
            {name} deleted task <strong>&quot;{meta.title || "Untitled"}&quot;</strong>
          </>
        )
      if (entityType === "list")
        return (
          <>
            {name} deleted list <strong>&quot;{meta.title || "Untitled"}&quot;</strong>
          </>
        )
      return (
        <>
          {name} deleted a {entityType}
        </>
      )

    case "invited":
      if (entityType === "member")
        return (
          <>
            {name} invited <strong>{meta.email || "someone"}</strong> to the project
          </>
        )
      return <>{name} sent an invitation</>

    case "removed":
      if (meta.memberName)
        return (
          <>
            {name} removed <strong>{meta.memberName}</strong> from the project
          </>
        )
      return <>{name} removed a member</>

    case "role_changed":
      if (meta.memberName && meta.from && meta.to) {
        return (
          <>
            {name} changed <strong>{meta.memberName}&apos;s</strong> role from {meta.from} to{" "}
            {meta.to}
          </>
        )
      }
      return <>{name} changed a member&apos;s role</>

    case "archived":
      return (
        <>
          {name} archived project &quot;{meta.title || ""}&quot;
        </>
      )

    case "unarchived":
      return (
        <>
          {name} unarchived project &quot;{meta.title || ""}&quot;
        </>
      )

    default:
      return <>{name} performed an action</>
  }
}

function getActivityCategory(log: any): string {
  if (log.entityType === "task") return "tasks"
  if (
    log.entityType === "member" ||
    log.action === "invited" ||
    log.action === "removed" ||
    log.action === "role_changed"
  )
    return "members"
  if (log.entityType === "project") return "projects"
  return "tasks"
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
]

const STATUS_COLORS: Record<string, string> = {
  todo: "#64748B",
  in_progress: "#3B82F6",
  review: "#F59E0B",
  done: "#10B981",
  custom: "#8B5CF6",
}

const PRIORITY_COLORS: Record<string, string> = {
  High: "#EF4444",
  Medium: "#F59E0B",
  Low: "#10B981",
  "No Priority": "#94A3B8",
}

const ACTIVITY_FILTERS = [
  { value: "all", label: "All" },
  { value: "tasks", label: "Tasks" },
  { value: "members", label: "Members" },
  { value: "projects", label: "Projects" },
]

/* ==================== COMPONENT ==================== */

export default function AnalyticsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [range, setRange] = useState<TimeRange>("30d")
  const [activityFilter, setActivityFilter] = useState("all")

  const { memberProjects, isLoadingProjects } = useTeamMembers(null)
  const effectiveProjectId = selectedProjectId ?? memberProjects[0]?.id ?? null

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

  const filteredActivity =
    activityFilter === "all"
      ? activity
      : activity.filter((log: any) => getActivityCategory(log) === activityFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            Track project performance and team productivity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={effectiveProjectId ?? ""} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[320px] text-foreground">
              <SelectValue placeholder={isLoadingProjects ? "Loading..." : "Select project"} />
            </SelectTrigger>
            <SelectContent>
              {memberProjects.map((project: any) => (
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
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !effectiveProjectId && (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-muted-foreground">Select a project to view analytics</p>
        </div>
      )}

      {!isLoading && stats && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                label: "Project Velocity",
                value:
                  velocity.length > 0 ? `${velocity[velocity.length - 1]?.completed ?? 0}` : "0",
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
            ].map((metric) => (
              <div key={metric.label} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${metric.bg}`}
                  >
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.unit}</p>
                <p className="mt-1 text-xs font-medium text-foreground">{metric.label}</p>
              </div>
            ))}
          </div>

          {/* Pie Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Tasks by Status (Donut) */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-foreground">Tasks by Status</h3>
              <p className="mb-2 text-xs text-muted-foreground">Current snapshot</p>
              {tasksByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={tasksByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {tasksByStatus.map((entry: any, i: number) => (
                        <Cell key={`s-${i}`} fill={STATUS_COLORS[entry.type] || "#8B5CF6"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(v: any, n: any) => [`${v} tasks`, n]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px" }}
                      formatter={(v: string) => <span className="text-foreground">{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No tasks yet" />
              )}
            </div>

            {/* Tasks by Priority (Horizontal Bar) */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-foreground">Tasks by Priority</h3>
              <p className="mb-2 text-xs text-muted-foreground">Open tasks only</p>
              {tasksByPriority.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={tasksByPriority} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 12 }}
                      width={80}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(v: any) => [`${v} tasks`]}
                    />
                    <Bar dataKey="value" name="Tasks" radius={[0, 4, 4, 0]}>
                      {tasksByPriority.map((entry: any, i: number) => (
                        <Cell key={`p-${i}`} fill={PRIORITY_COLORS[entry.name] || "#94A3B8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No open tasks" />
              )}
            </div>
          </div>

          {/* Velocity + Activity Timeline */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Project Velocity</h3>
              {velocity.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={velocity}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar
                      dataKey="completed"
                      name="Completed"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar dataKey="created" name="Created" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No task data yet" />
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Team Activity</h3>
              {timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="activities"
                      name="Activities"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No activity data yet" />
              )}
            </div>
          </div>

          {/* Leaderboard + Activity Feed */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Leaderboard */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-1 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">Team Contributions</h3>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">Tasks completed by member</p>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((entry: any) => (
                    <div key={entry.userId} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.user?.imageUrl || ""} />
                        <AvatarFallback className="bg-foreground text-xs text-background">
                          {getInitials(entry.user?.firstName, entry.user?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {getFullName(entry.user)}
                      </p>
                      <span className="text-sm font-bold text-foreground">
                        {entry.completedCount}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Trophy className="mx-auto h-6 w-6 text-muted-foreground/30" />
                  <p className="mt-2 text-xs text-muted-foreground">No completions yet</p>
                </div>
              )}
            </div>

            {/* Activity Feed */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Activity Timeline</h3>
                  <p className="text-xs text-muted-foreground">
                    Recent actions across your project
                  </p>
                </div>
                <div className="flex gap-1">
                  {ACTIVITY_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setActivityFilter(f.value)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        activityFilter === f.value
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredActivity.length > 0 ? (
                <div className="scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent max-h-[360px] space-y-1 overflow-y-auto pr-2">
                  {filteredActivity.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 rounded-lg px-2 py-2.5">
                      <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                        <AvatarImage src={log.user?.imageUrl || ""} />
                        <AvatarFallback className="bg-foreground text-[10px] text-background">
                          {getInitials(log.user?.firstName, log.user?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{getActivityDescription(log)}</p>
                        {log.project && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: log.project.color || "#3b82f6" }}
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {log.project.title}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {timeAgo(log.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Activity className="mx-auto h-6 w-6 text-muted-foreground/30" />
                  <p className="mt-2 text-xs text-muted-foreground">No activity yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-lg bg-muted/30">
      <div className="text-center">
        <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground/30" />
        <p className="mt-2 text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
