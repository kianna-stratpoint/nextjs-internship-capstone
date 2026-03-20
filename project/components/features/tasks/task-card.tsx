"use client"

import { Calendar, MoreHorizontal, Edit, Copy, Trash, User } from "lucide-react"
import { TaskWithAssignees } from "@/types"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import DOMPurify from "dompurify"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TaskCardProps {
  task: TaskWithAssignees
  onClick?: (task: TaskWithAssignees) => void
  onDelete?: (taskId: string) => void
  isOverlay?: boolean
}

export function TaskCard({ task, onClick, onDelete, isOverlay }: TaskCardProps) {
  const { toast } = useToast()

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
  })

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100"
      case "medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100"
      case "low":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100"
      default:
        return "bg-secondary text-secondary-foreground hover:bg-secondary/80"
    }
  }

  const formatDate = (dateString: Date | string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const getDueDateColor = (dueDate: Date | string | null, isCompleted: boolean) => {
    if (!dueDate || isCompleted) return "text-muted-foreground bg-secondary/50"

    const now = new Date()

    now.setHours(0, 0, 0, 0)

    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)

    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30 font-medium"
    } else if (diffDays <= 7) {
      return "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 font-medium"
    }

    return "text-muted-foreground bg-secondary/50"
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/projects/${task.projectId}?taskId=${task.id}`
    navigator.clipboard.writeText(url)

    toast({
      title: "Link copied!",
      description: "Task link has been copied to your clipboard.",
    })
  }

  const sanitizedDescription =
    typeof window !== "undefined" ? DOMPurify.sanitize(task.description || "") : ""

  if (isOverlay) {
    return (
      <div className="flex rotate-2 cursor-grabbing flex-col gap-3 rounded-md border bg-card p-3 opacity-90 shadow-xl ring-2 ring-primary">
        <h4 className="line-clamp-2 text-base font-bold leading-snug">{task.title}</h4>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(task)}
      className={`group relative mb-2 flex cursor-pointer flex-col gap-3 rounded-md border border-muted-foreground/20 bg-card p-3 shadow-sm transition-all hover:ring-1 hover:ring-primary ${
        task.isCompleted ? "opacity-60" : "opacity-100"
      }`}
    >
      {/* Top Row: Title & Actions */}
      <div className="flex items-start justify-between gap-2">
        <h4
          className={`line-clamp-2 text-sm font-medium leading-snug ${
            task.isCompleted ? "text-muted-foreground line-through" : "text-card-foreground"
          }`}
        >
          {task.title}
        </h4>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={14} className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onClick?.(task)
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(task.id)
              }}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <div
          className="line-clamp-2 text-xs text-muted-foreground [&>*]:m-0"
          dangerouslySetInnerHTML={{
            __html: sanitizedDescription,
          }}
        />
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        {/* Left Side: Priority & Date */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant="secondary"
            className={`text-[10px] font-semibold uppercase tracking-wider ${getPriorityColor(task.priority)}`}
          >
            {task.priority || "No Priority"}
          </Badge>

          <div
            className={`flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 ${getDueDateColor(task.dueDate, task.isCompleted)}`}
          >
            <Calendar size={12} />
            <span className="whitespace-nowrap">
              {task.dueDate ? formatDate(task.dueDate) : "No Due Date"}
            </span>
          </div>
        </div>

        {/* Right Side: Assignee Avatars */}
        <div className="flex shrink-0 -space-x-2 overflow-hidden">
          {task.assignees && task.assignees.length > 0 ? (
            task.assignees.map(({ user }) => (
              <Avatar key={user.id} className="inline-block h-6 w-6 border-2 border-background">
                <AvatarImage src={user.imageUrl || ""} alt={user.firstName || "User"} />
                <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                  {user.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            ))
          ) : (
            // Fallback Avatar when there are no assignees
            <Avatar className="inline-block h-6 w-6 border-2 border-background">
              <AvatarFallback className="bg-muted text-muted-foreground">
                <User size={12} />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  )
}
