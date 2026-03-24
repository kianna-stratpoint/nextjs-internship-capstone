"use client"

import { Users, Loader2 } from "lucide-react"
import { UserAvatar } from "@/components/shared/user-avatar"
import type { TeamMember } from "@/types/team"

/* ==================== HELPERS ==================== */

function getFullName(user: any) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Unknown"
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  admin: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  contributor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  viewer: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
}

/* ==================== COMPONENT ==================== */

interface TeamMemberGridProps {
  members: TeamMember[]
  isLoading: boolean
  hasFilters: boolean
  onMemberClick: (userId: string) => void
}

export function TeamMemberGrid({
  members,
  isLoading,
  hasFilters,
  onMemberClick,
}: TeamMemberGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p className="mt-2 text-sm text-muted-foreground">
          {hasFilters ? "No members match your filters" : "No members yet"}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <button
          key={member.id}
          onClick={() => onMemberClick(member.userId)}
          className="group rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/30 hover:bg-muted/30"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar user={member.user} size="xl" />
              <div>
                <h4 className="font-semibold text-foreground">{getFullName(member.user)}</h4>
                <p className="text-xs text-muted-foreground">
                  {member.user?.role || "Team Member"} · {member.user?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize ${ROLE_BADGE_STYLES[member.role] || ROLE_BADGE_STYLES.viewer}`}
            >
              {member.role}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
