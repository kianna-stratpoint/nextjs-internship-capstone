"use client"

import { useState } from "react"
import { Plus, UserPlus, ClipboardList, Loader2 } from "lucide-react"
import { CreateProjectButton } from "@/components/features/projects/create-project-button"
import { CreateTaskButton } from "@/components/features/tasks/create-task-button"
import { useUIStore } from "@/stores/ui-store"
import { useProjects } from "@/hooks/use-projects"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function QuickActions() {
  const { openInviteMemberModal } = useUIStore()
  const { projects, isLoading: isLoadingProjects } = useProjects()
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState("")

  const adminProjects =
    projects?.filter(
      (p: any) => p.status === "active" && !p.isArchived && p.memberRole === "admin"
    ) || []

  const handleInviteClick = () => {
    if (adminProjects.length === 1) {
      openInviteMemberModal(adminProjects[0]!.id)
      return
    }
    setIsPickerOpen(true)
  }

  const handleConfirm = () => {
    if (!selectedProjectId) return
    setIsPickerOpen(false)
    setSelectedProjectId("")
    openInviteMemberModal(selectedProjectId)
  }

  const handleClose = () => {
    setIsPickerOpen(false)
    setSelectedProjectId("")
  }

  return (
    <>
      <div>
        <div className="mb-3 flex items-center gap-3">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Quick Actions
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Create New Project */}
          <CreateProjectButton className="group flex h-full w-full items-center justify-start gap-4 rounded-xl bg-primary p-5 text-left text-primary-foreground transition-colors hover:bg-primary/90">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
              <Plus size={20} />
            </div>
            <div>
              <p className="font-display text-sm font-semibold">Create New Project</p>
              <p className="text-xs font-medium opacity-60">
                Set up new project and invite your team
              </p>
            </div>
          </CreateProjectButton>

          {/* Add Team Member */}
          <button
            onClick={handleInviteClick}
            disabled={adminProjects.length === 0}
            className="group flex items-center gap-4 rounded-xl border border-border p-5 text-left transition-colors hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <UserPlus size={20} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-foreground">Add Team Member</p>
              <p className="text-xs text-muted-foreground">Invite someone to your project</p>
            </div>
          </button>

          {/* Create Task */}
          <CreateTaskButton className="group flex items-center gap-4 rounded-xl border border-border p-5 text-left transition-colors hover:bg-accent/50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <ClipboardList size={20} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-foreground">Create Task</p>
              <p className="text-xs text-muted-foreground">Add a task directly to any project</p>
            </div>
          </CreateTaskButton>
        </div>
      </div>

      {/* Project Picker Dialog */}
      <Dialog open={isPickerOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Select a Project</DialogTitle>
            <DialogDescription>Choose which project to invite a team member to.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={isLoadingProjects}
            >
              <SelectTrigger className="text-foreground">
                <SelectValue
                  placeholder={isLoadingProjects ? "Loading projects..." : "Select a project"}
                />
              </SelectTrigger>
              <SelectContent>
                {adminProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: project.color || "#3b82f6" }}
                      />
                      <span>{project.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="text-foreground"
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedProjectId}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
