import Link from "next/link"
import { timeAgo } from "@/lib/utils"
import { getActivityIcon, formatActivityMessage, ActivityMetadata } from "./activity-utils"
import type { ActivityLogWithUser } from "@/types"

type ActivityWithProject = ActivityLogWithUser & {
  project?: {
    id: string
    title: string
    color?: string | null
  } | null
}

interface ActivityItemProps {
  activity: ActivityWithProject
  isMounted: boolean
}

export function ActivityItem({ activity, isMounted }: ActivityItemProps) {
  const meta = activity.metadata as ActivityMetadata | null
  const message = formatActivityMessage(activity.action, activity.entityType, meta)

  return (
    <div className="group flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
        {getActivityIcon(activity.action, meta as ActivityMetadata)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold text-foreground">
            {`${activity.user?.firstName || "Unknown"} ${activity.user?.lastName || ""}`.trim()}
          </span>{" "}
          <span className="text-muted-foreground">{message}</span>
        </p>

        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{isMounted ? timeAgo(activity.createdAt) : "..."}</span>
          {activity.project && (
            <>
              <span className="opacity-40">&bull;</span>
              <Link
                href={`/projects/${activity.projectId}`}
                className="inline-flex items-center gap-1 transition-colors hover:text-foreground hover:underline"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: activity.project.color || "#3b82f6" }}
                />
                {activity.project.title}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
