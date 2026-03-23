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

import { getTaskActivityLogsAction } from "@/lib/actions/tasks"
import { UserAvatar } from "@/components/shared/user-avatar"

interface TaskActivityProps {
  taskId: string
  currentUserId: string
  createdAt?: string | Date
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
        return `${subject} moved this task from **${metadata.from}** to **${metadata.to}**`
      }
      return `${subject} moved this task`

    case "updated":
      if (metadata.type === "attachments_added") {
        const count = metadata.count || metadata.fileNames?.length || 0
        const fileNames = metadata.fileNames || []
        if (count === 1 && fileNames.length === 1) {
          return `${subject} attached **${fileNames[0]}**`
        }
        return `${subject} attached ${count} file${count !== 1 ? "s" : ""}`
      }
      if (metadata.type === "attachment_deleted") {
        return `${subject} removed attachment **${metadata.fileName || "a file"}**`
      }
      return `${subject} updated task details`

    case "completed":
      return `${subject} completed this task`

    case "restored":
      return `${subject} reopened this task`

    case "assigned": {
      const assigneeName = metadata.assigneeName || "a user"
      const isSelfAssign = metadata.assigneeId === currentUserId
      if (isSelfAssign && isMe) return "You assigned yourself to this task"
      if (isSelfAssign) return `${subject} assigned themselves to this task`
      return `${subject} assigned **${assigneeName}** to this task`
    }

    case "unassigned": {
      const removedName = metadata.assigneeName || "a user"
      const isSelfRemove = metadata.assigneeId === currentUserId
      if (isSelfRemove && isMe) return "You removed yourself from this task"
      if (isSelfRemove) return `${subject} removed themselves from this task`
      return `${subject} removed **${removedName}** from this task`
    }

    case "deleted":
      return `${subject} deleted this task`

    case "commented":
      if (metadata.preview) {
        const preview =
          metadata.preview.length > 60 ? metadata.preview.slice(0, 60) + "..." : metadata.preview
        return `${subject} commented: "${preview}"`
      }
      return `${subject} added a comment`

    default:
      return `${subject} performed an action`
  }
}

function getActivityIcon(action: string, metadata?: any) {
  const className = "h-3.5 w-3.5"

  if (
    action === "updated" &&
    metadata &&
    (metadata.type === "attachments_added" || metadata.type === "attachment_deleted")
  ) {
    return <Paperclip className={`${className} text-blue-500`} />
  }

  switch (action) {
    case "created":
      return <Plus className={`${className} text-emerald-500`} />
    case "moved":
      return <ArrowRight className={`${className} text-violet-500`} />
    case "updated":
      return <Pencil className={className} />
    case "completed":
      return <CheckCircle2 className={`${className} text-emerald-500`} />
    case "restored":
      return <CheckCircle2 className={className} />
    case "assigned":
      return <UserPlus className={`${className} text-blue-500`} />
    case "unassigned":
      return <UserMinus className={`${className} text-amber-500`} />
    case "commented":
      return <MessageCircle className={`${className} text-sky-500`} />
    case "deleted":
      return <Trash2 className={`${className} text-red-500`} />
    default:
      return <Activity className={className} />
  }
}

/**
 * Renders text with **bold** markdown-style markers.
 */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <span key={i} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </span>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
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

      <div className="max-h-[300px] overflow-y-auto pr-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
        <div className="relative space-y-1 before:absolute before:bottom-0 before:left-[11px] before:top-0 before:w-px before:bg-border">
          {logs?.map((log: any) => {
            const description = getActivityDescription(log, currentUserId)

            return (
              <div
                key={log.id}
                className="group relative flex items-start gap-3 rounded-md px-1 py-2"
              >
                {/* Avatar with icon overlay */}
                <div className="relative z-10 shrink-0">
                  <UserAvatar user={log.user} size="sm" />
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border border-background bg-card">
                    {getActivityIcon(log.action, log.metadata)}
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    <RichText text={description} />
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                    {timeAgo(log.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}

          {/* Genesis — Task Creation */}
          {createdAt && (
            <div className="relative flex items-start gap-3 px-1 py-2">
              <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                <Plus className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Task created</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                  {new Date(createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
