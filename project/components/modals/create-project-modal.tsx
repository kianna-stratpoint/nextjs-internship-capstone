"use client"

import { useState } from "react"
import { Loader2, UserPlus, Trash2, Lock, Globe, Shield } from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { useProjects } from "@/hooks/use-projects"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

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
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { DatePicker } from "@/components/shared/date-picker"

const PROJECT_COLORS = ["#2D6EF7", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#6B7280"]

export function CreateProjectModal() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()

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

  const [startDate, setStartDate] = useState<Date | undefined>()
  const [dueDate, setDueDate] = useState<Date | undefined>()

  const handleAddInvite = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) return

    if (inviteEmail === user?.primaryEmailAddress?.emailAddress) {
      toast({
        title: "Oops!",
        description: "You are already an admin of this project.",
        variant: "destructive",
      })
      return
    }

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

    if (formData.get("priority") === "none") {
      formData.set("priority", "")
    }

    try {
      const result = (await createProject(formData)) as any

      if (result?.fieldErrors) {
        setFieldErrors(result.fieldErrors)
        return
      }

      if (result?.error) {
        setError(result.error)
        return
      }

      handleClose()

      if (result?.projectId) {
        router.push(`/projects/${result.projectId}`)
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    }
  }

  const handleClose = () => {
    closeCreateProjectModal()
  }

  return (
    <Dialog open={isCreateProjectModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="scrollbar-thin scrollbar-thumb-muted-foreground/40 scrollbar-track-transparent max-h-[90vh] max-w-2xl overflow-y-auto text-foreground sm:rounded-xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="font-display text-xl font-bold tracking-tight text-foreground">
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
          <input type="hidden" name="startDate" value={startDate ? startDate.toISOString() : ""} />
          <input type="hidden" name="dueDate" value={dueDate ? dueDate.toISOString() : ""} />

          {/* Row 1: Project Name */}
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
              <p className="mt-1 text-xs text-destructive">{fieldErrors.title[0]}</p>
            )}
          </div>

          {/* Row 2: Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              name="description"
              rows={3}
              disabled={isCreating}
              placeholder="Briefly describe the project goals..."
              className={`resize-none ${fieldErrors.description ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.description[0]}</p>
            )}
          </div>

          {/* Row 3: Project Color */}
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

          {/* Row 4: Privacy & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Privacy</label>
              <Select name="visibility" defaultValue="private" disabled={isCreating}>
                <SelectTrigger className="text-foreground">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock size={14} />
                      <span>Private</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe size={14} />
                      <span>Public</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Priority</label>
              <Select name="priority" disabled={isCreating}>
                <SelectTrigger className="text-foreground">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 5: Start Date & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Start Date</label>

              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Select start date"
                disabled={isCreating}
                className={
                  fieldErrors.startDate ? "border-destructive focus-visible:ring-destructive" : ""
                }
              />

              {fieldErrors.startDate && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.startDate[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Due Date</label>

              <DatePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder="Select due date"
                disabled={isCreating}
                className={
                  fieldErrors.dueDate ? "border-destructive focus-visible:ring-destructive" : ""
                }
                disabledDates={(date) => (startDate ? date < startDate : false)}
              />

              {fieldErrors.dueDate && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.dueDate[0]}</p>
              )}
            </div>
          </div>

          {/* Invite Members Section */}
          <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <h3 className="text-sm font-medium text-foreground">Invite Team Members</h3>
              <p className="text-xs text-muted-foreground">
                Invited members will receive a notification to join the project.
              </p>
            </div>

            {/* Default Creator (Admin) Row */}
            <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
              <div className="flex items-center gap-3">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt="You"
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Shield size={14} />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {user?.fullName || "You"}
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                      You
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress || "admin@project.com"}
                  </span>
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground">Admin</span>
            </div>

            {/* Add New Invite Row */}
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Colleague's email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 bg-background text-foreground"
              />
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="w-[120px] bg-background text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contributor">Contributor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="secondary" size="icon" onClick={handleAddInvite}>
                <UserPlus size={16} />
              </Button>
            </div>

            {/* Invited Members List */}
            {invites.length > 0 && (
              <ul className="scrollbar-thin mt-2 max-h-32 space-y-2 overflow-y-auto pr-2">
                {invites.map((invite) => (
                  <li
                    key={invite.email}
                    className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="text-foreground">{invite.email}</span>
                      <span className="text-xs capitalize text-muted-foreground">
                        {invite.role}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveInvite(invite.email)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-5 sm:flex-row">
            <div className="w-full text-left text-xs text-muted-foreground sm:w-auto">
              <p>Default lists (To Do, In Progress, Review, Done) will be created automatically.</p>
            </div>
            <div className="flex w-full shrink-0 space-x-3 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isCreating}
                className="flex-1 text-foreground sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1 bg-foreground text-primary-foreground hover:bg-foreground/90 sm:flex-none"
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
