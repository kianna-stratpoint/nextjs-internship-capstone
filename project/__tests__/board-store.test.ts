/* ============================================
   Board Store Integration Tests

   Tests Zustand store interactions for:
   - Board data management
   - Drag and drop state
   - Optimistic CRUD operations
   - Bulk selection
   ============================================ */

import { act } from "@testing-library/react"
import { useBoardStore } from "@/stores/board-store"
import { mockLists, createMockTask, createMockList } from "./fixtures"

// Reset store between tests
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

describe("Board Store — Data Management", () => {
  it("should set board data with project ID and lists", () => {
    act(() => {
      useBoardStore.getState().setBoardData("project-1", mockLists)
    })

    const state = useBoardStore.getState()
    expect(state.projectId).toBe("project-1")
    expect(state.lists).toHaveLength(3)
    expect(state.lists[0]?.title).toBe("To Do")
    expect(state.lists[0]?.tasks).toHaveLength(2)
  })

  it("should replace existing board data on subsequent calls", () => {
    act(() => {
      useBoardStore.getState().setBoardData("project-1", mockLists)
    })

    const newLists = [createMockList({ id: "list-new", title: "New List" })]
    act(() => {
      useBoardStore.getState().setBoardData("project-2", newLists)
    })

    const state = useBoardStore.getState()
    expect(state.projectId).toBe("project-2")
    expect(state.lists).toHaveLength(1)
    expect(state.lists[0]?.title).toBe("New List")
  })
})

describe("Board Store — Optimistic List Operations", () => {
  beforeEach(() => {
    act(() => {
      useBoardStore.getState().setBoardData("project-1", mockLists)
    })
  })

  it("should add a list optimistically", () => {
    const newList = createMockList({ id: "list-new", title: "Review", position: 2000 })

    act(() => {
      useBoardStore.getState().addListOptimistic(newList)
    })

    expect(useBoardStore.getState().lists).toHaveLength(4)
    expect(useBoardStore.getState().lists[3]?.title).toBe("Review")
  })

  it("should update a list optimistically", () => {
    act(() => {
      useBoardStore.getState().updateListOptimistic("list-1", { title: "Backlog" })
    })

    const list = useBoardStore.getState().lists.find((l) => l.id === "list-1")
    expect(list?.title).toBe("Backlog")
  })

  it("should remove a list optimistically", () => {
    act(() => {
      useBoardStore.getState().removeListOptimistic("list-2")
    })

    expect(useBoardStore.getState().lists).toHaveLength(2)
    expect(useBoardStore.getState().lists.find((l) => l.id === "list-2")).toBeUndefined()
  })

  it("should replace all lists with setListsOptimistic", () => {
    const newLists = [createMockList({ id: "list-x", title: "Only List" })]

    act(() => {
      useBoardStore.getState().setListsOptimistic(newLists)
    })

    expect(useBoardStore.getState().lists).toHaveLength(1)
    expect(useBoardStore.getState().lists[0]?.id).toBe("list-x")
  })
})

describe("Board Store — Optimistic Task Operations", () => {
  beforeEach(() => {
    act(() => {
      useBoardStore.getState().setBoardData("project-1", mockLists)
    })
  })

  it("should add a task to a specific list", () => {
    const newTask = createMockTask({ id: "task-new", title: "New task", listId: "list-2" })

    act(() => {
      useBoardStore.getState().addTaskOptimistic("list-2", newTask)
    })

    const list = useBoardStore.getState().lists.find((l) => l.id === "list-2")
    expect(list?.tasks).toHaveLength(2)
    expect(list?.tasks[1]?.title).toBe("New task")
  })

  it("should update a task across all lists", () => {
    act(() => {
      useBoardStore
        .getState()
        .updateTaskOptimistic("task-1", { title: "Updated title", priority: "high" })
    })

    const list = useBoardStore.getState().lists.find((l) => l.id === "list-1")
    const task = list?.tasks.find((t) => t.id === "task-1")
    expect(task?.title).toBe("Updated title")
    expect(task?.priority).toBe("high")
  })

  it("should remove a task from its list", () => {
    act(() => {
      useBoardStore.getState().removeTaskOptimistic("task-1")
    })

    const list = useBoardStore.getState().lists.find((l) => l.id === "list-1")
    expect(list?.tasks).toHaveLength(1)
    expect(list?.tasks.find((t) => t.id === "task-1")).toBeUndefined()
  })

  it("should not affect other lists when removing a task", () => {
    act(() => {
      useBoardStore.getState().removeTaskOptimistic("task-1")
    })

    const otherList = useBoardStore.getState().lists.find((l) => l.id === "list-2")
    expect(otherList?.tasks).toHaveLength(1) // unchanged
  })
})

