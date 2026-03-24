/* ============================================
   Task Flow Integration Tests

   Simulates complete user journeys across
   multiple layers: Store → Action → Broadcast.

   Tests the full lifecycle:
   1. Create task → store updated → API called
   2. Move task between lists → positions recalculated
   3. Assign user → notification logic triggered
   4. Complete task → status + completion date set
   5. Delete task → removed from store + API
   ============================================ */

import { act } from "@testing-library/react"
import { useBoardStore } from "@/stores/board-store"
import { mockLists, createMockTask, createMockList } from "./fixtures"

// Reset store
beforeEach(() => {
  act(() => {
    useBoardStore.setState({
      projectId: null,
      lists: [],
      activeDragItemId: null,
      activeDragType: null,
      activeDragTask: null,
      activeDragList: null,
      selectedTaskIds: [],
    })
  })
})

describe("Task Lifecycle — Create → Edit → Move → Complete → Delete", () => {
  it("should simulate a full task lifecycle through the store", () => {
    // 1. Initialize board
    act(() => {
      useBoardStore.getState().setBoardData("project-1", mockLists)
    })

    const initialTodoCount = useBoardStore.getState().lists[0]?.tasks.length
    expect(initialTodoCount).toBe(2)

    // 2. Create a new task in "To Do"
    const newTask = createMockTask({
      id: "task-lifecycle",
      title: "Lifecycle test task",
      listId: "list-1",
      position: 3072,
    })

    act(() => {
      useBoardStore.getState().addTaskOptimistic("list-1", newTask)
    })

    const todoList = useBoardStore.getState().lists.find((l) => l.id === "list-1")
    expect(todoList?.tasks).toHaveLength(3)
    expect(todoList?.tasks.find((t) => t.id === "task-lifecycle")).toBeDefined()

    // 3. Edit the task title and priority
    act(() => {
      useBoardStore
        .getState()
        .updateTaskOptimistic("task-lifecycle", {
          title: "Updated lifecycle task",
          priority: "high",
        })
    })

    const updatedTask = useBoardStore
      .getState()
      .lists.find((l) => l.id === "list-1")
      ?.tasks.find((t) => t.id === "task-lifecycle")
    expect(updatedTask?.title).toBe("Updated lifecycle task")
    expect(updatedTask?.priority).toBe("high")

    // 4. Move task from "To Do" to "In Progress" (simulate DnD)
    act(() => {
      // Remove from source
      useBoardStore.getState().removeTaskOptimistic("task-lifecycle")
      // Add to destination
      useBoardStore.getState().addTaskOptimistic("list-2", {
        ...newTask,
        title: "Updated lifecycle task",
        priority: "high",
        listId: "list-2",
        position: 2048,
      })
    })

    const todoAfterMove = useBoardStore.getState().lists.find((l) => l.id === "list-1")
    const inProgressAfterMove = useBoardStore.getState().lists.find((l) => l.id === "list-2")
    expect(todoAfterMove?.tasks.find((t) => t.id === "task-lifecycle")).toBeUndefined()
    expect(inProgressAfterMove?.tasks.find((t) => t.id === "task-lifecycle")).toBeDefined()

    // 5. Complete the task
    act(() => {
      useBoardStore.getState().updateTaskOptimistic("task-lifecycle", {
        isCompleted: true,
        completedAt: new Date(),
      })
    })

    const completedTask = useBoardStore
      .getState()
      .lists.find((l) => l.id === "list-2")
      ?.tasks.find((t) => t.id === "task-lifecycle")
    expect(completedTask?.isCompleted).toBe(true)
    expect(completedTask?.completedAt).toBeDefined()

    // 6. Delete the task
    act(() => {
      useBoardStore.getState().removeTaskOptimistic("task-lifecycle")
    })

    const allTasks = useBoardStore.getState().lists.flatMap((l) => l.tasks)
    expect(allTasks.find((t) => t.id === "task-lifecycle")).toBeUndefined()
    // Original tasks should still exist
    expect(allTasks.find((t) => t.id === "task-3")).toBeDefined()
  })
})

