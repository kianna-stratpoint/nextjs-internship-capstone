import { useState, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Paperclip, Tags, X, ExternalLink, Trash2 } from "lucide-react"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/shared/date-picker"
import { RichTextEditor } from "@/components/shared/rich-text-editor"
import { AssigneeSelector, AssigneeAvatars } from "@/components/shared/assignee-selector"
import { FileIcon } from "@/components/shared/file-icon"
import { formatFileSize } from "@/lib/utils"
import { getCurrentDbUserAction } from "@/lib/actions/users"
import { getTaskByIdAction, assignTaskAction, unassignTaskAction } from "@/lib/actions/tasks"
import { useTaskAttachments } from "@/hooks/use-task-attachments"
import { TaskActivity } from "./task-activity"
import { TaskComments } from "./task-comments"
interface TaskSheetProps {
  task: any | null
  isOpen: boolean
  onClose: () => void
  updateTask: (params: { taskId: string; data: any }) => Promise<any>
  saveAttachments: (params: {
    taskId: string
    attachments: { url: string; name: string; size: number; type: string }[]
  }) => Promise<any>
  deleteAttachment: (params: { attachmentId: string; taskId: string }) => Promise<any>
  isDeletingAttachment?: boolean
  lists?: { id: string; title: string }[]
  projectId?: string
}

