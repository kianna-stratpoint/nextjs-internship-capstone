"use client"

import { CheckCircle2, Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface CalendarEventDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: any | null
}

export function CalendarEventDetail({ open, onOpenChange, event }: CalendarEventDetailProps) {
  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {event.isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            {event.title}
          </DialogTitle>
          <DialogDescription>
            {event.type === "task" ? "Task" : "Event"}
            {event.listTitle && ` · ${event.listTitle}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {event.projectTitle && (
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: event.projectColor || "#3b82f6" }}
              />
              <span className="text-sm text-foreground">{event.projectTitle}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>
              {event.start &&
                new Date(event.start).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              {event.end &&
                event.start !== event.end &&
                ` — ${new Date(event.end).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}`}
            </span>
          </div>

          {event.priority && (
            <div className="text-sm">
              <span className="text-muted-foreground">Priority: </span>
              <span className="capitalize text-foreground">{event.priority}</span>
            </div>
          )}

          {event.isCompleted && (
            <div className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              This task has been completed.
            </div>
          )}

          {event.description && (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-foreground">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
