"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Plus, MoreHorizontal, Loader2, Trash2, Edit2, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { TaskCard } from "@/components/features/tasks/task-card"

const PRESET_COLORS = ["#2D6EF7", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#64748B"]

interface ListColumnProps {
  list: any
  canModifyBoard: boolean
  hasDoneList: boolean
  doneListsCount: number
  currentUserId: string
  isOverlay?: boolean
  onEditList: (id: string, data: any) => Promise<void>
  onDeleteClick: (list: any) => void
  onCreateTask: (listId: string, title: string, priority: string | null) => void
  isTaskPending: boolean
  onTaskClick: (task: any) => void
  onTaskDeleteClick: (taskId: string) => void
}

export function ListColumn({
  list,
  canModifyBoard,
  hasDoneList,
  doneListsCount,
  currentUserId,
  isOverlay,
  onEditList,
  onDeleteClick,
  onCreateTask,
  isTaskPending,
  onTaskClick,
  onTaskDeleteClick,
}: ListColumnProps) {
  // --- DND-KIT HOOK ---
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: `list-${list.id}`,
    data: { type: "List", list },
  })

  const taskIds = useMemo(() => {
    return list.tasks?.map((t: any) => t.id) || []
  }, [list.tasks])

  // Prevent interactions while dragging
  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1, // Dim the original column while dragging it
  }

  // --- LOCAL UI STATE ---
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(list.title)
  const [editColor, setEditColor] = useState(list.color || PRESET_COLORS[0])
  const [editType, setEditType] = useState(list.type || "custom")

  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<string | null>(null)

  const taskInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isAddingTask && taskInputRef.current) taskInputRef.current.focus()
  }, [isAddingTask])

  // --- HANDLERS ---
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim()) return
    await onEditList(list.id, { title: editTitle.trim(), color: editColor, type: editType })
    setIsEditing(false)
  }

  const handleSaveTask = () => {
    if (!newTaskTitle.trim()) return
    onCreateTask(list.id, newTaskTitle.trim(), newTaskPriority)
    setNewTaskTitle("")
    setNewTaskPriority(null)
    setIsAddingTask(false)
  }

  const handleTaskKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSaveTask()
    }
    if (e.key === "Escape") {
      setIsAddingTask(false)
      setNewTaskTitle("")
    }
  }

  const isOnlyDoneList = list.type === "done" && doneListsCount <= 1
  const canDeleteThisList =
    !isOnlyDoneList && canModifyBoard && (list.createdById === currentUserId || canModifyBoard) // Adjust based on your actual admin check

  // If this is the floating overlay, we strip the DND hooks and just render it normally with a highlight
  if (isOverlay) {
    return (
      <div className="flex max-h-full w-80 flex-shrink-0 rotate-2 flex-col rounded-xl border bg-secondary/30 opacity-90 shadow-xl ring-2 ring-primary">
        {/* Render simplified overlay view */}
        <div className="flex items-center gap-2 p-3 font-semibold">
          {list.color && (
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: list.color }} />
          )}
          <h3>{list.title}</h3>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex max-h-full w-80 flex-shrink-0 flex-col rounded-xl border bg-secondary/30 shadow-sm"
    >
      {isEditing ? (
        <form
          onSubmit={handleSaveEdit}
          className="rounded-t-xl border-b bg-background p-3 shadow-sm"
        >
          {/* Your exact editing form from previous code */}
          <Input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="mb-2 h-8 text-sm text-foreground"
          />
          <Select value={editType} onValueChange={setEditType}>
            <SelectTrigger className="mb-2 h-8 text-xs text-foreground">
              <SelectValue placeholder="List Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done" disabled={hasDoneList && list.type !== "done"}>
                Done
              </SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          <div className="mb-3 flex gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setEditColor(c)}
                style={{ backgroundColor: c }}
                className={`h-5 w-5 rounded-full border-2 ${editColor === c ? "scale-110 border-foreground" : "border-transparent"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="h-7 flex-1 text-xs">
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="h-7 flex-1 text-xs text-foreground"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        // DRAG HANDLE 👇
        <div
          {...attributes}
          {...listeners}
          className="flex cursor-grab items-center justify-between rounded-t-xl p-3 transition-colors hover:bg-secondary/50 active:cursor-grabbing"
          style={{
            borderBottom: `2px solid ${list.color || "transparent"}`,
          }}
        >
          <div className="flex items-center gap-2 font-semibold">
            {list.color && (
              <div
                className="h-3 w-3 rounded-full shadow-sm"
                style={{ backgroundColor: list.color }}
              />
            )}
            <h3 className="flex items-center gap-2 text-lg text-foreground">
              {list.title}
              {list.isSystem && <Lock size={12} className="text-muted-foreground" />}
            </h3>
            <span className="flex h-5 items-center justify-center rounded-full bg-secondary px-2 text-xs font-medium text-muted-foreground">
              {list.tasks?.length || 0}
            </span>
          </div>

          {canModifyBoard && (
            <DropdownMenu>
              {/* onPointerDown={(e) => e.stopPropagation()} stops the drag event when clicking the menu! */}
              <DropdownMenuTrigger asChild onPointerDown={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-foreground hover:bg-secondary/80"
                >
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit2 size={14} className="mr-2" /> Edit List
                </DropdownMenuItem>
                {canDeleteThisList && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:bg-red-50 focus:text-red-600"
                      onClick={() => onDeleteClick(list)}
                    >
                      <Trash2 size={14} className="mr-2" /> Delete List
                    </DropdownMenuItem>
                  </>
                )}
                {isOnlyDoneList && (
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    Cannot delete final &quot;Done&quot; list
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* TASKS AREA */}
      <div className="flex flex-col gap-2 overflow-y-auto overflow-x-hidden px-2 pb-2 pt-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {list.tasks?.map((task: any) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={(t) => onTaskClick(t)}
              onDelete={(taskId) => onTaskDeleteClick(taskId)}
            />
          ))}
        </SortableContext>

        {isAddingTask && (
          <div className="mt-2 rounded-lg border bg-background p-2 shadow-sm">
            <Textarea
              ref={taskInputRef}
              placeholder="Enter a title for this card..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleTaskKeyDown}
              className="min-h-[60px] resize-none border-none bg-transparent p-1 text-sm text-foreground shadow-none focus-visible:ring-0"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSaveTask}
                  disabled={isTaskPending || !newTaskTitle.trim()}
                >
                  {isTaskPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : "Add Task"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-foreground"
                  onClick={() => setIsAddingTask(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {canModifyBoard && !isAddingTask && (
        <div className="p-2 pt-0">
          <Button
            variant="outline"
            className="mt-2 w-full justify-start gap-2 bg-transparent text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            onClick={() => setIsAddingTask(true)}
          >
            <Plus size={16} /> Add Task
          </Button>
        </div>
      )}
    </div>
  )
}
