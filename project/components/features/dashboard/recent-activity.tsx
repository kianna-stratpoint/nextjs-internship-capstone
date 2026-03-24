import Link from "next/link"
import { requireAuth } from "@/lib/auth"
import { getActivityForUser } from "@/lib/db/queries/activity"
import { timeAgo } from "@/lib/utils"
import { UserAvatar } from "@/components/shared/user-avatar"

// --- Types ---
type ActivityAction =
  | "created"
  | "updated"
  | "deleted"
  | "archived"
  | "unarchived"
  | "moved"
  | "completed"
  | "restored"
  | "assigned"
  | "unassigned"
  | "commented"
  | "invited"
  | "removed"
  | "role_changed"

interface ActivityMetadata {
  title?: string
  taskTitle?: string
  to?: string
  from?: string
  toColor?: string
  fromColor?: string
  role?: string
  newRole?: string
  email?: string
  memberName?: string
  assigneeName?: string
  assigneeId?: string
  type?: string
  fileName?: string
  fileNames?: string[]
  count?: number
  viaInvitation?: boolean
  accepted?: boolean
  listType?: string
  wasCompleted?: boolean
  fields?: string[]
  [key: string]: any
}

// --- Helper Functions ---
function formatActivityMessage(
  action: ActivityAction | string,
  entityType: string,
  metadata: ActivityMetadata | null
) {
  const title = metadata?.title || metadata?.taskTitle || "an item"

  switch (action) {
    case "created":
      if (entityType === "task") return `created task "${title}"`
      if (entityType === "list") return `created list "${title}"`
      if (entityType === "project") return `created project "${title}"`
      if (metadata?.type === "calendar_event") return `created event "${title}"`
      return `created ${entityType} "${title}"`

    case "updated":
      if (metadata?.type === "attachments_added") {
        const count = metadata.count || metadata.fileNames?.length || 0
        const fileNames = metadata.fileNames || []
        if (count === 1 && fileNames.length === 1) return `attached "${fileNames[0]}" to a task`
        return `attached ${count} file${count !== 1 ? "s" : ""} to a task`
      }
      if (metadata?.type === "attachment_deleted") {
        return `removed attachment "${metadata.fileName || "a file"}"`
      }
      if (entityType === "task") return `updated task "${title}"`
      if (entityType === "project") return `updated project "${title}"`
      return `updated ${entityType} "${title}"`

    case "deleted":
      if (entityType === "task") return `deleted task "${title}"`
      if (entityType === "list") return `deleted list "${title}"`
      if (entityType === "project") return `deleted project "${title}"`
      if (entityType === "comment") return `deleted a comment`
      return `deleted ${entityType} "${title}"`

    case "moved":
      if (metadata?.from && metadata?.to) {
        return `moved "${metadata.taskTitle || title}" from ${metadata.from} to ${metadata.to}`
      }
      return `moved "${title}" to another list`

    case "completed":
      return `completed "${title}"`

    case "restored":
      return `reopened "${title}"`

    case "assigned":
      if (metadata?.assigneeName) {
        return `assigned ${metadata.assigneeName} to "${metadata.taskTitle || title}"`
      }
      return `assigned someone to "${title}"`

    case "unassigned":
      if (metadata?.assigneeName) {
        return `removed ${metadata.assigneeName} from "${metadata.taskTitle || title}"`
      }
      return `removed an assignee from "${title}"`

    case "commented":
      if (metadata?.taskTitle) {
        return `commented on "${metadata.taskTitle}"`
      }
      return `added a comment`

    case "invited":
      if (metadata?.email) return `invited ${metadata.email} as ${metadata.role || "member"}`
      if (metadata?.viaInvitation && metadata?.accepted) return `joined the project`
      return `invited a new member${metadata?.role ? ` as ${metadata.role}` : ""}`

    case "removed":
      if (metadata?.memberName) return `removed ${metadata.memberName} from the project`
      return `removed a member`

    case "role_changed":
      if (metadata?.memberName && metadata?.from && metadata?.to) {
        return `changed ${metadata.memberName}'s role from ${metadata.from} to ${metadata.to}`
      }
      if (metadata?.newRole) return `changed a member's role to ${metadata.newRole}`
      return `changed a member's role`

    case "archived":
      return `archived "${title}"`

    case "unarchived":
      return `restored "${title}" from archive`

    default:
      return `modified a ${entityType}`
  }
}
// --- Server Component ---

export async function RecentActivity() {
  const { dbUserId } = await requireAuth()
  const activities = await getActivityForUser(dbUserId)

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-foreground">Recent Activity</h2>
        <Link
          href="/activity"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View All
        </Link>
      </div>

      {/* Scrollable list */}
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity.</p>
      ) : (
        <div className="scrollbar-thin max-h-96 space-y-1 overflow-y-auto">
          {activities.map((activity) => {
            const userName =
              `${activity.user.firstName || "Unknown"} ${activity.user.lastName || "User"}`.trim()

            // 4. Cast the metadata to our new type when passing it to the helper
            const actionMessage = formatActivityMessage(
              activity.action,
              activity.entityType,
              activity.metadata as ActivityMetadata | null
            )
            const timeAgoString = timeAgo(activity.createdAt)

            return (
              <div
                key={activity.id}
                className="rounded-lg p-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <UserAvatar user={activity.user} size="sm" />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold text-foreground">{userName}</span>{" "}
                      <span className="text-muted-foreground">{actionMessage}</span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {timeAgoString}
                      <span className="opacity-40">&bull;</span>

                      {/* Link to the project */}
                      <Link
                        href={`/projects/${activity.projectId}`}
                        className="inline-flex items-center gap-1 transition-colors hover:text-foreground hover:underline"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: activity.project?.color || "#2D6EF7" }}
                        />
                        {activity.project?.title}
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
