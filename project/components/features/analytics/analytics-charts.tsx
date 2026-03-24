"use client"

import { BarChart3 } from "lucide-react"
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
import type {
  VelocityDataPoint,
  TimelineDataPoint,
  TasksByStatusEntry,
  TasksByPriorityEntry,
} from "@/types/analytics"

/* ==================== CONSTANTS ==================== */

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

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
}

/* ==================== EMPTY STATE ==================== */

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

/* ==================== TASKS BY STATUS (DONUT) ==================== */

export function TasksByStatusChart({ data }: { data: TasksByStatusEntry[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground">Tasks by Status</h3>
      <p className="mb-2 text-xs text-muted-foreground">Current snapshot</p>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, i) => (
                <Cell key={`s-${i}`} fill={STATUS_COLORS[entry.type] || "#8B5CF6"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
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
  )
}

/* ==================== TASKS BY PRIORITY (HORIZONTAL BAR) ==================== */

export function TasksByPriorityChart({ data }: { data: TasksByPriorityEntry[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground">Tasks by Priority</h3>
      <p className="mb-2 text-xs text-muted-foreground">Open tasks only</p>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 12 }}
              width={80}
              className="text-muted-foreground"
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`${v} tasks`]} />
            <Bar dataKey="value" name="Tasks" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={`p-${i}`} fill={PRIORITY_COLORS[entry.name] || "#94A3B8"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChart message="No open tasks" />
      )}
    </div>
  )
}

/* ==================== VELOCITY CHART ==================== */

export function VelocityChart({ data }: { data: VelocityDataPoint[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Project Velocity</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="created" name="Created" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChart message="No task data yet" />
      )}
    </div>
  )
}

/* ==================== ACTIVITY TIMELINE CHART ==================== */

export function ActivityTimelineChart({ data }: { data: TimelineDataPoint[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Team Activity</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
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
  )
}
