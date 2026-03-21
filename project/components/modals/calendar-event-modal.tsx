"use client"

import { useState, useEffect } from "react"
import { Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/shared/date-picker"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useUIStore } from "@/stores/ui-store"

const EVENT_COLORS = ["#2D6EF7", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#64748B"]

interface CalendarEventFormProps {
  projects: any[]
  onSave: (data: any) => Promise<any>
  onDelete?: () => void
  isSaving: boolean
  isDeleting?: boolean
}

export function CalendarEventModal({
  projects,
  onSave,
  onDelete,
  isSaving,
  isDeleting = false,
}: CalendarEventFormProps) {
  const {
    isCalendarEventModalOpen: open,
    calendarEditingEvent: event,
    calendarDefaultDate: defaultDate,
    closeCalendarEventModal,
  } = useUIStore()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [isMultiDay, setIsMultiDay] = useState(false)
  const [color, setColor] = useState(EVENT_COLORS[0])
  const [projectId, setProjectId] = useState<string>("personal")
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens
  // Remove the useEffect entirely and replace with:

  const [prevOpen, setPrevOpen] = useState(false)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      if (event) {
        setTitle(event.title || "")
        setDescription(event.description || "")
        const start = new Date(event.start)
        const end = new Date(event.end)
        setDate(start)

        const startDay = start.toDateString()
        const endDay = end.toDateString()
        if (startDay !== endDay) {
          setIsMultiDay(true)
          setEndDate(end)
        } else {
          setIsMultiDay(false)
          setEndDate(undefined)
        }

        setStartTime("")
        setEndTime("")
        setColor(event.color || EVENT_COLORS[0])
        setProjectId(event.projectId || "personal")
      } else {
        setTitle("")
        setDescription("")
        setDate(defaultDate || new Date())
        setEndDate(undefined)
        setStartTime("")
        setEndTime("")
        setIsMultiDay(false)
        setColor(EVENT_COLORS[0])
        setProjectId("personal")
      }
      setError(null)
    }
  }

  const handleSubmit = async () => {
    setError(null)

    if (!title.trim()) {
      setError("Title is required.")
      return
    }
    if (!date) {
      setError("Date is required.")
      return
    }

    // Build start and end dates
    let startDate = new Date(date)
    let computedEndDate: Date

    if (startTime) {
      const [hours, minutes] = startTime.split(":").map(Number)
      startDate.setHours(hours ?? 0, minutes ?? 0, 0, 0)
    } else {
      startDate.setHours(0, 0, 0, 0)
    }

    if (isMultiDay && endDate) {
      computedEndDate = new Date(endDate)
      if (endTime) {
        const [hours, minutes] = endTime.split(":").map(Number)
        computedEndDate.setHours(hours ?? 0, minutes ?? 0, 0, 0)
      } else {
        computedEndDate.setHours(23, 59, 59, 999)
      }
    } else {
      // Single-day: end = same day end of day (or start + 1 hour if timed)
      computedEndDate = new Date(startDate)
      if (endTime) {
        const [hours, minutes] = endTime.split(":").map(Number)
        computedEndDate.setHours(hours ?? 0, minutes ?? 0, 0, 0)
      } else if (startTime) {
        computedEndDate.setHours(startDate.getHours() + 1, startDate.getMinutes(), 0, 0)
      } else {
        computedEndDate.setHours(23, 59, 59, 999)
      }
    }

    if (computedEndDate < startDate) {
      setError("End time must be after start time.")
      return
    }

    const isAllDay = !startTime && !endTime

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      startDate: startDate.toISOString(),
      endDate: computedEndDate.toISOString(),
      allDay: isAllDay,
      color,
      projectId: projectId === "personal" ? null : projectId,
    }

    try {
      const result = await onSave(payload)
      if (result && !result.success) {
        setError(result.error ?? "Failed to save.")
        return
      }
      closeCalendarEventModal()
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    }
  }

  const isEditing = !!event
  const isBusy = isSaving || isDeleting

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) closeCalendarEventModal()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Edit Event" : "New Event"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the event details." : "Create a new calendar event."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 rounded-lg p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              disabled={isBusy}
              className="text-foreground"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit()
              }}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              disabled={isBusy}
              className="resize-none text-foreground"
            />
          </div>

          {/* Date */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {isMultiDay ? "Start Date" : "Date"} <span className="text-destructive">*</span>
                </label>
                <DatePicker
                  value={date}
                  onChange={setDate}
                  placeholder="Pick a date"
                  disabled={isBusy}
                />
              </div>

              {isMultiDay && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">End Date</label>
                  <DatePicker
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="End date"
                    disabled={isBusy}
                    disabledDates={(d) => (date ? d < date : false)}
                  />
                </div>
              )}
            </div>

            {/* Time inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Start Time</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isBusy}
                  className="text-foreground"
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">End Time</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={isBusy}
                  className="text-foreground"
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Multi-day toggle */}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={isMultiDay}
                onChange={(e) => {
                  setIsMultiDay(e.target.checked)
                  if (!e.target.checked) setEndDate(undefined)
                }}
                className="rounded border-border"
                disabled={isBusy}
              />
              Multi-day event
            </label>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Project</label>
            <Select value={projectId} onValueChange={setProjectId} disabled={isBusy}>
              <SelectTrigger className="text-foreground">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal (No project)</SelectItem>
                {projects.map((project: any) => (
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

          {/* Color */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Color</label>
            <div className="flex gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${
                    color === c
                      ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-background"
                      : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          {isEditing && onDelete && (
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
              disabled={isBusy}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={closeCalendarEventModal}
              disabled={isBusy}
              className="text-foreground"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isBusy || !title.trim()}>
              {isBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
