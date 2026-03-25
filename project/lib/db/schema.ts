// DONE: Task 3.1 - Design database schema for users, projects, lists, and tasks
// DONE: Task 3.3 - Set up Drizzle ORM with type-safe schema definitions
import { relations } from "drizzle-orm"
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
  index,
  doublePrecision,
} from "drizzle-orm/pg-core"

/* ==================== ENUMS ==================== */

export const projectStatusEnum = pgEnum("project_status", ["active", "completed"])

export const projectPriorityEnum = pgEnum("project_priority", ["low", "medium", "high"])

export const memberRoleEnum = pgEnum("member_role", ["admin", "contributor", "viewer"])

export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high"])

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "declined",
  "expired",
])

export const notificationTypeEnum = pgEnum("notification_type", [
  "invitation",
  "task_assigned",
  "task_moved",
  "comment_added",
  "project_updated",
  "mention",
])

export const activityActionEnum = pgEnum("activity_action", [
  "created",
  "updated",
  "deleted",
  "moved",
  "archived",
  "unarchived",
  "restored",
  "completed",
  "assigned",
  "unassigned",
  "commented",
  "invited",
  "removed",
  "role_changed",
])

export const activityEntityTypeEnum = pgEnum("activity_entity_type", [
  "project",
  "list",
  "task",
  "comment",
  "member",
])

export const projectVisibilityEnum = pgEnum("project_visibility", ["public", "private"])

export const listTypeEnum = pgEnum("list_type", ["todo", "in_progress", "review", "done", "custom"])

/* ==================== TYPE DEFINITION ==================== */
export type NotificationPreferences = {
  taskAssigned: boolean
  taskCompleted: boolean
  taskCommented: boolean
  projectUpdated: boolean
  memberJoined: boolean
  invitationReceived: boolean
}

export type UserPreferences = {
  notifications: NotificationPreferences
  appearance: {
    theme: "light" | "dark" | "system"
    language: string
  }
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  notifications: {
    taskAssigned: true,
    taskCompleted: true,
    taskCommented: true,
    projectUpdated: true,
    memberJoined: true,
    invitationReceived: true,
  },
  appearance: {
    theme: "system",
    language: "en",
  },
}

/* ==================== USERS ==================== */
/* Synced from Clerk via webhook (Task 2.5) */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").notNull().unique(),
    email: text("email").notNull().unique(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    imageUrl: text("image_url"),
    role: text("role"), // Professional role (Developer, Designer, etc.) — NOT RBAC
    preferences: jsonb("preferences").$type<UserPreferences>().default(DEFAULT_USER_PREFERENCES),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("users_clerk_id_idx").on(table.clerkId),
    uniqueIndex("users_email_idx").on(table.email),
  ]
)

/* ==================== PROJECTS ==================== */

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    color: text("color").default("#2D6EF7").notNull(),
    status: projectStatusEnum("status").default("active").notNull(),
    priority: projectPriorityEnum("priority"),
    visibility: projectVisibilityEnum("visibility").default("private").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("projects_created_by_idx").on(table.createdById),
    index("projects_status_idx").on(table.status),
    index("projects_due_date_idx").on(table.dueDate),
  ]
)

/* ==================== PROJECT MEMBERS ==================== */
/* RBAC: each user has a role per project */

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").default("contributor").notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(), // Per-user pinning
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("project_members_unique_idx").on(table.projectId, table.userId),
    index("project_members_user_idx").on(table.userId),
    index("project_members_project_idx").on(table.projectId),
  ]
)

/* ==================== LISTS (Kanban Columns) ==================== */

export const lists = pgTable(
  "lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    color: text("color"),
    position: doublePrecision("position").notNull().default(0),
    type: listTypeEnum("type").default("custom").notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("lists_project_idx").on(table.projectId),
    index("lists_position_idx").on(table.projectId, table.position),
  ]
)

