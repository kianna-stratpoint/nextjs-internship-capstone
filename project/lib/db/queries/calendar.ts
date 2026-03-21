/* ============================================
   Calendar Queries

   Handles custom events CRUD and maps tasks
   with due dates to calendar events.
   ============================================ */

import { eq, and, gte, lte, desc, or, isNull, inArray, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  calendarEvents,
  tasks,
  projects,
  projectMembers,
  lists,
  activityLogs,
  notifications,
  users,
  type NewCalendarEvent,
} from "@/lib/db/schema"

/* ==================== CUSTOM EVENTS ==================== */

/**
 * Create a custom calendar event.
 */
export async function createCalendarEvent(data: NewCalendarEvent) {
  const [event] = await db.insert(calendarEvents).values(data).returning()

  if (!event) throw new Error("Failed to create calendar event.")

  // Log activity if project-scoped
  if (data.projectId) {
    await db.insert(activityLogs).values({
      projectId: data.projectId,
      userId: data.createdById,
      action: "created",
      entityType: "project",
      entityId: event.id,
      metadata: { title: event.title, type: "calendar_event" },
    })
  }

  return event
}

/**
 * Update a custom calendar event.
 */
export async function updateCalendarEvent(
  eventId: string,
  data: Partial<Omit<NewCalendarEvent, "id" | "createdById" | "createdAt">>,
  userId: string
) {
  const [updated] = await db
    .update(calendarEvents)
    .set(data)
    .where(eq(calendarEvents.id, eventId))
    .returning()

  return updated ?? null
}

/**
 * Delete a custom calendar event.
 */
export async function deleteCalendarEvent(eventId: string) {
  await db.delete(calendarEvents).where(eq(calendarEvents.id, eventId))
}

/**
 * Get a single calendar event by ID.
 */
export async function getCalendarEventById(eventId: string) {
  const event = await db.query.calendarEvents.findFirst({
    where: eq(calendarEvents.id, eventId),
    with: {
      project: { columns: { id: true, title: true, color: true } },
      createdBy: { columns: { id: true, firstName: true, lastName: true, imageUrl: true } },
    },
  })

  return event ?? null
}

/* ==================== FETCH ALL EVENTS FOR CALENDAR ==================== */

/**
 * Get all calendar events (custom + tasks) visible to a user
 * within a date range.
 *
 * Returns a unified array of calendar-compatible event objects.
 */
export async function getCalendarEvents(
  userId: string,
  startRange: Date,
  endRange: Date,
  projectFilter?: string | null
) {
  // 1. Get projects the user is a member of
  const memberships = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.userId, userId))

  const memberProjectIds = memberships.map((m) => m.projectId)

  // 2. Fetch custom events
  const customEventsWhere = projectFilter
    ? // Specific project filter
      and(
        eq(calendarEvents.projectId, projectFilter),
        lte(calendarEvents.startDate, endRange),
        gte(calendarEvents.endDate, startRange)
      )
    : // All: personal events + events from user's projects
      and(
        or(
          // Personal events by this user
          and(isNull(calendarEvents.projectId), eq(calendarEvents.createdById, userId)),
          // Project events from user's projects
          memberProjectIds.length > 0
            ? inArray(calendarEvents.projectId, memberProjectIds)
            : sql`false`
        ),
        lte(calendarEvents.startDate, endRange),
        gte(calendarEvents.endDate, startRange)
      )

  const customEvents = await db.query.calendarEvents.findMany({
    where: customEventsWhere,
    with: {
      project: { columns: { id: true, title: true, color: true } },
      createdBy: { columns: { id: true, firstName: true, lastName: true } },
    },
  })

  // 3. Fetch tasks with due dates
  const taskProjectFilter = projectFilter
    ? eq(tasks.projectId, projectFilter)
    : memberProjectIds.length > 0
      ? inArray(tasks.projectId, memberProjectIds)
      : sql`false`

  const taskEvents = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      startDate: tasks.startDate,
      dueDate: tasks.dueDate,
      isCompleted: tasks.isCompleted,
      priority: tasks.priority,
      projectId: tasks.projectId,
      projectTitle: projects.title,
      projectColor: projects.color,
      listTitle: lists.title,
    })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .innerJoin(lists, eq(lists.id, tasks.listId))
    .where(
      and(
        taskProjectFilter,
        // Task must have a due date that falls in range
        sql`${tasks.dueDate} IS NOT NULL`,
        lte(sql`COALESCE(${tasks.startDate}, ${tasks.dueDate})`, endRange),
        gte(tasks.dueDate, startRange)
      )
    )

  // 4. Map to unified format
  const mappedCustom = customEvents.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    start: e.startDate.toISOString(),
    end: e.endDate.toISOString(),
    allDay: e.allDay,
    color: e.color || e.project?.color || "#8B5CF6",
    type: "event" as const,
    projectId: e.projectId,
    projectTitle: e.project?.title ?? null,
    projectColor: e.project?.color ?? null,
    createdBy: e.createdBy,
    isCompleted: false,
    priority: null,
    listTitle: null,
  }))

  const mappedTasks = taskEvents.map((t) => ({
    id: `task-${t.id}`,
    title: t.title,
    description: null,
    // If task has start date, show as range; otherwise just due date
    start: t.startDate ? t.startDate.toISOString() : t.dueDate!.toISOString(),
    end: t.dueDate!.toISOString(),
    allDay: true,
    color: t.isCompleted
      ? "#10B981"
      : t.priority === "high"
        ? "#EF4444"
        : t.priority === "medium"
          ? "#F59E0B"
          : t.projectColor || "#3B82F6",
    type: "task" as const,
    projectId: t.projectId,
    projectTitle: t.projectTitle,
    projectColor: t.projectColor,
    createdBy: null,
    isCompleted: t.isCompleted,
    priority: t.priority,
    listTitle: t.listTitle,
  }))

  return [...mappedCustom, ...mappedTasks]
}
