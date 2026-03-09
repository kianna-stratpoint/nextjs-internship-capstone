// TODO: Task 4.1 - Implement project CRUD operations
// TODO: Task 4.4 - Build task creation and editing functionality

/*
TODO: Implementation Notes for Interns:

Modal for creating new projects with form validation.

Features to implement:
- Form with project name, description, due date
- Zod validation
- Error handling
- Loading states
- Success feedback
- Team member assignment
- Project template selection

Form fields:
- Name (required)
- Description (optional)
- Due date (optional)
- Team members (optional)
- Project template (optional)
- Privacy settings

Integration:
- Use project validation schema from lib/validations.ts
- Call project creation API
- Update project list optimistically
- Handle errors gracefully
*/

"use client"

import { useState } from "react"
import { Loader2, UserPlus, Trash2 } from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { useProjects } from "@/hooks/use-projects"
import { useRouter } from "next/navigation"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PROJECT_COLORS = ["#2D6EF7", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#6B7280"]

export function CreateProjectModal() {
  const router = useRouter()

  const { isCreateProjectModalOpen, closeCreateProjectModal } = useUIStore()
  const { createProject, isCreating } = useProjects()

  // Form State
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0])
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  // Invites State
  const [invites, setInvites] = useState<{ email: string; role: string }[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("contributor")

  const handleAddInvite = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) return
    if (invites.some((i) => i.email === inviteEmail)) return

    setInvites([...invites, { email: inviteEmail, role: inviteRole }])
    setInviteEmail("")
  }

  const handleRemoveInvite = (emailToRemove: string) => {
    setInvites(invites.filter((i) => i.email !== emailToRemove))
  }

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    setFieldErrors({})

    try {
      const result = (await createProject(formData)) as any // Cast to capture our returned object

      handleClose()

      // Navigate to the newly created project board!
      if (result?.projectId) {
        router.push(`/projects/${result.projectId}`)
      }
    } catch (err: any) {
      if (err.fieldErrors) setFieldErrors(err.fieldErrors)
      if (err.error) setError(err.error)
    }
  }

  const handleClose = () => {
    closeCreateProjectModal()
    // Optional: reset form state here if desired
  }

  return (
    <Dialog open={isCreateProjectModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:rounded-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-display text-xl font-bold tracking-tight">
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Set up your new project and invite team members to collaborate.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 rounded-lg p-3 text-sm text-destructive">{error}</div>
        )}

        <form action={handleSubmit} className="space-y-6">
          <input type="hidden" name="color" value={selectedColor} />
          <input type="hidden" name="invites" value={JSON.stringify(invites)} />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left Column: Basic Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Project Name <span className="text-destructive">*</span>
                </label>
                <Input
                  name="title"
                  disabled={isCreating}
                  placeholder="e.g., Q3 Marketing Campaign"
                  className={
                    fieldErrors.title ? "border-destructive focus-visible:ring-destructive" : ""
                  }
                />
                {fieldErrors.title && (
                  <p className="text-xs text-destructive">{fieldErrors.title[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea
                  name="description"
                  rows={4}
                  disabled={isCreating}
                  placeholder="Briefly describe the project goals..."
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Project Color</label>
                <div className="flex gap-2 pt-1">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${
                        selectedColor === color
                          ? "ring-2 ring-brand ring-offset-2 dark:ring-offset-background"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Settings & Invites */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Start Date</label>
                  <Input type="date" name="startDate" disabled={isCreating} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Due Date</label>
                  <Input
                    type="date"
                    name="dueDate"
                    disabled={isCreating}
                    className={
                      fieldErrors.dueDate ? "border-destructive focus-visible:ring-destructive" : ""
                    }
                  />
                  {fieldErrors.dueDate && (
                    <p className="text-xs text-destructive">{fieldErrors.dueDate[0]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Priority</label>
                <Select name="priority" defaultValue="medium" disabled={isCreating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-surface space-y-3 rounded-lg border border-border p-4">
                <label className="text-sm font-medium text-foreground">Invite Team Members</label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="contributor">Contributor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="secondary" size="icon" onClick={handleAddInvite}>
                    <UserPlus size={16} />
                  </Button>
                </div>

                {invites.length > 0 && (
                  <ul className="scrollbar-thin mt-2 max-h-24 space-y-2 overflow-y-auto pr-2">
                    {invites.map((invite) => (
                      <li
                        key={invite.email}
                        className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                      >
                        <span className="truncate text-foreground">
                          {invite.email}{" "}
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({invite.role})
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInvite(invite.email)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-5 sm:flex-row">
            <div className="w-full text-left text-xs text-muted-foreground sm:w-auto">
              <p>You will be assigned as Admin by default.</p>
              <p>Default lists will be created automatically.</p>
            </div>
            <div className="flex w-full shrink-0 space-x-3 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isCreating}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1 bg-brand text-primary-foreground hover:bg-brand/90 sm:flex-none"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
