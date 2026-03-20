"use client"

import { useQuery } from "@tanstack/react-query"
import { timeAgo } from "@/lib/utils"
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Pencil,
  Plus,
  UserPlus,
  UserMinus,
  Trash2,
  Activity,
  Paperclip,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getTaskActivityLogsAction } from "@/lib/actions/tasks"

interface TaskActivityProps {
  taskId: string
  currentUserId: string
  createdAt?: string | Date
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  if (!firstName && !lastName) return "U"
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase()
}

function getActivityDescription(log: any, currentUserId: string) {
  const isMe = log.user.id === currentUserId
  const subject = isMe
    ? "You"
    : `${log.user.firstName || "Someone"} ${log.user.lastName || ""}`.trim()
  const metadata = log.metadata || {}

  switch (log.action) {
    case "created":
      return `${subject} created this task`
    case "moved":
      if (metadata.from && metadata.to) {
        return `${subject} moved this task from ${metadata.from} to ${metadata.to}`
      }
      return `${subject} moved this task`
    case "updated":
      // Handle attachment-specific activity
      if (metadata.type === "attachments_added") {
        const count = metadata.count || metadata.fileNames?.length || 0
        const fileNames = metadata.fileNames || []
        if (count === 1 && fileNames.length === 1) {
          return `${subject} attached ${fileNames[0]}`
        }
        return `${subject} attached ${count} file${count !== 1 ? "s" : ""}`
      }
      if (metadata.type === "attachment_deleted") {
        return `${subject} removed ${metadata.fileName || "an attachment"}`
      }
      return `${subject} updated task details`
    case "completed":
      return `${subject} completed this task`
    case "restored":
      return `${subject} uncompleted this task`
    case "assigned":
      return `${subject} assigned a user to this task`
    case "unassigned":
      return `${subject} removed an assignee`
    case "deleted":
      return `${subject} deleted this task`
    case "commented":
      return `${subject} added a comment`
    default:
      return `${subject} performed an action`
  }
}

function getActivityIcon(action: string, metadata?: any) {
  const className = "h-4 w-4 text-muted-foreground"

  // Check for attachment-specific actions
  if (
    action === "updated" &&
    metadata &&
    (metadata.type === "attachments_added" || metadata.type === "attachment_deleted")
  ) {
    return <Paperclip className={className} />
  }

  switch (action) {
    case "created":
      return <Plus className={className} />
    case "moved":
      return <ArrowRight className={className} />
    case "updated":
      return <Pencil className={className} />
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    case "assigned":
      return <UserPlus className={className} />
    case "unassigned":
      return <UserMinus className={className} />
    case "commented":
      return <MessageCircle className={className} />
    case "deleted":
      return <Trash2 className={className} />
    default:
      return <Activity className={className} />
  }
}

export function TaskActivity({ taskId, currentUserId, createdAt }: TaskActivityProps) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["task-activity", taskId],
    queryFn: async () => {
      const result = await getTaskActivityLogsAction(taskId)
      if (result.error) throw new Error(result.error)
      return result.data || []
    },
  })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded bg-muted" />
              <div className="h-2 w-1/4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-sans text-xs font-bold uppercase text-muted-foreground">Activity</h3>

      {/* SCROLLABLE WRAPPER */}
      <div className="max-h-[250px] overflow-y-auto pr-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
        <div className="relative space-y-4 before:absolute before:inset-0 before:ml-3 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent md:before:mx-auto md:before:translate-x-0">
          {/* Dynamic Logs from DB */}
          {logs?.map((log: any) => (
            <div key={log.id} className="group relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background">
                  {getActivityIcon(log.action, log.metadata)}
                </div>
                <p className="text-sm text-foreground">
                  <span className="font-medium">{getActivityDescription(log, currentUserId)}</span>
                </p>
              </div>
              <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                {timeAgo(log.createdAt)}
              </span>
            </div>
          ))}

          {/* The Genesis Block (Creation Date) */}
          {createdAt && (
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-foreground">Task created</p>
              </div>
              <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                {new Date(createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
