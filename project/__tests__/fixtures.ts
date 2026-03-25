/* ============================================
   Test Fixtures

   Shared mock data used across all test files.
   ============================================ */

import type { ListWithTasks, TaskWithAssignees } from "@/types"

export const mockUser = {
  id: "user-1",
  clerkId: "clerk_user_1",
  email: "kianna@example.com",
  firstName: "Kianna",
  lastName: "Gragg",
  imageUrl: null,
  role: "Developer",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
}

export const mockProject = {
  id: "project-1",
  title: "Auth Revamp",
  description: "Rebuild the authentication system",
  color: "#3B82F6",
  priority: "high" as const,
  status: "active" as const,
  visibility: "private" as const,
  startDate: null,
  dueDate: null,
  isArchived: false,
  createdById: "user-1",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-15"),
  members: [
    {
      id: "pm-1",
      projectId: "project-1",
      userId: "user-1",
      role: "admin",
      isPinned: false,
      joinedAt: new Date("2026-01-01"),
      user: mockUser,
    },
  ],
  labels: [],
}

export function createMockTask(overrides: Partial<TaskWithAssignees> = {}): TaskWithAssignees {
  return {
    id: `task-${Date.now()}`,
    title: "Test Task",
    description: null,
    priority: "medium",
    position: 1024,
    isCompleted: false,
    completedAt: null,
    startDate: null,
    dueDate: null,
    listId: "list-1",
    projectId: "project-1",
    createdById: "user-1",
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-01-10"),
    version: 1,
    assignees: [],
    labels: [],
    ...overrides,
  }
}

export function createMockList(overrides: Partial<ListWithTasks> = {}): ListWithTasks {
  return {
    id: `list-${Date.now()}`,
    title: "To Do",
    position: 0,
    color: "#64748B",
    type: "todo",
    isSystem: true,
    projectId: "project-1",
    createdById: "user-1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    tasks: [],
    ...overrides,
  }
}

export const mockLists: ListWithTasks[] = [
  createMockList({
    id: "list-1",
    title: "To Do",
    position: 0,
    type: "todo",
    tasks: [
      createMockTask({ id: "task-1", title: "Fix login bug", position: 1024, listId: "list-1" }),
      createMockTask({ id: "task-2", title: "Add validation", position: 2048, listId: "list-1" }),
    ],
  }),
  createMockList({
    id: "list-2",
    title: "In Progress",
    position: 1000,
    type: "in_progress",
    color: "#3B82F6",
    tasks: [createMockTask({ id: "task-3", title: "Build API", position: 1024, listId: "list-2" })],
  }),
  createMockList({
    id: "list-3",
    title: "Done",
    position: 3000,
    type: "done",
    color: "#10B981",
    tasks: [
      createMockTask({
        id: "task-4",
        title: "Setup project",
        position: 1024,
        listId: "list-3",
        isCompleted: true,
        completedAt: new Date("2026-01-05"),
      }),
    ],
  }),
]
