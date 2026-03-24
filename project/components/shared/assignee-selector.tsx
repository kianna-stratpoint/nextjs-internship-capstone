"use client"

import { useState, useMemo } from "react"
import { Check, Search, Loader2, Users, UserPlus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getProjectMembersAction } from "@/lib/actions/members"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserAvatar, StackedAvatars } from "@/components/shared/user-avatar"

function getFullName(user: any) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Unknown"
}

const ROLE_STYLES: Record<string, string> = {
  admin: "text-amber-600 dark:text-amber-400",
  contributor: "text-blue-600 dark:text-blue-400",
  viewer: "text-slate-500 dark:text-slate-400",
}

interface AssigneeSelectorProps {
  projectId: string
  assignedUserIds: string[]
  onToggle: (userId: string, isAssigning: boolean) => void
  disabled?: boolean
  trigger?: React.ReactNode
  align?: "start" | "center" | "end"
}

export function AssigneeSelector({
  projectId,
  assignedUserIds,
  onToggle,
  disabled = false,
  trigger,
  align = "start",
}: AssigneeSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Fetch project members
  const { data: membersData, isLoading } = useQuery({
    queryKey: ["members", projectId],
    queryFn: async () => {
      const result = await getProjectMembersAction(projectId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: open && !!projectId,
  })

  const members = useMemo(() => membersData ?? [], [membersData])

  // Filter members by search
  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members
    const q = search.toLowerCase()
    return members.filter(
      (m: any) =>
        getFullName(m.user).toLowerCase().includes(q) || m.user?.email?.toLowerCase().includes(q)
    )
  }, [members, search])

  const handleToggle = (userId: string) => {
    const isCurrentlyAssigned = assignedUserIds.includes(userId)
    onToggle(userId, !isCurrentlyAssigned)
  }

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 rounded-full px-3 text-foreground"
      disabled={disabled}
    >
      <UserPlus className="h-3.5 w-3.5" />
      <span className="text-xs">
        {assignedUserIds.length > 0 ? `${assignedUserIds.length} assigned` : "Assign"}
      </span>
    </Button>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger ?? defaultTrigger}</PopoverTrigger>

      <PopoverContent align={align} className="w-[280px] p-0" onClick={(e) => e.stopPropagation()}>
        {/* Search */}
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        {/* Member list */}
        <div className="max-h-[240px] overflow-y-auto p-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-6 text-center">
              <Users className="mx-auto h-5 w-5 text-muted-foreground/40" />
              <p className="mt-1 text-xs text-muted-foreground">
                {search ? "No members found" : "No members in this project"}
              </p>
            </div>
          ) : (
            filteredMembers.map((member: any) => {
              const isAssigned = assignedUserIds.includes(member.userId)
              return (
                <button
                  key={member.userId}
                  onClick={() => handleToggle(member.userId)}
                  disabled={disabled}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/80 ${
                    isAssigned ? "bg-primary/5" : ""
                  }`}
                >
                  {/* Checkbox indicator */}
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      isAssigned
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {isAssigned && <Check className="h-3 w-3" />}
                  </div>

                  {/* Avatar */}
                  <UserAvatar user={member.user} size="sm" />

                  {/* Name + role */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {getFullName(member.user)}
                    </p>
                    <p
                      className={`text-[10px] capitalize ${ROLE_STYLES[member.role] || "text-muted-foreground"}`}
                    >
                      {member.role}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

//* ==================== STACKED AVATARS ==================== */

export function AssigneeAvatars({
  assignees,
  max = 3,
  size = "sm",
  onClickAction,
}: {
  assignees: { user: any }[]
  max?: number
  size?: "sm" | "md"
  onClickAction?: (e: React.MouseEvent) => void
}) {
  return (
    <StackedAvatars
      users={assignees.map((a) => ({ user: a.user }))}
      max={max}
      size={size}
      onClickAction={onClickAction}
    />
  )
}
