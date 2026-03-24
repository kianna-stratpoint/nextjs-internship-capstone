"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, X, Paperclip } from "lucide-react"

import { useUIStore } from "@/stores/ui-store"
import { useProjects } from "@/hooks/use-projects"
import { useQuery } from "@tanstack/react-query"
import { formatFileSize } from "@/lib/utils"
import { getProjectListsAction } from "@/lib/actions/lists"
import { useGlobalTaskCreator } from "@/hooks/use-global-task"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AssigneeSelector } from "@/components/shared/assignee-selector"
import { DatePicker } from "@/components/shared/date-picker"
import { FileIcon } from "@/components/shared/file-icon"
import { RichTextEditor } from "@/components/shared/rich-text-editor"

export function CreateTaskModal() {
  const { isCreateTaskModalOpen, closeCreateTaskModal } = useUIStore()
  const { createGlobalTask, isUploading } = useGlobalTaskCreator()
  const router = useRouter()

  // Projects Data
  const { projects, isLoading: isLoadingProjects } = useProjects()
  const availableProjects = projects?.filter((p) => p.status === "active" && !p.isArchived) || []

  // Form State
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [projectId, setProjectId] = useState("")
  const [listId, setListId] = useState("")
  const [priority, setPriority] = useState<string>("none")
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [dueDate, setDueDate] = useState<Date | undefined>()

  // Labels State
  const [labels, setLabels] = useState<string[]>([])
  const [labelInput, setLabelInput] = useState("")

  // Files State (stored locally until submit)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [dueDateError, setDueDateError] = useState<string | null>(null)

  const [assigneeIds, setAssigneeIds] = useState<string[]>([])

  // Fetch lists dynamically
  const { data: projectLists = [], isLoading: isLoadingLists } = useQuery({
    queryKey: ["project-lists", projectId],
    queryFn: async () => {
      const result = await getProjectListsAction(projectId)
      return result.data || []
    },
    enabled: !!projectId,
  })

  const isBusy = createGlobalTask.isPending || isUploading

  // Handlers
  const handleAddLabel = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && labelInput.trim()) {
      e.preventDefault()
      if (!labels.includes(labelInput.trim())) {
        setLabels([...labels, labelInput.trim()])
      }
      setLabelInput("")
    }
  }

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter((l) => l !== labelToRemove))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
    // Reset the input so re-selecting the same file works
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setProjectId("")
    setListId("")
    setPriority("none")
    setStartDate(undefined)
    setDueDate(undefined)
    setLabels([])
    setLabelInput("")
    setFiles([])
    setDueDateError(null)
    setAssigneeIds([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !projectId || !listId) return

    if (startDate && dueDate && dueDate < startDate) {
      setDueDateError("Due date cannot be earlier than the start date.")
      return
    }
    setDueDateError(null)

    // Build FormData (without files — those go through uploadthing)
    const formData = new FormData()
    formData.append("title", title)
    formData.append("description", description)
    formData.append("projectId", projectId)
    formData.append("listId", listId)
    if (priority && priority !== "none") formData.append("priority", priority)
    if (startDate) formData.append("startDate", startDate.toISOString())
    if (dueDate) formData.append("dueDate", dueDate.toISOString())
    formData.append("labels", JSON.stringify(labels))
    formData.append("assigneeIds", JSON.stringify(assigneeIds))

    // Pass files separately — hook uploads them via uploadthing first
    createGlobalTask.mutate(
      { formData, files },
      {
        onSuccess: () => {
          resetForm()
          closeCreateTaskModal()
          router.push(`/projects/${projectId}`)
        },
      }
    )
  }

  const handleClose = () => {
    if (!isBusy) {
      resetForm()
      closeCreateTaskModal()
    }
  }

  return (
    <Dialog open={isCreateTaskModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="scrollbar-thin scrollbar-thumb-muted-foreground/40 scrollbar-track-transparent max-h-[90vh] max-w-2xl overflow-y-auto text-foreground sm:rounded-xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="font-display text-xl font-bold tracking-tight text-foreground">
            Create New Task
          </DialogTitle>
          <DialogDescription>
            Add a new task with details, dates, and attachments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Task Title <span className="text-destructive">*</span>
            </label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Update landing page copy"
              disabled={isBusy}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Add more details to this task..."
              disabled={isBusy}
            />
          </div>

          {/* Project & List Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Project <span className="text-destructive">*</span>
              </label>
              <Select
                value={projectId}
                onValueChange={(value) => {
                  setProjectId(value)
                  setListId("")
                  setAssigneeIds([])
                }}
                disabled={isLoadingProjects || isBusy}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {availableProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                List <span className="text-destructive">*</span>
              </label>
              <Select
                value={listId}
                onValueChange={setListId}
                disabled={!projectId || isLoadingLists || isBusy}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={!projectId ? "Select project first" : "Select a list"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {projectLists.map((list: any) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority & Dates Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Priority</label>
              <Select value={priority} onValueChange={setPriority} disabled={isBusy}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Start Date</label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                disabled={isBusy}
                placeholder="Start date"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Due Date</label>
              <DatePicker
                value={dueDate}
                onChange={(date) => {
                  setDueDate(date)
                  if (dueDateError) setDueDateError(null)
                }}
                disabled={isBusy}
                disabledDates={(date) => (startDate ? date < startDate : false)}
                placeholder="Due date"
              />
              {dueDateError && <p className="text-xs text-destructive">{dueDateError}</p>}
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Labels</label>
            <div className="mb-2 flex flex-wrap gap-2">
              {labels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => handleRemoveLabel(label)}
                    className="hover:text-foreground"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <Input
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={handleAddLabel}
              placeholder="Type a label and press Enter..."
              disabled={isBusy}
            />
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Assignees</label>
            <div className="flex items-center gap-2">
              {assigneeIds.length > 0 && (
                <div className="flex -space-x-1.5">
                  {assigneeIds.map((id) => (
                    <div
                      key={id}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-foreground text-xs font-bold text-background"
                    >
                      {id.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                </div>
              )}
              {projectId && (
                <AssigneeSelector
                  projectId={projectId}
                  assignedUserIds={assigneeIds}
                  onToggle={(userId: string, isAssigning: boolean) => {
                    if (isAssigning) {
                      setAssigneeIds((prev) => [...prev, userId])
                    } else {
                      setAssigneeIds((prev) => prev.filter((id) => id !== userId))
                    }
                  }}
                  disabled={isBusy}
                />
              )}
            </div>
            {!projectId && (
              <p className="text-xs text-muted-foreground">
                Select a project first to assign members
              </p>
            )}
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Attachments</label>
            <div
              className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border p-4 transition-colors hover:bg-accent/50"
              onClick={() => !isBusy && fileInputRef.current?.click()}
            >
              <Paperclip size={18} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to select files (images up to 4MB, PDFs up to 8MB)
              </span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                disabled={isBusy}
              />
            </div>

            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((file, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded bg-muted/50 p-2 text-xs text-foreground"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileIcon type={file.type} />
                      <span className="max-w-[60%] truncate">{file.name}</span>
                      <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter className="mt-8 border-t border-border pt-5">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isBusy}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title || !projectId || !listId || isBusy}>
              {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isUploading ? "Uploading..." : isBusy ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