export function TaskSheet({
  task,
  isOpen,
  onClose,
  updateTask,
  saveAttachments,
  deleteAttachment,
  isDeletingAttachment = false,
  lists = [],
  projectId,
}: TaskSheetProps) {
  const queryClient = useQueryClient()

  const {
    addAttachments,
    deleteAttachment: deleteAttachmentFn,
    isUploading,
  } = useTaskAttachments({
    saveAttachmentsAction: saveAttachments,
    deleteAttachmentAction: deleteAttachment,
  })

  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [priority, setPriority] = useState<string | null>(task?.priority || null)
  const [listId, setListId] = useState<string>(task?.listId || "")

  const [labels, setLabels] = useState<string[]>(
    Array.isArray(task?.labels)
      ? task.labels
          .map((item: any) => {
            if (typeof item === "string") return item
            return item.label?.name || item.label?.title || item.labelId || ""
          })
          .filter(Boolean)
      : []
  )
  const [labelInput, setLabelInput] = useState("")

  // File picker state
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [startDate, setStartDate] = useState<Date | undefined>(
    task?.startDate ? new Date(task.startDate) : undefined
  )
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.dueDate ? new Date(task.dueDate) : undefined
  )

  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; dates?: string }>({})

  const { data: fullTask } = useQuery({
    queryKey: ["task-detail", task?.id],
    queryFn: async () => {
      const result = await getTaskByIdAction(task!.id)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    enabled: isOpen && !!task?.id,
  })

  const existingAttachments = fullTask?.attachments || []

  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ["current-db-user"],
    queryFn: async () => {
      const result = await getCurrentDbUserAction()
      if (result.error) throw new Error(result.error)
      return result.data
    },
    enabled: isOpen,
    staleTime: Infinity,
  })

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
      setPendingFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task) return
    try {
      await deleteAttachmentFn({ attachmentId, taskId: task.id })
      queryClient.invalidateQueries({ queryKey: ["task-detail", task.id] })
    } catch (error) {
      // Error handled by mutation's onError
    }
  }

  const handleSave = async () => {
    if (!task) return

    const newErrors: { title?: string; dates?: string } = {}
    if (!title.trim()) {
      newErrors.title = "Task name is required."
    }
    if (startDate && dueDate && startDate > dueDate) {
      newErrors.dates = "Due date cannot be before the start date."
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsSaving(true)

    try {
      if (pendingFiles.length > 0) {
        await addAttachments({ taskId: task.id, files: pendingFiles })
        setPendingFiles([])
        queryClient.invalidateQueries({ queryKey: ["task-detail", task.id] })
      }

      await updateTask({
        taskId: task.id,
        data: {
          title: title.trim(),
          description,
          priority,
          listId,
          startDate: startDate ?? null,
          dueDate: dueDate ?? null,
          labels,
        },
      })

      onClose()
    } catch (error) {
      // Errors handled by mutation's onError
    } finally {
      setIsSaving(false)
    }
  }

  if (!task) return null

  const isBusy = isSaving || isUploading

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-6xl">
        <div className="border-b border-muted p-6">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold">Task Details</SheetTitle>
            <p className="text-sm text-muted-foreground">Task #{task.id.slice(0, 4)}</p>
          </SheetHeader>
        </div>

        <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
          {/* LEFT COLUMN: FORM */}
          <div className="space-y-6">
            {/* Task Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Task Name <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-muted-foreground">{title.length}/80</span>
              </div>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (errors.title) setErrors({ ...errors, title: undefined })
                }}
                maxLength={80}
                placeholder="Task Name"
                className={`text-foreground ${errors.title ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </label>
              <RichTextEditor value={description} onChange={setDescription} />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Status (List)
              </label>
              <Select value={listId} onValueChange={setListId}>
                <SelectTrigger className="text-foreground">
                  <SelectValue placeholder="Select a list" />
                </SelectTrigger>
                <SelectContent>
                  {lists.length > 0 ? (
                    lists.map((list) => (
                      <SelectItem key={list.id} value={list.id} className="text-foreground">
                        {list.title}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={listId} className="text-foreground">
                      Current List
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Priority
              </label>
              <Select
                value={priority || "none"}
                onValueChange={(val) => setPriority(val === "none" ? null : val)}
              >
                <SelectTrigger className="text-foreground">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-muted-foreground">
                    No Priority
                  </SelectItem>
                  <SelectItem value="low" className="text-foreground">
                    Low
                  </SelectItem>
                  <SelectItem value="medium" className="text-foreground">
                    Medium
                  </SelectItem>
                  <SelectItem value="high" className="text-foreground">
                    High
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Labels */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Tags className="h-3.5 w-3.5" /> Labels
              </label>
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
                className="text-foreground"
              />
            </div>

            {/* ── ATTACHMENTS SECTION ── */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Paperclip className="h-3.5 w-3.5" /> Attachments
                {existingAttachments.length > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
                    {existingAttachments.length}
                  </span>
                )}
              </label>

              {/* Existing Attachments (from DB — always fresh via dedicated query) */}
              {existingAttachments.length > 0 && (
                <div className="max-h-[200px] space-y-1.5 overflow-y-auto rounded-md border border-border p-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
                  {existingAttachments.map((att: any) => {
                    const canDelete = currentUser?.id === att.uploadedById
                    return (
                      <div
                        key={att.id}
                        className="group flex items-center justify-between rounded bg-muted/50 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileIcon type={att.type} />
                          <span className="max-w-[45%] truncate font-medium text-foreground">
                            {att.name}
                          </span>
                          <span className="text-muted-foreground">{formatFileSize(att.size)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            title="Open file"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att.id)}
                              disabled={isDeletingAttachment}
                              className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                              title="Delete attachment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pending Files (to be uploaded on save) */}
              {pendingFiles.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">
                    New files (will be uploaded on save):
                  </p>
                  {pendingFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded bg-blue-500/5 px-3 py-2 text-xs ring-1 ring-blue-500/20"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileIcon type={file.type} />
                        <span className="max-w-[60%] truncate font-medium text-foreground">
                          {file.name}
                        </span>
                        <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePendingFile(idx)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Trigger */}
              <div
                className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border p-3 transition-colors hover:bg-accent/50"
                onClick={() => !isBusy && fileInputRef.current?.click()}
              >
                <Paperclip size={16} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Click to add files (images up to 4MB, PDFs up to 8MB)
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
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Start Date
                </label>
                <DatePicker
                  value={startDate}
                  onChange={(date) => {
                    setStartDate(date)
                    if (errors.dates) setErrors({ ...errors, dates: undefined })
                  }}
                  placeholder="Select start date"
                  className={`w-full text-foreground ${errors.dates ? "border-red-500" : ""}`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Due Date
                </label>
                <DatePicker
                  value={dueDate}
                  onChange={(date) => {
                    setDueDate(date)
                    if (errors.dates) setErrors({ ...errors, dates: undefined })
                  }}
                  placeholder="Select due date"
                  className={`w-full text-foreground ${errors.dates ? "border-red-500" : ""}`}
                  disabledDates={(date) => (startDate ? date < startDate : false)}
                />
              </div>
            </div>
            {errors.dates && <p className="text-xs text-red-500">{errors.dates}</p>}

            {/* Assignees */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Assignees <span className="font-normal normal-case">(optional)</span>
              </label>
              <div className="flex items-center gap-2">
                {fullTask?.assignees && fullTask.assignees.length > 0 && (
                  <AssigneeAvatars assignees={fullTask.assignees} max={5} size="md" />
                )}
                {projectId && (
                  <AssigneeSelector
                    projectId={projectId}
                    assignedUserIds={fullTask?.assignees?.map((a: any) => a.user.id) ?? []}
                    onToggle={async (userId: string, isAssigning: boolean) => {
                      if (isAssigning) {
                        await assignTaskAction(
                          { taskId: task.id, assigneeUserId: userId },
                          task.projectId
                        )
                      } else {
                        await unassignTaskAction(
                          { taskId: task.id, assigneeUserId: userId },
                          task.projectId
                        )
                      }
                      queryClient.invalidateQueries({ queryKey: ["task-detail", task.id] })
                      queryClient.invalidateQueries({ queryKey: ["project-lists", task.projectId] })
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIVITY & COMMENTS */}
          <div className="flex max-h-[800px] min-h-[500px] flex-col space-y-6 md:border-l md:border-muted md:pl-8">
            {currentUser && (
              <TaskActivity
                taskId={task.id}
                currentUserId={currentUser.id}
                createdAt={task.createdAt}
              />
            )}

            <div className="flex-1 overflow-hidden pt-4">
              {isUserLoading || !currentUser ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <TaskComments
                  taskId={task.id}
                  projectId={task.projectId}
                  currentUser={currentUser as any}
                />
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-muted p-6">
          <Button variant="outline" onClick={onClose} disabled={isBusy} className="text-foreground">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isBusy || !title.trim()}>
            {isBusy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploading ? "Uploading..." : "Saving..."}
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
