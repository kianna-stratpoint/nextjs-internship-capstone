"use client"

import { useState, useMemo } from "react"
import { Activity } from "lucide-react"
import { timeAgo } from "@/lib/utils"
import { UserAvatar } from "@/components/shared/user-avatar"
import type { ActivityLogEntry } from "@/types/analytics"

/* ==================== HELPERS ==================== */

function getFullName(user: any) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Unknown"
}

function getActivityDescription(log: ActivityLogEntry) {
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
      if (meta.from && meta.to)
        return (
          <>
            {name} moved <strong>&quot;{meta.taskTitle || "a task"}&quot;</strong> to {meta.to}
          </>
        )
      return (
        <>
          {name} moved a {entityType}
        </>
      )
    case "updated":
      if (meta.type === "attachments_added")
        return (
          <>
            {name} attached {meta.count || 0} file{(meta.count || 0) !== 1 ? "s" : ""}
          </>
        )
      if (meta.type === "attachment_deleted")
        return (
          <>
            {name} removed attachment &quot;{meta.fileName || "a file"}&quot;
          </>
        )
      if (entityType === "task")
        return (
          <>
            {name} updated task {meta.title ? <strong>&quot;{meta.title}&quot;</strong> : "details"}
          </>
        )
      return (
        <>
          {name} updated {entityType}
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
    case "assigned":
      if (meta.assigneeName)
        return (
          <>
            {name} assigned <strong>{meta.assigneeName}</strong> to{" "}
            <strong>&quot;{meta.taskTitle || "a task"}&quot;</strong>
          </>
        )
      return <>{name} assigned someone to a task</>
    case "unassigned":
      if (meta.assigneeName)
        return (
          <>
            {name} removed <strong>{meta.assigneeName}</strong> from{" "}
            <strong>&quot;{meta.taskTitle || "a task"}&quot;</strong>
          </>
        )
      return <>{name} removed an assignee</>
    case "commented":
      return <>{name} commented on a task</>
    case "deleted":
      return (
        <>
          {name} deleted {entityType} <strong>&quot;{meta.title || "an item"}&quot;</strong>
        </>
      )
    case "invited":
      if (meta.email)
        return (
          <>
            {name} invited <strong>{meta.email}</strong> as {meta.role || "member"}
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
      if (meta.memberName && meta.from && meta.to)
        return (
          <>
            {name} changed <strong>{meta.memberName}&apos;s</strong> role from {meta.from} to{" "}
            {meta.to}
          </>
        )
      return <>{name} changed a member&apos;s role</>
    case "archived":
      return (
        <>
          {name} archived &quot;{meta.title || ""}&quot;
        </>
      )
    case "unarchived":
      return (
        <>
          {name} restored &quot;{meta.title || ""}&quot;
        </>
      )
    default:
      return <>{name} performed an action</>
  }
}

function getActivityCategory(log: ActivityLogEntry): string {
  if (log.entityType === "task" || log.entityType === "comment") return "tasks"
  if (
    log.entityType === "member" ||
    log.action === "invited" ||
    log.action === "removed" ||
    log.action === "role_changed"
  )
    return "members"
  if (log.entityType === "project") return "projects"
  return "other"
}

const FILTERS = [
  { value: "all", label: "All" },
  { value: "tasks", label: "Tasks" },
  { value: "members", label: "Members" },
  { value: "projects", label: "Projects" },
]

/* ==================== COMPONENT ==================== */

export function AnalyticsActivityFeed({ data }: { data: ActivityLogEntry[] }) {
  const [filter, setFilter] = useState("all")

  const filtered = useMemo(
    () => (filter === "all" ? data : data.filter((log) => getActivityCategory(log) === filter)),
    [data, filter]
  )

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Activity Timeline</h3>
          <p className="text-xs text-muted-foreground">Recent actions across your project</p>
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent max-h-[360px] space-y-1 overflow-y-auto pr-2">
          {filtered.map((log) => (
            <div key={log.id} className="flex items-start gap-3 rounded-lg px-2 py-2.5">
              <UserAvatar user={log.user} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{getActivityDescription(log)}</p>
                {log.project && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: log.project.color || "#3b82f6" }}
                    />
                    <span className="text-[10px] text-muted-foreground">{log.project.title}</span>
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
  )
}
