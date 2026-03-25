/* ============================================
   Task Server Actions Integration Tests

   Tests task CRUD flows through server actions:
   - Create task with validation
   - Update task fields
   - Delete task
   - Assign / unassign
   - Error handling scenarios

   DB queries and auth are mocked.
   ============================================ */

// Mock auth
jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn().mockResolvedValue({ dbUserId: "user-1" }),
}))

// Mock permissions
jest.mock("@/lib/permissions", () => ({
  requirePermission: jest.fn().mockResolvedValue({ role: "admin" }),
}))

// Mock Pusher
jest.mock("@/lib/pusher/server", () => ({
  broadcastToProject: jest.fn().mockResolvedValue(undefined),
}))

// Mock revalidatePath
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}))

// Mock task queries
const mockCreateTask = jest.fn()
const mockUpdateTask = jest.fn()
const mockDeleteTask = jest.fn()
const mockAssignTask = jest.fn()
const mockUnassignTask = jest.fn()
const mockGetTaskById = jest.fn()
const mockGetTasksByListId = jest.fn()
const mockMoveTask = jest.fn()
const mockReorderTasks = jest.fn()
const mockGetTaskActivityLogs = jest.fn()
const mockAddTaskAttachments = jest.fn()
const mockDeleteTaskAttachment = jest.fn()

jest.mock("@/lib/db/queries/tasks", () => ({
  createTask: (...args: any[]) => mockCreateTask(...args),
  updateTask: (...args: any[]) => mockUpdateTask(...args),
  deleteTask: (...args: any[]) => mockDeleteTask(...args),
  assignTask: (...args: any[]) => mockAssignTask(...args),
  unassignTask: (...args: any[]) => mockUnassignTask(...args),
  getTaskById: (...args: any[]) => mockGetTaskById(...args),
  getTasksByListId: (...args: any[]) => mockGetTasksByListId(...args),
  moveTask: (...args: any[]) => mockMoveTask(...args),
  reorderTasks: (...args: any[]) => mockReorderTasks(...args),
  getTaskActivityLogs: (...args: any[]) => mockGetTaskActivityLogs(...args),
  addTaskAttachments: (...args: any[]) => mockAddTaskAttachments(...args),
  deleteTaskAttachment: (...args: any[]) => mockDeleteTaskAttachment(...args),
}))

// Mock uploadthing
jest.mock("uploadthing/server", () => ({
  UTApi: jest.fn().mockImplementation(() => ({
    deleteFiles: jest.fn().mockResolvedValue(undefined),
  })),
}))

import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"
import { requirePermission } from "@/lib/permissions"
import { broadcastToProject } from "@/lib/pusher/server"
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  assignTaskAction,
  unassignTaskAction,
  moveTaskAction,
} from "@/lib/actions/tasks"

beforeEach(() => {
  jest.clearAllMocks()
})

