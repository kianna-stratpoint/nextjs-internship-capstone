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

/* ==================== ENUM VALUE TYPES ==================== */
/* Derive union types from Drizzle enums for use in forms, validation, etc. */

export type ProjectStatus = "active" | "completed"
export type ProjectPriority = "low" | "medium" | "high"
export type ProjectVisibility = "public" | "private"
export type MemberRole = "admin" | "contributor" | "viewer"
export type TaskPriority = "low" | "medium" | "high"
export type InvitationStatus = "pending" | "accepted" | "declined" | "expired"
export type NotificationType =
  | "invitation"
  | "task_assigned"
  | "task_moved"
  | "comment_added"
  | "project_updated"
  | "mention"
export type ActivityAction =
  | "created"
  | "updated"
  | "deleted"
  | "moved"
  | "archived"
  | "unarchived"
  | "restored"
  | "completed"
  | "assigned"
  | "unassigned"
  | "commented"
  | "invited"
  | "removed"
  | "role_changed"
export type ActivityEntityType = "project" | "list" | "task" | "comment" | "member"
export type ListType = "todo" | "in_progress" | "review" | "done" | "custom"

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
  ProjectInvitation,
  Notification,
} from "@/lib/db/schema"

/** Project with its members and their user data */
export type ProjectWithMembers = Project & {
  members: (ProjectMember & { user: User })[]
}

/** Project card data for the Projects page */
export type ProjectCardData = Project & {
  members: (ProjectMember & { user: User })[]
  taskCount: number
  completedTaskCount: number
  isPinned: boolean
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
}

/** Member with user and project data (for cross-project views) */
export type MemberWithUserAndProject = ProjectMember & {
  user: User
  project: Project
}

/** Kanban board data — project with ordered lists and tasks */
export type KanbanBoardData = Project & {
  lists: ListWithTasks[]
  members: (ProjectMember & { user: User })[]
  labels: Label[]
}

/** Invitation with related project and inviter data */
export type InvitationWithDetails = ProjectInvitation & {
  project: Project
  invitedBy: User
}

/** Notification (already flat, but alias for consistency) */
export type NotificationWithUser = Notification & {
  user: User
}

/* ==================== ANALYTICS TYPES ==================== */

/** Dashboard stats — computed from queries */
export type DashboardStats = {
  activeProjects: number
  pendingTasks: number
  completedTasks: number
  teamMembers: number
  activeProjectsTrend: number // percentage change from last period
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

/* ==================== API / FORM TYPES ==================== */

/** Common server action response */
export type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string }

/** Pagination params */
export type PaginationParams = {
  page?: number
  limit?: number
}

/** Paginated response wrapper */
export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
