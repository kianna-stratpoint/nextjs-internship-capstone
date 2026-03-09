import Link from "next/link"
import { requireAuth } from "@/lib/auth"
import { getActivityForUser } from "@/lib/db/queries/activity"

// --- Helper Functions ---

function getInitials(firstName: string | null, lastName: string | null) {
  const first = firstName?.[0] || ""
  const last = lastName?.[0] || ""
  return (first + last).toUpperCase() || "U"
}

function formatRelativeTime(date: Date) {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min. ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr. ago`
  return `${Math.floor(diffInSeconds / 86400)} days ago`
}

function formatActivityMessage(action: string, entityType: string, metadata: any) {
  const title = metadata?.title || metadata?.taskTitle || "an item"

  switch (action) {
    case "created":
      return `created ${entityType} "${title}"`
    case "updated":
      return `updated ${entityType} "${title}"`
    case "deleted":
      return `deleted ${entityType} "${title}"`
    case "moved":
      return `moved "${title}" to ${metadata?.to || "another list"}`
    case "completed":
      return `completed task "${title}"`
    case "restored":
      return `restored task "${title}"`
    case "assigned":
      return `assigned task "${title}"`
    case "unassigned":
      return `unassigned from "${title}"`
    case "commented":
      return `commented on "${title}"`
    case "invited":
      return `invited a new member as ${metadata?.role}`
    case "removed":
      return `removed a member`
    case "role_changed":
      return `changed a member's role to ${metadata?.newRole}`
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-foreground">Recent Activity</h2>
        <button className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          View All
        </button>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity.</p>
      ) : (
        <div className="space-y-1">
          {activities.map((activity) => {
            const userName =
              `${activity.user.firstName || "Unknown"} ${activity.user.lastName || "User"}`.trim()
            const initials = getInitials(activity.user.firstName, activity.user.lastName)
            const actionMessage = formatActivityMessage(
              activity.action,
              activity.entityType,
              activity.metadata
            )
            const timeAgo = formatRelativeTime(activity.createdAt)

            return (
              <div
                key={activity.id}
                className="rounded-lg p-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold text-foreground">{userName}</span>{" "}
                      <span className="text-muted-foreground">{actionMessage}</span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {timeAgo}
                      <span className="opacity-40">&bull;</span>

                      {/* Link to the project */}
                      <Link
                        href={`/projects/${activity.projectId}`}
                        className="inline-flex items-center gap-1 transition-colors hover:text-foreground hover:underline"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: activity.project.color || "#2D6EF7" }}
                        />
                        {activity.project.title}
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