describe("createTaskAction", () => {
  it("should create a task with valid form data", async () => {
    const mockTask = {
      id: "task-new",
      title: "New task",
      listId: "list-1",
      projectId: "project-1",
      position: 2048,
    }
    mockCreateTask.mockResolvedValue(mockTask)

    const formData = new FormData()
    formData.append("title", "New task")
    formData.append("listId", "list-1")
    formData.append("projectId", "project-1")

    const result = await createTaskAction(formData)

    expect(result.success).toBe(true)
    expect(mockCreateTask).toHaveBeenCalledTimes(1)
    expect(broadcastToProject).toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith("/projects/project-1")
  })

  it("should create a task with priority and description", async () => {
    mockCreateTask.mockResolvedValue({ id: "task-new", title: "Task with details" })

    const formData = new FormData()
    formData.append("title", "Task with details")
    formData.append("listId", "list-1")
    formData.append("projectId", "project-1")
    formData.append("priority", "high")
    formData.append("description", "Some description")

    const result = await createTaskAction(formData)

    expect(result.success).toBe(true)
    expect(mockCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Task with details", priority: "high" }),
      "list-1",
      "project-1",
      "user-1",
      expect.any(Array),
      expect.any(Array)
    )
  })

  it("should handle assignee IDs during creation", async () => {
    mockCreateTask.mockResolvedValue({ id: "task-new", title: "Assigned task" })
    mockAssignTask.mockResolvedValue({ taskId: "task-new", userId: "user-2" })

    const formData = new FormData()
    formData.append("title", "Assigned task")
    formData.append("listId", "list-1")
    formData.append("projectId", "project-1")
    formData.append("assigneeIds", JSON.stringify(["user-2"]))

    const result = await createTaskAction(formData)

    expect(result.success).toBe(true)
    expect(mockAssignTask).toHaveBeenCalledWith("task-new", "user-2", "user-1")
  })

  it("should return error for invalid form data", async () => {
    const result = await createTaskAction("not-form-data" as any)

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(mockCreateTask).not.toHaveBeenCalled()
  })

  it("should return error when permission is denied", async () => {
    ;(requirePermission as jest.Mock).mockResolvedValueOnce({ error: "Viewer cannot create tasks" })

    const formData = new FormData()
    formData.append("title", "Task")
    formData.append("listId", "list-1")
    formData.append("projectId", "project-1")

    const result = await createTaskAction(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain("Viewer")
    expect(mockCreateTask).not.toHaveBeenCalled()
  })
})

describe("updateTaskAction", () => {
  it("should update task fields", async () => {
    mockUpdateTask.mockResolvedValue({ id: "task-1", title: "Updated" })

    const result = await updateTaskAction("task-1", "project-1", {
      title: "Updated",
      priority: "high",
    })

    expect(result.success).toBe(true)
    expect(mockUpdateTask).toHaveBeenCalledTimes(1)
    expect(broadcastToProject).toHaveBeenCalled()
  })

  it("should return error when auth fails", async () => {
    ;(requireAuth as jest.Mock).mockRejectedValueOnce(new Error("Unauthorized"))

    const result = await updateTaskAction("task-1", "project-1", { title: "Fail" })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe("deleteTaskAction", () => {
  it("should delete a task and broadcast", async () => {
    mockGetTaskById.mockResolvedValue({ id: "task-1", listId: "list-1" })
    mockDeleteTask.mockResolvedValue(undefined)

    const result = await deleteTaskAction("task-1", "project-1")

    expect(result.success).toBe(true)
    expect(mockDeleteTask).toHaveBeenCalledWith("task-1", "user-1")
    expect(broadcastToProject).toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith("/projects/project-1")
  })

  it("should return error when permission is denied", async () => {
    ;(requirePermission as jest.Mock).mockResolvedValueOnce({ error: "Cannot delete" })

    const result = await deleteTaskAction("task-1", "project-1")

    expect(result.success).toBe(false)
    expect(mockDeleteTask).not.toHaveBeenCalled()
  })
})

describe("assignTaskAction", () => {
  it("should assign a user to a task", async () => {
    mockAssignTask.mockResolvedValue({ taskId: "task-1", userId: "user-2" })

    const result = await assignTaskAction(
      { taskId: "task-1", assigneeUserId: "user-2" },
      "project-1"
    )

    expect(result.success).toBe(true)
    expect(mockAssignTask).toHaveBeenCalledWith("task-1", "user-2", "user-1")
    expect(broadcastToProject).toHaveBeenCalled()
  })

  it("should return error for invalid input", async () => {
    const result = await assignTaskAction({ taskId: "", assigneeUserId: "user-2" }, "project-1")

    expect(result.success).toBe(false)
    expect(mockAssignTask).not.toHaveBeenCalled()
  })
})

describe("unassignTaskAction", () => {
  it("should unassign a user from a task", async () => {
    mockUnassignTask.mockResolvedValue(undefined)

    const result = await unassignTaskAction(
      { taskId: "task-1", assigneeUserId: "user-2" },
      "project-1"
    )

    expect(result.success).toBe(true)
    expect(mockUnassignTask).toHaveBeenCalledWith("task-1", "user-2", "user-1")
  })
})

describe("moveTaskAction", () => {
  it("should move a task to a new list", async () => {
    mockGetTaskById.mockResolvedValue({ id: "task-1", listId: "list-1" })
    mockMoveTask.mockResolvedValue({ id: "task-1", listId: "list-2", position: 1024 })

    const result = await moveTaskAction(
      { taskId: "task-1", listId: "list-2", position: 1024 },
      "project-1"
    )

    expect(result.success).toBe(true)
    expect(mockMoveTask).toHaveBeenCalledWith("task-1", "list-2", 1024, "user-1")
    expect(broadcastToProject).toHaveBeenCalled()
  })
})

describe("Error Handling", () => {
  it("should handle database errors gracefully", async () => {
    mockCreateTask.mockRejectedValue(new Error("Database connection failed"))

    const formData = new FormData()
    formData.append("title", "Task")
    formData.append("listId", "list-1")
    formData.append("projectId", "project-1")

    const result = await createTaskAction(formData)

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it("should handle auth failure on all actions", async () => {
    ;(requireAuth as jest.Mock).mockRejectedValue(new Error("Not authenticated"))

    const results = await Promise.all([
      deleteTaskAction("task-1", "project-1"),
      assignTaskAction({ taskId: "task-1", assigneeUserId: "user-2" }, "project-1"),
      moveTaskAction({ taskId: "task-1", listId: "list-2", position: 1024 }, "project-1"),
    ])

    results.forEach((result) => {
      expect(result.success).toBe(false)
    })
  })
})
