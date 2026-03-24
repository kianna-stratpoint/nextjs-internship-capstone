"use client"

import { Calendar as CalendarIcon, Clock, AlertTriangle } from "lucide-react"

/* ==================== HELPERS ==================== */

function getDaysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getDeadlineLabel(daysUntil: number): string {
  if (daysUntil < 0) return `${Math.abs(daysUntil)}d overdue`
  if (daysUntil === 0) return "Today"
  if (daysUntil === 1) return "Tomorrow"
  return `In ${daysUntil} days`
}

function getDeadlineColor(daysUntil: number): string {
  if (daysUntil < 0) return "text-red-600 dark:text-red-400"
  if (daysUntil <= 2) return "text-amber-600 dark:text-amber-400"
  return "text-muted-foreground"
}

/* ==================== COMPONENT ==================== */

interface UpcomingDeadlinesProps {
  events: any[]
}

export function UpcomingDeadlines({ events }: UpcomingDeadlinesProps) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const twoWeeksOut = new Date(now)
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14)

  const deadlines = events
    .filter((e) => {
      const endDate = new Date(e.end)
      return endDate >= now && endDate <= twoWeeksOut
    })
    .sort((a, b) => new Date(a.end).getTime() - new Date(b.end).getTime())
    .slice(0, 8)

  return (
    <div className="space-y-4">
      {/* Deadlines */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Upcoming Deadlines</h3>
        </div>

        {deadlines.length > 0 ? (
          <div className="space-y-3">
            {deadlines.map((event) => {
              const daysUntil = getDaysUntil(event.end)
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="mt-1">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: event.color || "#3b82f6" }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${
                        event.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {event.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          event.type === "task"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        }`}
                      >
                        {event.type === "task" ? "Task" : "Event"}
                      </span>
                      {event.projectTitle && (
                        <span className="truncate text-[10px] text-muted-foreground">
                          {event.projectTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.end).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className={`text-[10px] font-medium ${getDeadlineColor(daysUntil)}`}>
                      {daysUntil < 0 && <AlertTriangle className="mr-0.5 inline h-3 w-3" />}
                      {getDeadlineLabel(daysUntil)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <CalendarIcon className="mx-auto h-6 w-6 text-muted-foreground/30" />
            <p className="mt-2 text-xs text-muted-foreground">No upcoming deadlines</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Legend
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-foreground" />
            <span className="text-xs text-muted-foreground">Task (dot)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-8 rounded-sm bg-violet-500" />
            <span className="text-xs text-muted-foreground">Custom event (bar)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Completed task</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">High priority</span>
          </div>
        </div>
      </div>
    </div>
  )
}
