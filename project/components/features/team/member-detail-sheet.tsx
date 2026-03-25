"use client"

import { useState } from "react"
import { Loader2, UserMinus, Clock, X } from "lucide-react"
import { useMemberProfile, useTeamMembers } from "@/hooks/use-team-member"
import { timeAgo } from "@/lib/utils"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { UserAvatar } from "@/components/shared/user-avatar"
interface MemberDetailSheetProps {
  projectId: string | null
  targetUserId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserRole: string | null
}

export function MemberDetailSheet({
  projectId,
  targetUserId,
  open,
  onOpenChange,
  currentUserRole,
}: MemberDetailSheetProps) {
  const { data: profile, isLoading } = useMemberProfile(projectId, open ? targetUserId : null)
  const { updateRole, isUpdatingRole, removeMember, isRemoving } = useTeamMembers(projectId)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)

  const isAdmin = currentUserRole === "admin"
  const member = profile

  if (!member && !isLoading) return null

  const fullName =
    [member?.user?.firstName, member?.user?.lastName].filter(Boolean).join(" ") || "Unknown"

  const handleRoleChange = async (newRole: string) => {
    if (!targetUserId) return
    await updateRole({ targetUserId, newRole })
  }

  const handleRemove = async () => {
    if (!targetUserId) return
    await removeMember(targetUserId)
    setShowRemoveDialog(false)
    onOpenChange(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md [&>button.absolute]:hidden">
          <SheetHeader className="flex flex-row items-center justify-between text-left">
            <SheetTitle className="font-sans text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Member Profile
            </SheetTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </SheetHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : member ? (
            <div className="mt-6 space-y-6">
              {/* Avatar + Name */}
              <div className="flex flex-col items-center text-center">
                <UserAvatar user={member.user} size="2xl" />
                <h2 className="mt-3 text-xl font-bold text-foreground">{fullName}</h2>
                <p className="text-sm text-muted-foreground">
                  {member.user?.role || "Team Member"} · {member.user?.email}
                </p>

                {/* Permission */}
                <div className="mt-3">
                  {isAdmin ? (
                    <Select
                      value={member.role}
                      onValueChange={handleRoleChange}
                      disabled={isUpdatingRole}
                    >
                      <SelectTrigger className="align-center h-8 w-[140px] items-center text-xs text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="contributor">Contributor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs font-medium capitalize text-foreground">
                      {member.role}
                    </span>
                  )}
                </div>
              </div>

              {/* Overview Stats */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Overview
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Pending Tasks", value: member.taskStats?.pending ?? 0 },
                    { label: "Tasks Done", value: member.taskStats?.completed ?? 0 },
                    { label: "Due Tasks", value: member.taskStats?.overdue ?? 0 },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-lg border border-border bg-muted/30 p-3 text-center"
                    >
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shared Projects */}
              {member.sharedProjects && member.sharedProjects.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Shared Projects
                  </h3>
                  <div className="space-y-1.5">
                    {member.sharedProjects.map((project: any) => (
                      <div
                        key={project.projectId}
                        className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: project.color || "#3b82f6" }}
                          />
                          <span className="text-sm text-foreground">{project.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {member.recentActivity && member.recentActivity.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Recent Activity
                  </h3>
                  <div className="space-y-2">
                    {member.recentActivity.map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-2 text-sm">
                        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div>
                          <span className="capitalize text-foreground">{activity.action}</span>{" "}
                          <span className="text-muted-foreground">{activity.entityType}</span>
                          <p className="text-xs text-muted-foreground">
                            {timeAgo(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remove Button (Admin-only) */}
              {isAdmin && member.role !== "admin" && (
                <div className="border-t border-border pt-4">
                  <Button
                    variant="outline"
                    className="w-full border border-red-700 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setShowRemoveDialog(true)}
                    disabled={isRemoving}
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    Remove from Project
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{fullName}</strong> will lose access to this project. Their assigned tasks
              will remain but they won&apos;t be able to view or update them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground" disabled={isRemoving}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing...
                </>
              ) : (
                "Remove Member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
