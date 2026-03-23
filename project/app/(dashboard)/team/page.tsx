"use client"

import { useState, useMemo, useEffect } from "react"
import {
  UserPlus,
  Search,
  SlidersHorizontal,
  Users,
  Shield,
  Eye,
  Loader2,
  Mail,
  ArrowUpDown,
  Filter,
} from "lucide-react"
import { useTeamMembers } from "@/hooks/use-team-member"
import { useProjectInvitations } from "@/hooks/use-invitations"
import { useUIStore } from "@/stores/ui-store"
import { MemberDetailSheet } from "@/components/features/team/member-detail-sheet"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/shared/user-avatar"

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

export default function TeamPage() {
  // State
  const [pickedProjectId, setPickedProjectId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("name-asc")
  const [filterRole, setFilterRole] = useState<string | null>(null)
  const [showPendingInvites, setShowPendingInvites] = useState(false)

  const { openInviteMemberModal } = useUIStore()
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [isMemberSheetOpen, setIsMemberSheetOpen] = useState(false)

  // Data
  const { memberProjects, isLoadingProjects } = useTeamMembers(null)

  const selectedProjectId = pickedProjectId ?? memberProjects[0]?.id ?? null

  const { members, memberCounts, isLoadingMembers } = useTeamMembers(selectedProjectId)

  const { pendingInvitations, cancelInvitation, resendInvitation, isCancelling, isResending } =
    useProjectInvitations(selectedProjectId)

  // Derive current user's role for this project
  const currentUserRole = useMemo(() => {
    const proj = memberProjects.find((p: any) => p.id === selectedProjectId)
    return proj?.role ?? null
  }, [memberProjects, selectedProjectId])

  const isAdmin = currentUserRole === "admin"

  // Filter + Sort members
  const filteredMembers = useMemo(() => {
    let result = [...members]

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (m: any) =>
          getFullName(m.user).toLowerCase().includes(q) ||
          m.user?.email?.toLowerCase().includes(q) ||
          m.user?.role?.toLowerCase().includes(q)
      )
    }

    // Filter by role
    if (filterRole) {
      result = result.filter((m: any) => m.role === filterRole)
    }

    // Sort
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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team</h1>
          <p className="mt-1 text-muted-foreground">
            Manage team members and permissions across your projects
          </p>
        </div>
        {isAdmin && (
          <Button className="text-base" onClick={() => openInviteMemberModal(selectedProjectId!)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Project Selector */}
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Viewing members of
        </p>
        <Select value={selectedProjectId ?? ""} onValueChange={(val) => setPickedProjectId(val)}>
          <SelectTrigger className="w-[430px] text-foreground">
            <SelectValue placeholder={isLoadingProjects ? "Loading..." : "Select a project"} />
          </SelectTrigger>
          <SelectContent>
            {memberProjects.map((project: any) => (
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Members", value: memberCounts.total, icon: Users },
          { label: "Admins", value: memberCounts.admins, icon: Shield },
          { label: "Contributors", value: memberCounts.contributors, icon: UserPlus },
          { label: "Viewer", value: memberCounts.viewers, icon: Eye },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-4xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Invitations (Admin-only) */}
      {isAdmin && pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pending Invitations ({pendingInvitations.length})
          </h3>
          <div className="space-y-2">
            {pendingInvitations.map((invite: any) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{invite.email}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      Invited as {invite.role}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-foreground"
                    onClick={() => resendInvitation(invite.id)}
                    disabled={isResending}
                  >
                    Resend
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => cancelInvitation(invite.id)}
                    disabled={isCancelling}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + Sort + Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members"
            className="pl-9 text-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground">
              <ArrowUpDown size={16} />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
              <DropdownMenuRadioItem value="name-asc">Name A→Z</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name-desc">Name Z→A</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="role">By Role</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="date-joined">Date Joined</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground">
              <Filter size={16} />
              Filter
              {filterRole && (
                <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  1
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filterRole === "admin"}
              onCheckedChange={(checked) => setFilterRole(checked ? "admin" : null)}
            >
              Admin
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterRole === "contributor"}
              onCheckedChange={(checked) => setFilterRole(checked ? "contributor" : null)}
            >
              Contributor
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterRole === "viewer"}
              onCheckedChange={(checked) => setFilterRole(checked ? "viewer" : null)}
            >
              Viewer
            </DropdownMenuCheckboxItem>
            {filterRole && (
              <>
                <DropdownMenuSeparator />
                <button
                  onClick={() => setFilterRole(null)}
                  className="w-full px-2 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all filters
                </button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Members Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Members
        </h3>

        {isLoadingMembers ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery || filterRole ? "No members match your filters" : "No members yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member: any) => (
              <button
                key={member.id}
                onClick={() => {
                  setSelectedMemberId(member.userId)
                  setIsMemberSheetOpen(true)
                }}
                className="group rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/30 hover:bg-muted/30"
              >
                {/* Top row: avatar + name + menu */}
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

                {/* Bottom row: role badge */}
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
        )}
      </div>

      {/* Member Detail Sheet */}
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