describe("Board Store — Drag and Drop State", () => {
  it("should set active drag item for a task", () => {
    const task = createMockTask({ id: "task-drag", title: "Dragging" })

    act(() => {
      useBoardStore.getState().setActiveDragItem({ id: "task-drag", type: "task", task })
    })

    const state = useBoardStore.getState()
    expect(state.activeDragItemId).toBe("task-drag")
    expect(state.activeDragType).toBe("task")
    expect(state.activeDragTask?.title).toBe("Dragging")
    expect(state.activeDragList).toBeNull()
  })

  it("should set active drag item for a list", () => {
    const list = createMockList({ id: "list-drag", title: "Dragging List" })

    act(() => {
      useBoardStore.getState().setActiveDragItem({ id: "list-drag", type: "list", list })
    })

    const state = useBoardStore.getState()
    expect(state.activeDragType).toBe("list")
    expect(state.activeDragList?.title).toBe("Dragging List")
    expect(state.activeDragTask).toBeNull()
  })

  it("should clear drag state", () => {
    const task = createMockTask({ id: "task-drag" })
    act(() => {
      useBoardStore.getState().setActiveDragItem({ id: "task-drag", type: "task", task })
    })

    act(() => {
      useBoardStore.getState().clearActiveDragItem()
    })

    const state = useBoardStore.getState()
    expect(state.activeDragItemId).toBeNull()
    expect(state.activeDragType).toBeNull()
    expect(state.activeDragTask).toBeNull()
    expect(state.activeDragList).toBeNull()
  })
})

describe("Board Store — Bulk Selection", () => {
  it("should select a single task", () => {
    act(() => {
      useBoardStore.getState().toggleTaskSelection("task-1", false)
    })

    expect(useBoardStore.getState().selectedTaskIds).toEqual(["task-1"])
  })

  it("should replace selection on non-multi click", () => {
    act(() => {
      useBoardStore.getState().toggleTaskSelection("task-1", false)
      useBoardStore.getState().toggleTaskSelection("task-2", false)
    })

    expect(useBoardStore.getState().selectedTaskIds).toEqual(["task-2"])
  })

  it("should add to selection on multi click", () => {
    act(() => {
      useBoardStore.getState().toggleTaskSelection("task-1", false)
      useBoardStore.getState().toggleTaskSelection("task-2", true)
    })

    expect(useBoardStore.getState().selectedTaskIds).toEqual(["task-1", "task-2"])
  })

  it("should deselect on multi click if already selected", () => {
    act(() => {
      useBoardStore.getState().toggleTaskSelection("task-1", false)
      useBoardStore.getState().toggleTaskSelection("task-2", true)
      useBoardStore.getState().toggleTaskSelection("task-1", true)
    })

    expect(useBoardStore.getState().selectedTaskIds).toEqual(["task-2"])
  })

  it("should deselect single task on non-multi click when it is the only selected", () => {
    act(() => {
      useBoardStore.getState().toggleTaskSelection("task-1", false)
      useBoardStore.getState().toggleTaskSelection("task-1", false)
    })

    expect(useBoardStore.getState().selectedTaskIds).toEqual([])
  })

  it("should clear all selections", () => {
    act(() => {
      useBoardStore.getState().selectAllTasks(["task-1", "task-2", "task-3"])
    })
    expect(useBoardStore.getState().selectedTaskIds).toHaveLength(3)

    act(() => {
      useBoardStore.getState().clearTaskSelection()
    })
    expect(useBoardStore.getState().selectedTaskIds).toEqual([])
  })

  it("should select all tasks at once", () => {
    act(() => {
      useBoardStore.getState().selectAllTasks(["task-1", "task-2", "task-3", "task-4"])
    })

    expect(useBoardStore.getState().selectedTaskIds).toEqual([
      "task-1",
      "task-2",
      "task-3",
      "task-4",
    ])
  })
})
