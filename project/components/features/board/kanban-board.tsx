"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Loader2, X, CheckSquare, FolderOutput, UserPlus, Trash2 } from "lucide-react"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type CollisionDetection,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"

import { createTaskAction, assignTaskAction, unassignTaskAction } from "@/lib/actions/tasks"
import { useBoardStore } from "@/stores/board-store"
import { useTasks } from "@/hooks/use-tasks"
import { useLists } from "@/hooks/use-lists"
import { useTaskFilter } from "@/hooks/use-task-filter"
import { calculateFractionalPosition } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

import { ListColumn } from "./list-column"
import { TaskCard } from "@/components/features/tasks/task-card"
import { TaskSheet } from "../tasks/task-sheet"
import { useProjectChannel } from "@/hooks/use-project-channel"

import type { TaskWithAssignees } from "@/types"

const PRESET_COLORS = ["#2D6EF7", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#64748B"]

interface KanbanBoardProps {
  project: any
  initialLists: any[]
  currentUserId: string
}

function customCollisionDetection(
  args: Parameters<CollisionDetection>[0]
): ReturnType<CollisionDetection> {
  const activeType = args.active.data.current?.type?.toLowerCase()

  if (activeType === "list") {
    const { pointerCoordinates, droppableContainers, droppableRects } = args

    if (pointerCoordinates) {
      for (const container of droppableContainers) {
        if (container.data.current?.type?.toLowerCase() === "list") {
          const rect = droppableRects.get(container.id)
          if (rect && pointerCoordinates.x >= rect.left && pointerCoordinates.x <= rect.right) {
            return [{ id: container.id, data: container.data.current }]
          }
        }
      }
    }
    return closestCorners(args)
  }

  // --- Normal Task Collision ---
  const pointerCollisions = pointerWithin(args)

  if (pointerCollisions.length > 0) {
    const closestCollisions = closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((container) =>
        pointerCollisions.some((collision) => collision.id === container.id)
      ),
    })

    if (closestCollisions.length > 0) {
      return closestCollisions
    }
    return pointerCollisions
  }

  return rectIntersection(args)
}

