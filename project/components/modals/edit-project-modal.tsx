"use client"

import { useRef, useState } from "react"
import { useUIStore } from "@/stores/ui-store"
import { useProjects } from "@/hooks/use-projects"
import { Loader2, Lock, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

// Helper to format Date objects for native HTML <input type="date">
const formatDateForInput = (date?: Date | string | null) => {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}

export function EditProjectModal() {
  const { isEditProjectModalOpen, closeEditProjectModal, editingProject } = useUIStore()
  const { updateProject, isUpdating } = useProjects()
  const formRef = useRef<HTMLFormElement>(null)
  const { toast } = useToast()

  // Form State
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0])
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  // React Best Practice: Update state during render instead of inside useEffect
  // to avoid cascading renders (fixes the ESLint warning)
  const [prevIsOpen, setPrevIsOpen] = useState(isEditProjectModalOpen)

  if (isEditProjectModalOpen !== prevIsOpen) {
    setPrevIsOpen(isEditProjectModalOpen)
    if (isEditProjectModalOpen && editingProject) {
      setSelectedColor(editingProject.color || PROJECT_COLORS[0])
      setError(null)
      setFieldErrors({})
    }
  }

  if (!editingProject) return null

  const handleClose = () => {
    closeEditProjectModal()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)

    try {
      await updateProject(editingProject.id, formData)

      toast({
        title: "Project updated!",
        description: "Your changes have been successfully saved.",
      })

      handleClose()
    } catch (err: any) {
      // Removed the console.error to satisfy the ESLint no-console rule

      if (err?.fieldErrors) {
        setFieldErrors(err.fieldErrors)
        const keys = Object.keys(err.fieldErrors)

        if (keys.length > 0) {
          const firstField = keys[0]
          if (firstField) {
            toast({
              variant: "destructive",
              title: "Invalid input",
              description: err.fieldErrors[firstField][0],
            })
          }
        }
      } else if (err?.error) {
        setError(err.error)
        toast({
          variant: "destructive",
          title: "Update failed",
          description: err.error,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: "Please try again later.",
        })
      }
    }
  }

  return (
    <Dialog open={isEditProjectModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="scrollbar-thin scrollbar-thumb-muted-foreground/40 scrollbar-track-transparent max-h-[90vh] max-w-2xl overflow-y-auto text-foreground sm:rounded-xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="font-display text-xl font-bold tracking-tight text-foreground">
            Edit Project Details
          </DialogTitle>
          <DialogDescription>
            {/* Fixed the unescaped apostrophe here! */}
            Update your project&apos;s details, status, and preferences.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 rounded-lg p-3 text-sm text-destructive">{error}</div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="color" value={selectedColor} />

          {/* Row 1: Project Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Project Name <span className="text-destructive">*</span>
            </label>
            <Input
              name="title"
              disabled={isUpdating}
              defaultValue={editingProject.title}
              placeholder="e.g., Q3 Marketing Campaign"
              className={
                fieldErrors.title ? "border-destructive focus-visible:ring-destructive" : ""
              }
            />
            {fieldErrors.title && (
              <p className="text-xs text-destructive">{fieldErrors.title[0]}</p>
            )}
          </div>

          {/* Row 2: Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              name="description"
              rows={3}
              disabled={isUpdating}
              defaultValue={editingProject.description || ""}
              placeholder="Briefly describe the project goals..."
              className="resize-none"
            />
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
                      ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-background"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Row 4: Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select name="status" defaultValue={editingProject.status} disabled={isUpdating}>
                <SelectTrigger className="text-foreground">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Priority</label>
              <Select name="priority" defaultValue={editingProject.priority} disabled={isUpdating}>
                <SelectTrigger className="text-foreground">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 5: Privacy */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Privacy</label>
            <Select
              name="visibility"
              defaultValue={editingProject.visibility}
              disabled={isUpdating}
            >
              <SelectTrigger className="text-foreground">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock size={14} />
                    <span>Private (Invite Only)</span>
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

          {/* Row 6: Start Date & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Start Date</label>
              <Input
                type="date"
                name="startDate"
                disabled={isUpdating}
                defaultValue={formatDateForInput(editingProject.startDate)}
                className="text-foreground placeholder:text-foreground/50 [&::-webkit-calendar-picker-indicator]:brightness-100 [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Due Date</label>
              <Input
                type="date"
                name="dueDate"
                disabled={isUpdating}
                defaultValue={formatDateForInput(editingProject.dueDate)}
                className={`${fieldErrors.dueDate ? "border-destructive focus-visible:ring-destructive" : ""} text-foreground placeholder:text-foreground/50 [&::-webkit-calendar-picker-indicator]:brightness-100 [&::-webkit-calendar-picker-indicator]:invert`}
              />
              {fieldErrors.dueDate && (
                <p className="text-xs text-destructive">{fieldErrors.dueDate[0]}</p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-8 flex flex-col items-center justify-end gap-4 border-t border-border pt-5 sm:flex-row">
            <div className="flex w-full shrink-0 space-x-3 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isUpdating}
                className="flex-1 text-foreground sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="flex-1 bg-foreground text-primary-foreground hover:bg-foreground/90 sm:flex-none"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
