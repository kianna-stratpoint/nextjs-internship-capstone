// TypeScript type definitions
// Task 1.3: Set up project structure and folder organization

// Re-export all Drizzle inferred types
export type {
  User,
  NewUser,
  Project,
  NewProject,
  ProjectMember,
  NewProjectMember,
  List,
  NewList,
  Task,
  NewTask,
  TaskAssignee,
  NewTaskAssignee,
  Label,
  NewLabel,
  TaskLabel,
  NewTaskLabel,
  Comment,
  NewComment,
  ActivityLog,
  NewActivityLog,
  ProjectInvitation,
  NewProjectInvitation,
  Notification,
  NewNotification,
} from "@/lib/db/schema"

/* ==================== EXTENDED TYPES ==================== */

import type {
  User,
  Project,
  ProjectMember,
  List,
  Task,
  TaskAssignee,
  Label,
  TaskLabel,
  Comment,
  ActivityLog,
} from "@/lib/db/schema"

/** Project with its members and their user data */
export type ProjectWithMembers = Project & {
  members: (ProjectMember & { user: User })[]
}

/** Project card data for the Projects page */
export type ProjectCardData = Project & {
  members: (ProjectMember & { user: User })[]
  _count: {
    tasks: number
    completedTasks: number
  }
}

/** List with its tasks (for Kanban board) */
export type ListWithTasks = List & {
  tasks: TaskWithAssignees[]
}

/** Task with assignees and labels */
export type TaskWithAssignees = Task & {
  assignees: (TaskAssignee & { user: User })[]
  labels: (TaskLabel & { label: Label })[]
}

/** Task with full details (for task modal) */
export type TaskWithDetails = Task & {
  assignees: (TaskAssignee & { user: User })[]
  labels: (TaskLabel & { label: Label })[]
  comments: (Comment & { user: User })[]
  list: List
  createdBy: User
}

/** Activity log with user data */
export type ActivityLogWithUser = ActivityLog & {
  user: User
}

/** Member with user data (for Team page) */
export type MemberWithUser = ProjectMember & {
  user: User
  project: Project
}

/** Kanban board data — project with ordered lists and tasks */
export type KanbanBoardData = Project & {
  lists: ListWithTasks[]
  members: (ProjectMember & { user: User })[]
  labels: Label[]
}

/* ==================== ANALYTICS TYPES ==================== */

/** Dashboard stats — computed from queries */
export type DashboardStats = {
  activeProjects: number
  pendingTasks: number
  completedTasks: number
  teamMembers: number
  activeProjectsTrend: number // change from last period
  pendingTasksTrend: number
  completedTasksTrend: number
  teamMembersTrend: number
}

/** Project velocity — tasks completed per time period */
export type ProjectVelocity = {
  period: string // e.g., "Week 1", "Jan 2026"
  completed: number
  created: number
}

/** Average task completion time in hours */
export type TaskCompletionMetric = {
  projectId: string
  projectTitle: string
  avgCompletionHours: number
  taskCount: number
}

// Note for interns: These types should match your database schema
// Update as needed when implementing the actual database schema
