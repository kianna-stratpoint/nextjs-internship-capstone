"use server"

import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"
import { requirePermission } from "@/lib/permissions"
import { getUserProjectRole } from "@/lib/db/queries/projects"
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEventById,
  getCalendarEvents,
} from "@/lib/db/queries/calendar"
import { createCalendarEventSchema, updateCalendarEventSchema } from "@/lib/validations/calendar"

/**
 * Get all calendar events (custom + tasks) for the current user.
 */
export async function getCalendarEventsAction(
  startRange: string,
  endRange: string,
  projectFilter?: string | null
) {
  try {
    const { dbUserId: userId } = await requireAuth()

    // If filtering by project, verify membership
    if (projectFilter) {
      const role = await getUserProjectRole(projectFilter, userId)
      if (!role) return { success: false, error: "You are not a member of this project." }
    }

    const events = await getCalendarEvents(
      userId,
      new Date(startRange),
      new Date(endRange),
      projectFilter
    )

    return { success: true, data: events }
  } catch (error) {
    return { success: false, error: "Failed to load calendar events." }
  }
}

/**
 * Create a custom calendar event.
 */
export async function createCalendarEventAction(data: unknown) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const parsed = createCalendarEventSchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const { projectId, ...eventData } = parsed.data

    // If project-scoped, check permission
    if (projectId) {
      const { error: permError } = await requirePermission(projectId, userId, "project", "read")
      if (permError) return { success: false, error: permError }

      // Viewers can't create events
      const role = await getUserProjectRole(projectId, userId)
      if (role === "viewer") {
        return { success: false, error: "Viewers cannot create events." }
      }
    }

    const event = await createCalendarEvent({
      ...eventData,
      projectId: projectId ?? null,
      createdById: userId,
    })

    revalidatePath("/calendar", "layout")

    return { success: true, data: event }
  } catch (error) {
    return { success: false, error: "Failed to create event." }
  }
}

/**
 * Update a custom calendar event.
 */
export async function updateCalendarEventAction(eventId: string, data: unknown) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const parsed = updateCalendarEventSchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    // Verify ownership or project admin
    const existing = await getCalendarEventById(eventId)
    if (!existing) return { success: false, error: "Event not found." }

    if (existing.createdById !== userId) {
      // If project-scoped, admins can edit
      if (existing.projectId) {
        const role = await getUserProjectRole(existing.projectId, userId)
        if (role !== "admin") {
          return { success: false, error: "Only the creator or project admins can edit events." }
        }
      } else {
        return { success: false, error: "You can only edit your own personal events." }
      }
    }

    const updated = await updateCalendarEvent(eventId, parsed.data, userId)

    revalidatePath("/calendar", "layout")

    return { success: true, data: updated }
  } catch (error) {
    return { success: false, error: "Failed to update event." }
  }
}

/**
 * Delete a custom calendar event.
 */
export async function deleteCalendarEventAction(eventId: string) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const existing = await getCalendarEventById(eventId)
    if (!existing) return { success: false, error: "Event not found." }

    if (existing.createdById !== userId) {
      if (existing.projectId) {
        const role = await getUserProjectRole(existing.projectId, userId)
        if (role !== "admin") {
          return { success: false, error: "Only the creator or project admins can delete events." }
        }
      } else {
        return { success: false, error: "You can only delete your own personal events." }
      }
    }

    await deleteCalendarEvent(eventId)

    revalidatePath("/calendar", "layout")

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete event." }
  }
}
