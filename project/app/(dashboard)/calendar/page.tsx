"use client"

import { useState, useRef, useCallback } from "react"
import { Plus, Loader2 } from "lucide-react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"

import { useCalendar } from "@/hooks/use-calendar"
import { useTeamMembers } from "@/hooks/use-team-member"
import { useUIStore } from "@/stores/ui-store"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

import { CalendarEventModal } from "@/components/modals/calendar-event-modal"
import { CalendarEventDetail } from "@/components/features/calendar/calendar-event-detail"
import { UpcomingDeadlines } from "@/components/features/calendar/upcoming-deadlines"

import "@/styles/calendar.css"

/* ==================== COMPONENT ==================== */

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null)

  // Date range for fetching — initialized to current month
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { start: start.toISOString(), end: end.toISOString() }
  })

  const [projectFilter, setProjectFilter] = useState<string | null>(null)

  // Store — controls the create/edit event modal
  const { openCalendarEventModal, closeCalendarEventModal, calendarEditingEvent } = useUIStore()

  // Local state — detail modal (read-only for tasks) and delete confirmation
  const [detailEvent, setDetailEvent] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Data
  const { memberProjects } = useTeamMembers(null)

  const {
    events,
    isLoading,
    createEvent,
    isCreating,
    updateEvent,
    isUpdating,
    deleteEvent,
    isDeleting,
  } = useCalendar(dateRange.start, dateRange.end, projectFilter === "all" ? null : projectFilter)

  // Map events to FullCalendar format
  const calendarEvents = events.map((e: any) => {
    const isTask = e.type === "task"
    const dotColor = e.isCompleted
      ? "#10B981"
      : e.priority === "high"
        ? "#EF4444"
        : e.priority === "medium"
          ? "#F59E0B"
          : e.color || "#3B82F6"

    return {
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.allDay,

      display: isTask ? "auto" : "block",

      backgroundColor: isTask ? "transparent" : e.color,
      borderColor: isTask ? "transparent" : e.color,
      textColor: isTask ? "inherit" : "#fff",
      extendedProps: { ...e, dotColor },
      classNames: isTask
        ? ["fc-task-event", e.isCompleted ? "fc-task-completed" : ""].filter(Boolean)
        : ["fc-event-bar"],
    }
  })

  /* ==================== HANDLERS ==================== */

  const handleDatesSet = useCallback((arg: any) => {
    setDateRange({
      start: arg.start.toISOString(),
      end: arg.end.toISOString(),
    })
  }, [])

  // Click empty date → open create modal with that date
  const handleDateClick = useCallback(
    (arg: any) => {
      openCalendarEventModal(new Date(arg.date))
    },
    [openCalendarEventModal]
  )

  // Click event → task opens detail, custom event opens edit
  const handleEventClick = useCallback(
    (arg: any) => {
      const eventData = {
        ...arg.event.extendedProps,
        id: arg.event.id,
        title: arg.event.title,
        start: arg.event.start,
        end: arg.event.end || arg.event.start,
        allDay: arg.event.allDay,
      }

      if (eventData.type === "task") {
        setDetailEvent(eventData)
        setIsDetailOpen(true)
      } else {
        openCalendarEventModal(undefined, eventData)
      }
    },
    [openCalendarEventModal]
  )

  // Inject dot color CSS variable on task events
  const handleEventDidMount = useCallback((info: any) => {
    const dotColor = info.event.extendedProps?.dotColor
    if (dotColor && info.el) {
      info.el.style.setProperty("--dot-color", dotColor)
    }
  }, [])

  // Save — create or update based on whether we're editing
  const handleSave = async (payload: any) => {
    try {
      if (calendarEditingEvent && calendarEditingEvent.id) {
        await updateEvent({ eventId: calendarEditingEvent.id, data: payload })
      } else {
        await createEvent(payload)
      }

      closeCalendarEventModal()
    } catch (error) {}
  }

  // Delete custom event
  const handleDelete = async () => {
    // Guard against missing event data or trying to delete a task here
    if (!calendarEditingEvent || calendarEditingEvent.type === "task") {
      setIsDeleteOpen(false)
      return
    }

    try {
      await deleteEvent(calendarEditingEvent.id)
    } catch (error) {
    } finally {
      setIsDeleteOpen(false)
      closeCalendarEventModal()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Calendar</h1>
        <div className="flex flex-wrap items-center gap-3">
          {/* Project Filter */}
          <Select
            value={projectFilter ?? "all"}
            onValueChange={(val) => setProjectFilter(val === "all" ? null : val)}
          >
            <SelectTrigger className="w-full text-foreground sm:w-[300px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {memberProjects.map((project: any) => (
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

          {/* New Event Button */}
          <Button onClick={() => openCalendarEventModal(new Date())}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      {/* Main Layout: Calendar + Sidebar */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        {/* Calendar */}
        <div className="relative w-full min-w-0 rounded-xl border border-border bg-card p-3 sm:p-5">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-card/50 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "today prev,next",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={calendarEvents}
            datesSet={handleDatesSet}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDidMount={handleEventDidMount}
            editable={false}
            selectable={false}
            dayMaxEvents={3}
            height="auto"
            firstDay={0}
            buttonText={{
              today: "Today",
              month: "Month",
              week: "Week",
              day: "Day",
            }}
          />
        </div>

        {/* Sidebar */}
        <UpcomingDeadlines events={events} />
      </div>

      {/* Create / Edit Event Modal (store-controlled) */}
      <CalendarEventModal
        projects={memberProjects}
        onSave={handleSave}
        onDelete={() => setIsDeleteOpen(true)}
        isSaving={isCreating || isUpdating}
      />

      {/* Task Detail Modal (local state — read-only) */}
      <CalendarEventDetail open={isDetailOpen} onOpenChange={setIsDetailOpen} event={detailEvent} />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{calendarEditingEvent?.title}&quot;? This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
