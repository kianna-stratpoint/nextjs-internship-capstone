"use client"

import { Trophy, CheckCircle2 } from "lucide-react"
import { UserAvatar } from "@/components/shared/user-avatar"
import type { LeaderboardEntry } from "@/types/analytics"

function getFullName(user: any) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Unknown"
}

export function AnalyticsLeaderboard({ data }: { data: LeaderboardEntry[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-1 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-foreground">Team Contributions</h3>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">Tasks completed by member</p>

      {data.length > 0 ? (
        <div className="space-y-3">
          {data.map((entry) => (
            <div key={entry.userId} className="flex items-center gap-3">
              <UserAvatar user={entry.user} size="md" />
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {getFullName(entry.user)}
              </p>
              <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {entry.completedCount}
              </div>
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
  )
}