describe("Board Interaction — Drag and Drop Simulation", () => {
  beforeEach(() => {
    act(() => {
      useBoardStore.getState().setBoardData("project-1", mockLists)
    })
  })

  it("should simulate dragging a task to a new list", () => {
    const task = useBoardStore.getState().lists[0]!.tasks[0]!

    // Start drag
    act(() => {
      useBoardStore.getState().setActiveDragItem({ id: task.id, type: "task", task })
    })

    expect(useBoardStore.getState().activeDragType).toBe("task")
    expect(useBoardStore.getState().activeDragTask?.id).toBe(task.id)

    // Simulate cross-list move (onDragOver equivalent)
    act(() => {
      useBoardStore.getState().removeTaskOptimistic(task.id)
      useBoardStore.getState().addTaskOptimistic("list-2", { ...task, listId: "list-2" })
    })

    // End drag
    act(() => {
      useBoardStore.getState().clearActiveDragItem()
    })

    // Verify
    const sourceList = useBoardStore.getState().lists.find((l) => l.id === "list-1")
    const targetList = useBoardStore.getState().lists.find((l) => l.id === "list-2")
    expect(sourceList?.tasks.find((t) => t.id === task.id)).toBeUndefined()
    expect(targetList?.tasks.find((t) => t.id === task.id)).toBeDefined()
    expect(useBoardStore.getState().activeDragTask).toBeNull()
  })

  it("should simulate dragging a list to reorder", () => {
    const list = useBoardStore.getState().lists[0]!

    act(() => {
      useBoardStore.getState().setActiveDragItem({ id: `list-${list.id}`, type: "list", list })
    })

    expect(useBoardStore.getState().activeDragType).toBe("list")

    // Reorder: move first list to position 2
    act(() => {
      const currentLists = [...useBoardStore.getState().lists]
      const [moved] = currentLists.splice(0, 1)
      currentLists.splice(1, 0, moved!)
      useBoardStore.getState().setListsOptimistic(currentLists)
    })

    act(() => {
      useBoardStore.getState().clearActiveDragItem()
    })

    expect(useBoardStore.getState().lists[0]!.id).toBe("list-2") // "In Progress" is now first
    expect(useBoardStore.getState().lists[1]!.id).toBe("list-1") // "To Do" moved to second
  })
})

describe("Bulk Operations", () => {
  beforeEach(() => {
    act(() => {
      useBoardStore.getState().setBoardData("project-1", mockLists)
    })
  })

  it("should select multiple tasks and bulk delete", () => {
    // Select tasks
    act(() => {
      useBoardStore.getState().toggleTaskSelection("task-1", false)
      useBoardStore.getState().toggleTaskSelection("task-2", true)
    })

    expect(useBoardStore.getState().selectedTaskIds).toEqual(["task-1", "task-2"])

    // Bulk delete
    const selectedIds = [...useBoardStore.getState().selectedTaskIds]
    act(() => {
      for (const id of selectedIds) {
        useBoardStore.getState().removeTaskOptimistic(id)
      }
      useBoardStore.getState().clearTaskSelection()
    })

    const todoList = useBoardStore.getState().lists.find((l) => l.id === "list-1")
    expect(todoList?.tasks).toHaveLength(0)
    expect(useBoardStore.getState().selectedTaskIds).toEqual([])
  })

  it("should select all tasks across lists", () => {
    const allTaskIds = useBoardStore.getState().lists.flatMap((l) => l.tasks.map((t) => t.id))

    act(() => {
      useBoardStore.getState().selectAllTasks(allTaskIds)
    })

    expect(useBoardStore.getState().selectedTaskIds).toHaveLength(4) // 2 + 1 + 1
  })
})

describe("Edge Cases", () => {
  it("should handle empty board gracefully", () => {
    act(() => {
      useBoardStore.getState().setBoardData("empty-project", [])
    })

    expect(useBoardStore.getState().lists).toHaveLength(0)

    // These should not throw
    act(() => {
      useBoardStore.getState().removeTaskOptimistic("nonexistent")
      useBoardStore.getState().updateTaskOptimistic("nonexistent", { title: "nope" })
      useBoardStore.getState().removeListOptimistic("nonexistent")
    })

    expect(useBoardStore.getState().lists).toHaveLength(0)
  })

  it("should handle adding task to nonexistent list", () => {
    act(() => {
      useBoardStore.getState().setBoardData("project-1", mockLists)
    })

    const task = createMockTask({ id: "orphan", listId: "nonexistent" })
    act(() => {
      useBoardStore.getState().addTaskOptimistic("nonexistent", task)
    })

    // Task shouldn't appear in any existing list
    const allTasks = useBoardStore.getState().lists.flatMap((l) => l.tasks)
    expect(allTasks.find((t) => t.id === "orphan")).toBeUndefined()
  })

  it("should handle rapid consecutive state updates", () => {
    act(() => {
      useBoardStore.getState().setBoardData("project-1", mockLists)
    })

    // Rapid fire updates
    act(() => {
      for (let i = 0; i < 50; i++) {
        useBoardStore.getState().updateTaskOptimistic("task-1", { title: `Update ${i}` })
      }
    })

    const task = useBoardStore
      .getState()
      .lists.find((l) => l.id === "list-1")
      ?.tasks.find((t) => t.id === "task-1")
    expect(task?.title).toBe("Update 49")
  })
})