/* ==================== TASKS ==================== */
/*
  tasks.projectId is a deliberate denormalization.
  It's derivable via tasks.listId → lists.projectId, but keeping it
  here avoids JOINs for dashboard stats, analytics, calendar queries,
  and project-wide task filtering. Tasks only move between lists
  within the same project, so projectId never changes after creation.
*/

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    priority: taskPriorityEnum("priority"),
    position: doublePrecision("position").notNull().default(0),
    version: integer("version").notNull().default(1),
    isCompleted: boolean("is_completed").default(false).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    startDate: timestamp("start_date", { withTimezone: true }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("tasks_list_idx").on(table.listId),
    index("tasks_project_idx").on(table.projectId),
    index("tasks_position_idx").on(table.listId, table.position),
    index("tasks_created_by_idx").on(table.createdById),
    index("tasks_due_date_idx").on(table.dueDate),
    index("tasks_completed_idx").on(table.projectId, table.isCompleted),
  ]
)

/* ==================== TASK ATTACHMENTS ==================== */

export const taskAttachments = pgTable(
  "task_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    uploadedById: uuid("uploaded_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    size: integer("size").notNull(), // Size in bytes
    type: text("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("task_attachments_task_idx").on(table.taskId),
    index("task_attachments_user_idx").on(table.uploadedById),
  ]
)

/* ==================== TASK ASSIGNEES ==================== */
/* Many-to-many: a task can have multiple assignees */

export const taskAssignees = pgTable(
  "task_assignees",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("task_assignees_unique_idx").on(table.taskId, table.userId),
    index("task_assignees_task_idx").on(table.taskId),
    index("task_assignees_user_idx").on(table.userId),
  ]
)

/* ==================== LABELS ==================== */
/* Project-scoped labels for task categorization */

export const labels = pgTable(
  "labels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#6B7280"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("labels_project_idx").on(table.projectId),
    uniqueIndex("labels_project_name_idx").on(table.projectId, table.name),
  ]
)

/* ==================== TASK LABELS ==================== */
/* Many-to-many: a task can have multiple labels */

export const taskLabels = pgTable(
  "task_labels",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    labelId: uuid("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("task_labels_unique_idx").on(table.taskId, table.labelId),
    index("task_labels_task_idx").on(table.taskId),
    index("task_labels_label_idx").on(table.labelId),
  ]
)

/* ==================== COMMENTS ==================== */

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("comments_task_idx").on(table.taskId),
    index("comments_user_idx").on(table.userId),
  ]
)

/* ==================== ACTIVITY LOGS ==================== */
/*
  Powers: Dashboard "Recent Activity", Analytics "Team Activity Timeline",
  and project-level activity feeds.
  
  metadata (JSONB) stores flexible context per action, e.g.:
  - move:  { from: "To Do", to: "In Progress", fromListId: "...", toListId: "..." }
  - role_changed: { from: "viewer", to: "contributor", memberName: "John" }
  - completed: { taskTitle: "Fix bug #42" }
*/

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: activityActionEnum("action").notNull(),
    entityType: activityEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("activity_project_idx").on(table.projectId),
    index("activity_user_idx").on(table.userId),
    index("activity_created_at_idx").on(table.createdAt),
    index("activity_action_idx").on(table.action),
  ]
)

/* ==================== PROJECT INVITATIONS ==================== */

export const projectInvitations = pgTable(
  "project_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    invitedByUserId: uuid("invited_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: memberRoleEnum("role").default("contributor").notNull(),
    status: invitationStatusEnum("status").default("pending").notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("invitations_project_idx").on(table.projectId),
    index("invitations_email_idx").on(table.email),
    index("invitations_token_idx").on(table.token),
    index("invitations_status_idx").on(table.status),
  ]
)

/* ==================== NOTIFICATIONS ==================== */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    actionUrl: text("action_url"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_read_idx").on(table.userId, table.isRead),
    index("notifications_created_at_idx").on(table.createdAt),
  ]
)

/* ==================== CALENDAR EVENTS ==================== */
/* Custom events created by users. Can be project-scoped or personal (global). */

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    allDay: boolean("all_day").default(true).notNull(),
    color: text("color"),
    // Nullable — null means personal/global event, set means project-scoped
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("calendar_events_project_idx").on(table.projectId),
    index("calendar_events_created_by_idx").on(table.createdById),
    index("calendar_events_date_idx").on(table.startDate, table.endDate),
  ]
)

