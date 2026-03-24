"use client"

import { useState, useMemo } from "react"
import { UserPlus } from "lucide-react"
import { useTeamMembers } from "@/hooks/use-team-member"
import { useProjectInvitations } from "@/hooks/use-invitations"
import { useUIStore } from "@/stores/ui-store"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { TeamStatsCards } from "@/components/features/team/team-stats-cards"
import { PendingInvitations } from "@/components/features/team/team-pending-invitations"
import { TeamToolbar } from "@/components/features/team/team-toolbar"
import { TeamMemberGrid } from "@/components/features/team/team-member-grid"
import { MemberDetailSheet } from "@/components/features/team/member-detail-sheet"

import type { TeamProject } from "@/types/team"

/* ==================== HELPERS ==================== */

function getFullName(user: any) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Unknown"
}

/* ==================== COMPONENT ==================== */

interface TeamDashboardProps {
  projects: TeamProject[]
}

export function TeamDashboard({ projects }: TeamDashboardProps) {
  // Project selection
  const [pickedProjectId, setPickedProjectId] = useState<string | null>(null)
  const selectedProjectId = pickedProjectId ?? projects[0]?.id ?? null

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("name-asc")
  const [filterRole, setFilterRole] = useState<string | null>(null)

  // Member detail sheet
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [isMemberSheetOpen, setIsMemberSheetOpen] = useState(false)

  // Store
  const { openInviteMemberModal } = useUIStore()

  // Data hooks
  const { members, memberCounts, isLoadingMembers } = useTeamMembers(selectedProjectId)

  const { pendingInvitations, cancelInvitation, resendInvitation, isCancelling, isResending } =
    useProjectInvitations(selectedProjectId)

  // Current user's role
  const currentUserRole = useMemo(() => {
    const proj = projects.find((p) => p.id === selectedProjectId)
    return proj?.role ?? null
  }, [projects, selectedProjectId])

  const isAdmin = currentUserRole === "admin"

  // Filter + sort members
  const filteredMembers = useMemo(() => {
    let result = [...members]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (m: any) =>
          getFullName(m.user).toLowerCase().includes(q) ||
          m.user?.email?.toLowerCase().includes(q) ||
          m.user?.role?.toLowerCase().includes(q)
      )
    }

    if (filterRole) {
      result = result.filter((m: any) => m.role === filterRole)
    }

    result.sort((a: any, b: any) => {
      switch (sortBy) {
        case "name-asc":
          return getFullName(a.user).localeCompare(getFullName(b.user))
        case "name-desc":
          return getFullName(b.user).localeCompare(getFullName(a.user))
        case "role":
          return a.role.localeCompare(b.role)
        case "date-joined":
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
        default:
          return 0
      }
    })

    return result
  }, [members, searchQuery, filterRole, sortBy])

  return (
    <div className="space-y-6">
      {/* Header row: project selector + invite button */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Viewing members of
          </p>
          <Select value={selectedProjectId ?? ""} onValueChange={setPickedProjectId}>
            <SelectTrigger className="w-[430px] text-foreground">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: project.color || "#3b82f6" }}
                    />
                    <span>{project.title}</span>
                    <span className="ml-1 text-xs capitalize text-muted-foreground">
                      {project.role}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isAdmin && selectedProjectId && (
          <Button onClick={() => openInviteMemberModal(selectedProjectId)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Stats */}
      <TeamStatsCards counts={memberCounts} />

      {/* Pending invitations (admin only) */}
      {isAdmin && (
        <PendingInvitations
          invitations={pendingInvitations}
          onResend={resendInvitation}
          onCancel={cancelInvitation}
          isResending={isResending}
          isCancelling={isCancelling}
        />
      )}

      {/* Toolbar */}
      <TeamToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterRole={filterRole}
        onFilterChange={setFilterRole}
      />

      {/* Member grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Members
        </h3>
        <TeamMemberGrid
          members={filteredMembers}
          isLoading={isLoadingMembers}
          hasFilters={!!(searchQuery || filterRole)}
          onMemberClick={(userId) => {
            setSelectedMemberId(userId)
            setIsMemberSheetOpen(true)
          }}
        />
      </div>

      {/* Member detail sheet */}
      <MemberDetailSheet
        projectId={selectedProjectId}
        targetUserId={selectedMemberId}
        open={isMemberSheetOpen}
        onOpenChange={setIsMemberSheetOpen}
        currentUserRole={currentUserRole}
      />
    </div>
  )
}
