"use client"

import { useRef, useCallback } from "react"
import { Loader2 } from "lucide-react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"

import "@/styles/calendar.css"

import type { CalendarEventData } from "@/types/calendar"

interface CalendarViewProps {
  events: CalendarEventData[]
  isLoading: boolean
  onDatesSet: (start: string, end: string) => void
  onDateClick: (date: Date) => void
  onEventClick: (event: any) => void
}

export function CalendarView({
  events,
  isLoading,
  onDatesSet,
  onDateClick,
  onEventClick,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null)

  // Map events to FullCalendar format
  const calendarEvents = events.map((e) => {
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

  const handleDatesSet = useCallback(
    (arg: any) => {
      onDatesSet(arg.start.toISOString(), arg.end.toISOString())
    },
    [onDatesSet]
  )

  const handleDateClick = useCallback(
    (arg: any) => {
      onDateClick(new Date(arg.date))
    },
    [onDateClick]
  )

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
      onEventClick(eventData)
    },
    [onEventClick]
  )

  const handleEventDidMount = useCallback((info: any) => {
    const dotColor = info.event.extendedProps?.dotColor
    if (dotColor && info.el) {
      info.el.style.setProperty("--dot-color", dotColor)
    }
  }, [])

  return (
    <div className="relative w-full min-w-0 rounded-xl border border-border bg-card p-3 sm:p-5">
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
  )
}