/* ==================== RELATIONS ==================== */

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projectMembers),
  createdProjects: many(projects),
  taskAssignments: many(taskAssignees),
  comments: many(comments),
  activityLogs: many(activityLogs),
  notifications: many(notifications),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [projects.createdById],
    references: [users.id],
  }),
  members: many(projectMembers),
  lists: many(lists),
  tasks: many(tasks),
  labels: many(labels),
  activityLogs: many(activityLogs),
  invitations: many(projectInvitations),
}))

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}))

export const listsRelations = relations(lists, ({ one, many }) => ({
  project: one(projects, {
    fields: [lists.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [lists.createdById],
    references: [users.id],
  }),
  tasks: many(tasks),
}))

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  list: one(lists, {
    fields: [tasks.listId],
    references: [lists.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
  }),
  assignees: many(taskAssignees),
  labels: many(taskLabels),
  comments: many(comments),
  attachments: many(taskAttachments),
}))

export const taskAttachmentsRelations = relations(taskAttachments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAttachments.taskId],
    references: [tasks.id],
  }),
  uploadedBy: one(users, {
    fields: [taskAttachments.uploadedById],
    references: [users.id],
  }),
}))

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignees.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskAssignees.userId],
    references: [users.id],
  }),
}))

export const labelsRelations = relations(labels, ({ one, many }) => ({
  project: one(projects, {
    fields: [labels.projectId],
    references: [projects.id],
  }),
  tasks: many(taskLabels),
}))

export const taskLabelsRelations = relations(taskLabels, ({ one }) => ({
  task: one(tasks, {
    fields: [taskLabels.taskId],
    references: [tasks.id],
  }),
  label: one(labels, {
    fields: [taskLabels.labelId],
    references: [labels.id],
  }),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}))

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  project: one(projects, {
    fields: [activityLogs.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}))

export const projectInvitationsRelations = relations(projectInvitations, ({ one }) => ({
  project: one(projects, {
    fields: [projectInvitations.projectId],
    references: [projects.id],
  }),
  invitedBy: one(users, {
    fields: [projectInvitations.invitedByUserId],
    references: [users.id],
  }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}))

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  project: one(projects, {
    fields: [calendarEvents.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [calendarEvents.createdById],
    references: [users.id],
  }),
}))

/* ==================== INFERRED TYPES ==================== */

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert

export type ProjectMember = typeof projectMembers.$inferSelect
export type NewProjectMember = typeof projectMembers.$inferInsert

export type List = typeof lists.$inferSelect
export type NewList = typeof lists.$inferInsert

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert

export type TaskAssignee = typeof taskAssignees.$inferSelect
export type NewTaskAssignee = typeof taskAssignees.$inferInsert

export type Label = typeof labels.$inferSelect
export type NewLabel = typeof labels.$inferInsert

export type TaskLabel = typeof taskLabels.$inferSelect
export type NewTaskLabel = typeof taskLabels.$inferInsert

export type TaskAttachment = typeof taskAttachments.$inferSelect
export type NewTaskAttachment = typeof taskAttachments.$inferInsert

export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert

export type ActivityLog = typeof activityLogs.$inferSelect
export type NewActivityLog = typeof activityLogs.$inferInsert

export type ProjectInvitation = typeof projectInvitations.$inferSelect
export type NewProjectInvitation = typeof projectInvitations.$inferInsert

export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert

export type CalendarEvent = typeof calendarEvents.$inferSelect
export type NewCalendarEvent = typeof calendarEvents.$inferInsert

/*
TODO: Implementation Notes for Interns:

1. Install Drizzle ORM dependencies:
   - drizzle-orm
   - drizzle-kit
   - @vercel/postgres (if using Vercel Postgres)
   - OR pg + @types/pg (if using regular PostgreSQL)

2. Define schemas for:
   - users (id, clerkId, email, name, createdAt, updatedAt)
   - projects (id, name, description, ownerId, createdAt, updatedAt, dueDate)
   - lists (id, name, projectId, position, createdAt, updatedAt)
   - tasks (id, title, description, listId, assigneeId, priority, dueDate, position, createdAt, updatedAt)
   - comments (id, content, taskId, authorId, createdAt, updatedAt)

3. Set up proper relationships between tables
4. Add indexes for performance
5. Configure migrations

Example structure:
import { pgTable, text, timestamp, integer, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ... other tables
*/
