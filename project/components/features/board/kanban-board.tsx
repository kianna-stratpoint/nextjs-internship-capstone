"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Loader2 } from "lucide-react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"

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

import { ListColumn } from "./list-column"
import { TaskCard } from "@/components/features/tasks/task-card"
import { TaskSheet } from "../tasks/task-sheet"
import { useProjectChannel } from "@/hooks/use-project-channel"

const PRESET_COLORS = ["#2D6EF7", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#64748B"]

interface KanbanBoardProps {
  project: any
  initialLists: any[]
  currentUserId: string
}

export function KanbanBoard({ project, initialLists, currentUserId }: KanbanBoardProps) {
  useProjectChannel(project.id)
  console.log("[Debug] useProjectChannel subscribed to:", project.id)
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

  // --- DND-KIT SETUP ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const listIds = useMemo(() => storeLists.map((l) => `list-${l.id}`), [storeLists])

  // --- DND HANDLERS ---
  const onDragStart = (event: DragStartEvent) => {
    const { active } = event
    const type = active.data.current?.type?.toLowerCase()

    if (type === "list") {
      const list = active.data.current?.list
      if (list) {
        setActiveDragItem({ id: active.id as string, type, list })
      }
    }
    if (type === "task") {
      const task = active.data.current?.task
      if (task) {
        setActiveDragItem({ id: active.id as string, type, task })
      }
    }
  }

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return

    const isActiveTask = active.data.current?.type?.toLowerCase() === "task"
    const isOverTask = over.data.current?.type?.toLowerCase() === "task"
    const isOverList = over.data.current?.type?.toLowerCase() === "list"

    if (!isActiveTask) return

    // 1. Moving a Task over another Task
    if (isActiveTask && isOverTask) {
      const activeListId = active.data.current?.task.listId
      const overListId = over.data.current?.task.listId

      if (activeListId !== overListId) {
        const activeListIndex = storeLists.findIndex((l) => l.id === activeListId)
        const overListIndex = storeLists.findIndex((l) => l.id === overListId)

        if (activeListIndex !== -1 && overListIndex !== -1) {
          const newLists = [...storeLists]
          const activeList = { ...newLists[activeListIndex] } as any
          const overList = { ...newLists[overListIndex] } as any

          const activeTasks = activeList.tasks || []
          const activeTask = activeTasks.find((t: any) => t.id === activeId)

          if (activeTask) {
            activeList.tasks = activeTasks.filter((t: any) => t.id !== activeId)
            overList.tasks = [...(overList.tasks || []), { ...activeTask, listId: overListId }]

            newLists[activeListIndex] = activeList
            newLists[overListIndex] = overList

            setBoardData(projectId, newLists)
          }
        }
      }
    }

    // 2. Moving a Task into an empty List
    if (isActiveTask && isOverList) {
      const activeListId = active.data.current?.task.listId
      const overListId = overId.replace("list-", "")

      if (activeListId !== overListId) {
        const activeListIndex = storeLists.findIndex((l) => l.id === activeListId)
        const overListIndex = storeLists.findIndex((l) => l.id === overListId)

        if (activeListIndex !== -1 && overListIndex !== -1) {
          const newLists = [...storeLists]
          const activeList = { ...newLists[activeListIndex] } as any
          const overList = { ...newLists[overListIndex] } as any

          const activeTasks = activeList.tasks || []
          const activeTask = activeTasks.find((t: any) => t.id === activeId)

          if (activeTask) {
            activeList.tasks = activeTasks.filter((t: any) => t.id !== activeId)
            overList.tasks = [...(overList.tasks || []), { ...activeTask, listId: overListId }]

            newLists[activeListIndex] = activeList
            newLists[overListIndex] = overList

            setBoardData(projectId, newLists)
          }
        }
      }
    }
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      clearActiveDragItem()
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    const isActiveList = active.data.current?.type?.toLowerCase() === "list"
    const isActiveTask = active.data.current?.type?.toLowerCase() === "task"

    // =====================================================
    // LIST REORDER (UNCHANGED, CLEANED)
    // =====================================================
    if (isActiveList) {
      const activeListId = activeId.replace("list-", "")

      const oldIndex = storeLists.findIndex((l) => l.id === activeListId)
      const newIndex = storeLists.findIndex((l) => `list-${l.id}` === overId)

      if (oldIndex === -1 || newIndex === -1) {
        clearActiveDragItem()
        return
      }

      const reordered = [...storeLists]
      const [moved] = reordered.splice(oldIndex, 1)
      if (!moved) {
        clearActiveDragItem()
        return
      }
      reordered.splice(newIndex, 0, moved)

      const prev = reordered[newIndex - 1]?.position
      const next = reordered[newIndex + 1]?.position

      const newPosition =
        prev !== undefined && next !== undefined
          ? (prev + next) / 2
          : prev !== undefined
            ? prev + 65536
            : next !== undefined
              ? next / 2
              : 65536

      moveList({
        listId: activeListId,
        position: Math.round(newPosition),
      })

      clearActiveDragItem()
      return
    }

    // =====================================================
    // TASK MOVE (FULLY REWRITTEN)
    // =====================================================
    if (isActiveTask) {
      const activeTask = active.data.current?.task
      if (!activeTask) {
        clearActiveDragItem()
        return
      }

      const sourceListId = activeTask.listId

      const isOverTask = over.data.current?.type?.toLowerCase() === "task"
      const isOverList = over.data.current?.type?.toLowerCase() === "list"

      let targetListId = ""

      if (isOverTask) {
        targetListId = over.data.current?.task?.listId
      } else if (isOverList) {
        targetListId = overId.replace("list-", "")
      }

      if (!targetListId) {
        clearActiveDragItem()
        return
      }

      const sourceList = storeLists.find((l) => l.id === sourceListId)
      const targetList = storeLists.find((l) => l.id === targetListId)

      if (!sourceList || !targetList) {
        clearActiveDragItem()
        return
      }

      // =====================================================
      // ALWAYS WORK WITH SORTED TASKS (CRITICAL)
      // =====================================================
      const sortedTargetTasks = [...(targetList.tasks || [])].sort(
        (a, b) => a.position - b.position
      )

      // Remove if already exists (important for same-list moves)
      const filteredTasks = sortedTargetTasks.filter((t) => t.id !== activeId)

      let prevPosition: number | undefined
      let nextPosition: number | undefined

      // =====================================================
      // CASE 1: DROPPED ON A TASK
      // =====================================================
      if (isOverTask) {
        const overTask = over.data.current?.task
        const overIndex = filteredTasks.findIndex((t) => t.id === overTask.id)

        prevPosition = filteredTasks[overIndex - 1]?.position
        nextPosition = filteredTasks[overIndex]?.position
      }

      // =====================================================
      // CASE 2: DROPPED ON LIST (BOTTOM INSERT - JIRA STYLE)
      // =====================================================
      if (isOverList) {
        prevPosition = filteredTasks[filteredTasks.length - 1]?.position
        nextPosition = undefined
      }

      // =====================================================
      // POSITION CALCULATION (SAFE)
      // =====================================================
      const { position: newPosition, needsRebalance } = calculateFractionalPosition(
        prevPosition,
        nextPosition
      )
      // =====================================================
      // OPTIMISTIC UI UPDATE (CLEAN & SAFE)
      // =====================================================
      const updatedTargetTasks = [
        ...filteredTasks,
        {
          ...activeTask,
          listId: targetListId,
          position: newPosition,
        },
      ].sort((a, b) => a.position - b.position)

      const updatedLists = storeLists.map((list) => {
        if (list.id === targetListId) {
          return { ...list, tasks: updatedTargetTasks }
        }

        if (list.id === sourceListId && sourceListId !== targetListId) {
          return {
            ...list,
            tasks: list.tasks?.filter((t) => t.id !== activeId) || [],
          }
        }

        return list
      })

      setBoardData(projectId, updatedLists)

      // =====================================================
      // BACKEND UPDATE
      // =====================================================
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

  const handleCreateTask = (listId: string, title: string, priority: string | null) => {
    createTask({ title, listId, projectId, priority })
  }

  if (!project) return null

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
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
              />
            </div>
          )}
          {activeDragType === "task" && activeDragTask && (
            <div className="w-[280px] cursor-grabbing text-foreground opacity-80">
              <TaskCard task={activeDragTask} isOverlay />
            </div>
          )}
        </DragOverlay>
      </DndContext>

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
      />
    </>
  )
}
