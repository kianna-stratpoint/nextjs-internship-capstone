import { create } from "zustand"
import type { ListWithTasks, TaskWithAssignees } from "@/types"

type DragType = "list" | "task" | null

interface BoardState {
  // Data
  projectId: string | null
  lists: ListWithTasks[]

  // Drag & Drop UI State
  activeDragItemId: string | null
  activeDragType: DragType
  activeDragTask: TaskWithAssignees | null
  activeDragList: ListWithTasks | null

  // Bulk Selection State
  selectedTaskIds: string[]
  toggleTaskSelection: (taskId: string, multi: boolean) => void
  clearTaskSelection: () => void
  selectAllTasks: (taskIds: string[]) => void

  // Actions
  setBoardData: (projectId: string, lists: ListWithTasks[]) => void
  setActiveDragItem: (params: {
    id: string
    type: DragType
    task?: TaskWithAssignees
    list?: ListWithTasks
  }) => void
  clearActiveDragItem: () => void

  addListOptimistic: (list: ListWithTasks) => void
  updateListOptimistic: (listId: string, updates: Partial<ListWithTasks>) => void
  removeListOptimistic: (listId: string) => void
  setListsOptimistic: (lists: ListWithTasks[]) => void
  addTaskOptimistic: (listId: string, task: TaskWithAssignees) => void
  updateTaskOptimistic: (taskId: string, updates: Partial<TaskWithAssignees>) => void
  removeTaskOptimistic: (taskId: string) => void
}

export const useBoardStore = create<BoardState>((set) => ({
  projectId: null,
  lists: [],

  activeDragItemId: null,
  activeDragType: null,
  activeDragTask: null,
  activeDragList: null,

  selectedTaskIds: [],
  toggleTaskSelection: (taskId, multi) =>
    set((state) => {
      if (!multi) {
        return {
          selectedTaskIds:
            state.selectedTaskIds.includes(taskId) && state.selectedTaskIds.length === 1
              ? []
              : [taskId],
        }
      }
      if (state.selectedTaskIds.includes(taskId)) {
        return { selectedTaskIds: state.selectedTaskIds.filter((id) => id !== taskId) }
      }
      return { selectedTaskIds: [...state.selectedTaskIds, taskId] }
    }),
  clearTaskSelection: () => set({ selectedTaskIds: [] }),
  selectAllTasks: (taskIds) => set({ selectedTaskIds: taskIds }),

  setBoardData: (projectId, lists) => set({ projectId, lists }),

  setActiveDragItem: ({ id, type, task, list }) =>
    set({
      activeDragItemId: id,
      activeDragType: type,
      activeDragTask: task || null,
      activeDragList: list || null,
    }),

  clearActiveDragItem: () =>
    set({
      activeDragItemId: null,
      activeDragType: null,
      activeDragTask: null,
      activeDragList: null,
    }),

  addListOptimistic: (list) => set((state) => ({ lists: [...state.lists, list] })),

  updateListOptimistic: (listId, updates) =>
    set((state) => ({
      lists: state.lists.map((list) => (list.id === listId ? { ...list, ...updates } : list)),
    })),

  removeListOptimistic: (listId) =>
    set((state) => ({
      lists: state.lists.filter((list) => list.id !== listId),
    })),

  setListsOptimistic: (newLists) => set({ lists: newLists }),

  addTaskOptimistic: (listId, task) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId ? { ...list, tasks: [...list.tasks, task] } : list
      ),
    })),

  updateTaskOptimistic: (taskId, updates) =>
    set((state) => ({
      lists: state.lists.map((list) => ({
        ...list,
        tasks: list.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
      })),
    })),

  removeTaskOptimistic: (taskId) =>
    set((state) => ({
      lists: state.lists.map((list) => ({
        ...list,
        tasks: list.tasks.filter((task) => task.id !== taskId),
      })),
    })),
}))