export function KanbanBoard({ project, initialLists, currentUserId }: KanbanBoardProps) {
  useProjectChannel(project.id)
  const projectId = project?.id

  // --- HOOKS & STORE ---
  const {
    createTask,
    isCreatingTask: isTaskPending,
    deleteTask,
    updateTask,
    moveTask,
    rebalanceTasks,
    saveAttachments,
    deleteAttachment,
    isDeletingAttachment,
  } = useTasks(projectId)
  const {
    lists: queryLists,
    createList,
    isCreatingList,
    updateList,
    deleteList,
    isDeletingList,
    moveList,
  } = useLists(projectId, initialLists)

  const {
    lists: storeLists,
    setBoardData,
    activeDragType,
    activeDragTask,
    activeDragList,
    setActiveDragItem,
    clearActiveDragItem,
    selectedTaskIds,
    toggleTaskSelection,
    clearTaskSelection,
    selectAllTasks,
  } = useBoardStore()

  useEffect(() => {
    if (projectId && queryLists) {
      setBoardData(projectId, queryLists)
    }
  }, [projectId, queryLists, setBoardData])

  const filteredLists = useTaskFilter(storeLists, currentUserId)
  // --- PERMISSIONS & RULES ---
  const userMembership = project?.members?.find((m: any) => m.userId === currentUserId)
  const userRole = userMembership?.role || "viewer"
  const canModifyBoard = userRole !== "viewer"

  const doneListsCount = storeLists.filter((l) => l.type === "done").length
  const hasDoneList = doneListsCount > 0

  // --- LOCAL UI STATE ---
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState("")
  const [newListColor, setNewListColor] = useState(PRESET_COLORS[0])
  const [newListType, setNewListType] = useState<string>("custom")

  const [listToDelete, setListToDelete] = useState<{
    id: string
    title: string
    taskCount: number
  } | null>(null)
  const [migrationListId, setMigrationListId] = useState<string>("")
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<any | null>(null)

  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  // --- BULK TASK OPERATIONS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault()
        const allTaskIds = storeLists.flatMap((list) => list.tasks?.map((t) => t.id) || [])
        selectAllTasks(allTaskIds)
      }

      if (e.key === "Escape" && selectedTaskIds.length > 0) {
        clearTaskSelection()
      }

      if ((e.key === "Backspace" || e.key === "Delete") && selectedTaskIds.length > 0) {
        e.preventDefault()
        setIsBulkDeleteOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedTaskIds, storeLists, selectAllTasks, clearTaskSelection])

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true)
    try {
      for (const id of selectedTaskIds) {
        await deleteTask(id)
      }
      clearTaskSelection()
      setIsBulkDeleteOpen(false)
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const handleBulkMove = async (targetListId: string) => {
    setIsBulkProcessing(true)
    try {
      const newLists = storeLists.map((list) => ({
        ...list,
        tasks: list.tasks ? [...list.tasks] : [],
      }))

      const targetList = newLists.find((l) => l.id === targetListId)
      if (!targetList) return

      let lastPosition =
        targetList.tasks.length > 0
          ? targetList.tasks[targetList.tasks.length - 1]?.position
          : undefined

      const movePromises = []

      for (const taskId of selectedTaskIds) {
        const sourceList = newLists.find((l) => l.tasks.some((t) => t.id === taskId))

        if (!sourceList || sourceList.id === targetListId) continue

        const taskToMove = sourceList.tasks.find((t) => t.id === taskId)
        if (!taskToMove) continue

        const { position: newPosition } = calculateFractionalPosition(lastPosition, undefined)
        lastPosition = newPosition

        sourceList.tasks = sourceList.tasks.filter((t) => t.id !== taskId)
        targetList.tasks = [
          ...targetList.tasks,
          { ...taskToMove, listId: targetListId, position: newPosition },
        ].sort((a, b) => a.position - b.position)

        movePromises.push(moveTask({ taskId, listId: targetListId, position: newPosition }))
      }

      setBoardData(projectId, newLists)

      await Promise.all(movePromises)

      clearTaskSelection()
    } catch (error) {
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const handleBulkAssign = async (userId: string) => {
    setIsBulkProcessing(true)
    try {
      for (const taskId of selectedTaskIds) {
        await assignTaskAction({ taskId, assigneeUserId: userId }, projectId)
      }
      clearTaskSelection()
    } finally {
      setIsBulkProcessing(false)
    }
  }

  // --- DND-KIT SETUP ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  )

  const measuring = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  }
  const listIds = useMemo(() => storeLists.map((l) => `list-${l.id}`), [storeLists])

  // --- DND HANDLERS ---
  const onDragStart = (event: DragStartEvent) => {
    const { active } = event
    const type = active.data.current?.type?.toLowerCase()

    if (type === "list") {
      const list = active.data.current?.list
      if (list) setActiveDragItem({ id: active.id as string, type: "list", list })
    }
    if (type === "task") {
      const task = active.data.current?.task
      if (task) setActiveDragItem({ id: active.id as string, type: "task", task })
    }
  }

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeType = active.data.current?.type?.toLowerCase()
    if (activeType !== "task") return

    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return

    const overType = over.data.current?.type?.toLowerCase()

    let activeListId = ""
    for (const list of storeLists) {
      if (list.tasks?.some((t) => t.id === activeId)) {
        activeListId = list.id
        break
      }
    }

    let overListId = ""
    if (overType === "task") {
      for (const list of storeLists) {
        if (list.tasks?.some((t) => t.id === overId)) {
          overListId = list.id
          break
        }
      }
    } else if (overType === "list") {
      overListId = overId.replace("list-", "")
    }

    if (!activeListId || !overListId || activeListId === overListId) return

    const activeListIndex = storeLists.findIndex((l) => l.id === activeListId)
    const overListIndex = storeLists.findIndex((l) => l.id === overListId)
    if (activeListIndex === -1 || overListIndex === -1) return

    const newLists = storeLists.map((l) => ({ ...l, tasks: [...(l.tasks || [])] }))
    const sourceList = newLists[activeListIndex]!
    const destList = newLists[overListIndex]!

    const taskIndex = sourceList.tasks.findIndex((t) => t.id === activeId)
    if (taskIndex === -1) return
    const [movedTask] = sourceList.tasks.splice(taskIndex, 1)

    if (overType === "task") {
      const overIndex = destList.tasks.findIndex((t) => t.id === overId)
      const insertIndex = overIndex >= 0 ? overIndex : destList.tasks.length
      destList.tasks.splice(insertIndex, 0, {
        ...movedTask,
        listId: overListId,
      } as TaskWithAssignees)
    } else {
      destList.tasks.push({ ...movedTask, listId: overListId } as TaskWithAssignees)
    }

    setBoardData(projectId, newLists)
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      clearActiveDragItem()
      return
    }

    const activeId = active.id as string
    const overId = over.id as string
    const activeType = active.data.current?.type?.toLowerCase()

    // =====================================================
    // LIST REORDER
    // =====================================================
    if (activeType === "list") {
      const activeListId = activeId.replace("list-", "")

      const overType = over.data.current?.type?.toLowerCase()
      let targetListId = ""
      if (overType === "list") {
        targetListId = overId.replace("list-", "")
      } else if (overType === "task") {
        targetListId = over.data.current?.task?.listId
      }

      if (!targetListId || activeListId === targetListId) {
        clearActiveDragItem()
        return
      }

      const oldIndex = storeLists.findIndex((l) => l.id === activeListId)
      const newIndex = storeLists.findIndex((l) => l.id === targetListId)

      if (oldIndex === -1 || newIndex === -1) {
        clearActiveDragItem()
        return
      }

      const reordered = arrayMove(storeLists, oldIndex, newIndex)

      // Calculate fractional position
      const prevList = reordered[newIndex - 1]
      const nextList = reordered[newIndex + 1]

      const { position: newPosition } = calculateFractionalPosition(
        prevList?.position,
        nextList?.position
      )

      // Optimistic update
      const updatedLists = reordered.map((list) =>
        list.id === activeListId ? { ...list, position: newPosition } : list
      )
      setBoardData(projectId, updatedLists)

      // Backend
      moveList({ listId: activeListId, position: newPosition })
      clearActiveDragItem()
      return
    }

    // =====================================================
    // TASK REORDER / MOVE
    // =====================================================
    if (activeType === "task") {
      const activeTask = active.data.current?.task
      if (!activeTask) {
        clearActiveDragItem()
        return
      }

      // Find which list the task is currently in (after onDragOver may have moved it)
      let currentListId = ""
      let currentIndex = -1
      for (const list of storeLists) {
        const idx = list.tasks?.findIndex((t) => t.id === activeId) ?? -1
        if (idx !== -1) {
          currentListId = list.id
          currentIndex = idx
          break
        }
      }

      if (!currentListId) {
        clearActiveDragItem()
        return
      }

      const overType = over.data.current?.type?.toLowerCase()

      // Determine the target list and the index to insert at
      let targetListId = currentListId
      let targetIndex = currentIndex

      if (overType === "task" && overId !== activeId) {
        // Find the list containing the over task
        for (const list of storeLists) {
          const idx = list.tasks?.findIndex((t) => t.id === overId) ?? -1
          if (idx !== -1) {
            targetListId = list.id
            targetIndex = idx
            break
          }
        }
      } else if (overType === "list") {
        targetListId = overId.replace("list-", "")
        const targetList = storeLists.find((l) => l.id === targetListId)
        targetIndex = targetList?.tasks?.length ?? 0
      }

      // Build the final task order for the target list
      const targetList = storeLists.find((l) => l.id === targetListId)
      if (!targetList) {
        clearActiveDragItem()
        return
      }

      const sortedTasks = [...(targetList.tasks || [])].sort((a, b) => a.position - b.position)
      const filteredTasks = sortedTasks.filter((t) => t.id !== activeId)

      // Clamp the index
      const insertIndex = Math.max(0, Math.min(targetIndex, filteredTasks.length))

      // Calculate position based on neighbors
      const prevTask = filteredTasks[insertIndex - 1]
      const nextTask = filteredTasks[insertIndex]

      const { position: newPosition, needsRebalance } = calculateFractionalPosition(
        prevTask?.position,
        nextTask?.position
      )

      // Optimistic UI
      const updatedTask = { ...activeTask, listId: targetListId, position: newPosition }

      const updatedLists = storeLists.map((list) => {
        if (list.id === targetListId) {
          const tasks = list.tasks?.filter((t) => t.id !== activeId) || []
          tasks.push(updatedTask)
          tasks.sort((a, b) => a.position - b.position)
          return { ...list, tasks }
        }
        if (list.id !== targetListId && list.tasks?.some((t) => t.id === activeId)) {
          return { ...list, tasks: list.tasks?.filter((t) => t.id !== activeId) || [] }
        }
        return list
      })

      setBoardData(projectId, updatedLists)

      // Backend
      moveTask({
        taskId: activeId,
        listId: targetListId,
        position: newPosition,
      }).then(() => {
        if (needsRebalance) {
          rebalanceTasks(targetListId)
        }
      })

      clearActiveDragItem()
    }
  }

  // --- ACTIONS ---
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListTitle.trim() || !projectId) return
    const title = newListTitle.trim()
    const color = newListColor || (PRESET_COLORS[0] as string)
    const type = newListType

    setNewListTitle("")
    setNewListColor(PRESET_COLORS[0])
    setNewListType("custom")
    setIsAddingList(false)

    await createList({ title, projectId, color, type })
  }

  const handleEditList = async (id: string, data: any) => {
    await updateList({ id, projectId, data })
  }

  const handleDeleteListClick = (list: any) => {
    setListToDelete({
      id: list.id,
      title: list.title,
      taskCount: list.tasks?.length || 0,
    })
  }

  const confirmDeleteList = async () => {
    if (!listToDelete) return
    const { id } = listToDelete
    const finalMigrationId = listToDelete.taskCount > 0 ? migrationListId : undefined

    setListToDelete(null)
    setMigrationListId("")

    await deleteList({ id, projectId, migrationListId: finalMigrationId })
  }

  const handleUpdateTask = async (params: { taskId: string; data: any }) => {
    const { taskId, data } = params
    const sourceListId = selectedTask?.listId
    const targetListId = data.listId

    const isMovingList = targetListId && sourceListId && targetListId !== sourceListId

    if (isMovingList) {
      const targetList = storeLists.find((l) => l.id === targetListId)
      const sortedTargetTasks = [...(targetList?.tasks || [])].sort(
        (a, b) => a.position - b.position
      )
      const prevPosition = sortedTargetTasks[sortedTargetTasks.length - 1]?.position

      const { position: newPosition, needsRebalance } = calculateFractionalPosition(
        prevPosition,
        undefined
      )

      const newLists = storeLists.map((list) => {
        if (list.id === sourceListId) {
          return {
            ...list,
            tasks: list.tasks?.filter((t: any) => t.id !== taskId) || [],
          }
        }
        if (list.id === targetListId) {
          return {
            ...list,
            tasks: [
              ...(list.tasks || []),
              { ...selectedTask, ...data, listId: targetListId, position: newPosition },
            ].sort((a, b) => a.position - b.position),
          }
        }
        return list
      })

      setBoardData(projectId, newLists)

      await moveTask({
        taskId,
        listId: targetListId,
        position: newPosition,
      })

      if (needsRebalance) {
        rebalanceTasks(targetListId)
      }
    } else {
      const newLists = storeLists.map((list) => ({
        ...list,
        tasks: list.tasks?.map((t: any) => (t.id === taskId ? { ...t, ...data } : t)) || [],
      }))
      setBoardData(projectId, newLists)
    }

    return await updateTask(params)
  }

  const handleCreateTask = (
    listId: string,
    title: string,
    priority: string | null,
    assigneeIds?: string[],
    dueDate?: Date
  ) => {
    const formData = new FormData()
    formData.append("title", title)
    formData.append("listId", listId)
    formData.append("projectId", projectId)
    if (priority) formData.append("priority", priority)
    if (dueDate) formData.append("dueDate", dueDate.toISOString())
    if (assigneeIds && assigneeIds.length > 0) {
      formData.append("assigneeIds", JSON.stringify(assigneeIds))
    }
    createTaskAction(formData)
  }

  if (!project) return null

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        measuring={measuring}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex h-full items-start gap-6 overflow-x-auto pb-4 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* DRAGGABLE LISTS CONTEXT */}
          <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
            {filteredLists.map((list) => (
              <ListColumn
                key={list.id}
                list={list}
                canModifyBoard={canModifyBoard}
                hasDoneList={hasDoneList}
                doneListsCount={doneListsCount}
                currentUserId={currentUserId}
                onEditList={handleEditList}
                onDeleteClick={handleDeleteListClick}
                onCreateTask={handleCreateTask}
                isTaskPending={isTaskPending}
                onTaskClick={setSelectedTask}
                onTaskDeleteClick={setTaskToDelete}
                projectId={project.id}
                onAssignToggle={(taskId: string, userId: string, isAssigning: boolean) => {
                  if (isAssigning) {
                    assignTaskAction({ taskId, assigneeUserId: userId }, projectId)
                  } else {
                    unassignTaskAction({ taskId, assigneeUserId: userId }, projectId)
                  }
                }}
                onDueDateChange={(taskId, date) => {
                  updateTask({ taskId, data: { dueDate: date?.toISOString() || null } })
                }}
                selectedTaskIds={selectedTaskIds}
                onSelectTask={toggleTaskSelection}
              />
            ))}
          </SortableContext>

          {/* ADD LIST FORM */}
          {canModifyBoard && (
            <div className="w-80 flex-shrink-0">
              {isAddingList ? (
                <form
                  onSubmit={handleCreateList}
                  className="rounded-xl border bg-background p-3 shadow-sm"
                >
                  <Input
                    autoFocus
                    placeholder="Enter list title..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    className="mb-3 h-9 text-sm text-foreground"
                  />
                  <Select value={newListType} onValueChange={setNewListType}>
                    <SelectTrigger className="mb-3 h-9 text-xs text-foreground">
                      <SelectValue placeholder="List Workflow Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="done" disabled={hasDoneList}>
                        Done
                      </SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="mb-3 flex gap-1.5">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewListColor(color)}
                        className={`h-5 w-5 flex-shrink-0 rounded-full border-2 transition-all ${newListColor === color ? "scale-110 border-foreground shadow-sm" : "border-transparent hover:scale-105"}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isCreatingList || !newListTitle.trim()}
                    >
                      {isCreatingList ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        "Add list"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-foreground"
                      onClick={() => {
                        setIsAddingList(false)
                        setNewListTitle("")
                        setNewListColor(PRESET_COLORS[0])
                        setNewListType("custom")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="outline"
                  className="h-12 w-full justify-start gap-2 rounded-xl border-dashed bg-secondary/30 text-foreground hover:bg-secondary/50"
                  onClick={() => setIsAddingList(true)}
                >
                  <Plus size={16} /> Add another list
                </Button>
              )}
            </div>
          )}
        </div>

        {/* GHOST OVERLAYS */}
        <DragOverlay>
          {activeDragType === "list" && activeDragList && (
            <div className="flex max-h-[80vh] w-[300px] flex-col rounded-xl bg-muted/50 text-foreground opacity-80">
              <ListColumn
                list={activeDragList}
                isOverlay
                canModifyBoard={canModifyBoard}
                hasDoneList={hasDoneList}
                doneListsCount={doneListsCount}
                currentUserId={currentUserId}
                onEditList={handleEditList}
                onDeleteClick={handleDeleteListClick}
                onCreateTask={handleCreateTask}
                isTaskPending={isTaskPending}
                onTaskClick={setSelectedTask}
                onTaskDeleteClick={setTaskToDelete}
                projectId={project.id}
                onAssignToggle={(taskId: string, userId: string, isAssigning: boolean) => {
                  if (isAssigning) {
                    assignTaskAction({ taskId, assigneeUserId: userId }, projectId)
                  } else {
                    unassignTaskAction({ taskId, assigneeUserId: userId }, projectId)
                  }
                }}
              />
            </div>
          )}
          {activeDragType === "task" && activeDragTask && (
            <div className="w-[280px] cursor-grabbing text-foreground opacity-80">
              <TaskCard task={activeDragTask} projectId={activeDragTask.projectId} isOverlay />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* FLOATING BULK ACTIONS TOOLBAR */}
      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-foreground px-6 py-3 text-background shadow-2xl animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 border-r border-background/20 pr-4 text-sm font-medium">
            {isBulkProcessing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckSquare size={18} />
            )}
            {selectedTaskIds.length} selected
          </div>

          <div className="flex items-center gap-1">
            {/* BULK MOVE */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isBulkProcessing}
                  className="text-background hover:bg-background/20 hover:text-background"
                >
                  <FolderOutput size={16} className="mr-2" />
                  Move
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuLabel>Move to list...</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {storeLists.map((list) => (
                  <DropdownMenuItem
                    key={list.id}
                    onClick={() => handleBulkMove(list.id)}
                    className="cursor-pointer"
                  >
                    <div
                      className="mr-2 h-2 w-2 rounded-full"
                      style={{ backgroundColor: list.color || "#CCC" }}
                    />
                    {list.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* BULK ASSIGN */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isBulkProcessing}
                  className="text-background hover:bg-background/20 hover:text-background"
                >
                  <UserPlus size={16} className="mr-2" />
                  Assign
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuLabel>Assign to...</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {project?.members?.map((member: any) => (
                  <DropdownMenuItem
                    key={member.userId}
                    onClick={() => handleBulkAssign(member.userId)}
                    className="cursor-pointer"
                  >
                    {/* Display user name or email */}
                    {member.user?.firstName
                      ? `${member.user.firstName} ${member.user.lastName || ""}`
                      : member.user?.email || "Unknown User"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="mx-1 h-4 w-px bg-background/20" />

            {/* BULK DELETE */}
            <Button
              variant="ghost"
              size="sm"
              disabled={isBulkProcessing}
              className="text-red-400 hover:bg-red-900/30 hover:text-red-300"
              onClick={() => setIsBulkDeleteOpen(true)}
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
          </div>

          {/* CLOSE/CLEAR BUTTON */}
          <button
            onClick={clearTaskSelection}
            disabled={isBulkProcessing}
            className="ml-2 rounded-full p-1 text-background/70 hover:bg-background/20 hover:text-background disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* NEW: BULK DELETE ALERT */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete {selectedTaskIds.length} Tasks?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete these tasks? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete {selectedTaskIds.length} Tasks
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SMART DELETION / TASK MIGRATION MODAL */}
      <AlertDialog
        open={!!listToDelete}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setListToDelete(null)
            setMigrationListId("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete List</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                {listToDelete?.taskCount && listToDelete.taskCount > 0 ? (
                  <div className="mt-2 space-y-4">
                    <p>
                      This list contains <strong>{listToDelete.taskCount} tasks</strong>. Deleting
                      it will also delete those tasks unless you migrate them. Where should we move
                      them?
                    </p>
                    <Select value={migrationListId} onValueChange={setMigrationListId}>
                      <SelectTrigger className="text-foreground">
                        <SelectValue placeholder="Select destination list..." />
                      </SelectTrigger>
                      <SelectContent>
                        {storeLists
                          .filter((l) => l.id !== listToDelete.id)
                          .map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="mt-2">
                    Are you sure you want to delete the <strong>{listToDelete?.title}</strong> list?
                    This cannot be undone.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground" disabled={isDeletingList}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDeleteList()
              }}
              disabled={
                isDeletingList ||
                (listToDelete?.taskCount ? listToDelete.taskCount > 0 && !migrationListId : false)
              }
              className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/50"
            >
              {isDeletingList ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete List"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Task</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this task? This action cannot be undone and will
              remove all associated comments and assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (taskToDelete) {
                  deleteTask(taskToDelete)
                  setTaskToDelete(null)
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TaskSheet
        key={selectedTask?.id || "empty-sheet"}
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        updateTask={handleUpdateTask}
        lists={storeLists}
        saveAttachments={saveAttachments}
        deleteAttachment={deleteAttachment}
        isDeletingAttachment={isDeletingAttachment}
        projectId={projectId}
      />
    </>
  )
}
