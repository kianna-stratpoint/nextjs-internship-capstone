"use client"

import { useState, useCallback } from "react"
import { Plus } from "lucide-react"
import { useCalendar } from "@/hooks/use-calendar"
import { useUIStore } from "@/stores/ui-store"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { CalendarView } from "@/components/features/calendar/calendar-view"
import { UpcomingDeadlines } from "@/components/features/calendar/upcoming-deadlines"
import { CalendarEventModal } from "@/components/modals/calendar-event-modal"
import { CalendarEventDetail } from "@/components/features/calendar/calendar-event-detail"
import { CalendarDeleteDialog } from "@/components/features/calendar/calendar-delete-dialog"

import type { CalendarProject } from "@/types/calendar"

/* ==================== COMPONENT ==================== */

interface CalendarDashboardProps {
  projects: CalendarProject[]
}

export function CalendarDashboard({ projects }: CalendarDashboardProps) {
  // Date range — initialized to current month
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { start: start.toISOString(), end: end.toISOString() }
  })

  const [projectFilter, setProjectFilter] = useState<string | null>(null)

  // Store — create/edit modal
  const { openCalendarEventModal, closeCalendarEventModal, calendarEditingEvent } = useUIStore()

  // Local state — detail + delete
  const [detailEvent, setDetailEvent] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Data
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

  /* ==================== HANDLERS ==================== */

  const handleDatesSet = useCallback((start: string, end: string) => {
    setDateRange({ start, end })
  }, [])

  const handleDateClick = useCallback(
    (date: Date) => {
      openCalendarEventModal(date)
    },
    [openCalendarEventModal]
  )

  const handleEventClick = useCallback(
    (eventData: any) => {
      if (eventData.type === "task") {
        setDetailEvent(eventData)
        setIsDetailOpen(true)
      } else {
        openCalendarEventModal(undefined, eventData)
      }
    },
    [openCalendarEventModal]
  )

  const handleSave = async (payload: any) => {
    try {
      if (calendarEditingEvent && calendarEditingEvent.id) {
        await updateEvent({ eventId: calendarEditingEvent.id, data: payload })
      } else {
        await createEvent(payload)
      }
      closeCalendarEventModal()
    } catch (error) {
      // Handled by hook's toast
    }
  }

  const handleDelete = async () => {
    if (!calendarEditingEvent || calendarEditingEvent.type === "task") {
      setIsDeleteOpen(false)
      return
    }
    try {
      await deleteEvent(calendarEditingEvent.id)
    } catch (error) {
      // Handled by hook's toast
    } finally {
      setIsDeleteOpen(false)
      closeCalendarEventModal()
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls: project filter + new event */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={projectFilter ?? "all"}
          onValueChange={(val) => setProjectFilter(val === "all" ? null : val)}
        >
          <SelectTrigger className="w-full text-foreground sm:w-[300px]">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
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

        <Button onClick={() => openCalendarEventModal(new Date())}>
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </div>

      {/* Main layout: Calendar + Sidebar */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <CalendarView
          events={events}
          isLoading={isLoading}
          onDatesSet={handleDatesSet}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
        />
        <UpcomingDeadlines events={events} />
      </div>

      {/* Create / Edit Modal (store-controlled) */}
      <CalendarEventModal
        projects={projects}
        onSave={handleSave}
        onDelete={() => setIsDeleteOpen(true)}
        isSaving={isCreating || isUpdating}
      />

      {/* Task Detail (local state) */}
      <CalendarEventDetail open={isDetailOpen} onOpenChange={setIsDetailOpen} event={detailEvent} />

      {/* Delete Confirmation */}
      <CalendarDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        eventTitle={calendarEditingEvent?.title}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
