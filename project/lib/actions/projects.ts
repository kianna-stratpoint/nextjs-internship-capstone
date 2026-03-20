"use server"

import { revalidatePath } from "next/cache"
import { createProjectSchema, updateProjectSchema } from "@/lib/validations/project"
import { requireAuth } from "@/lib/auth"
import { requirePermission } from "@/lib/permissions"
import {
  getProjectsByUserId,
  createProject,
  updateProject,
  deleteProject,
  archiveProject,
  setProjectStatus,
  togglePinProject,
  getUserProjectRole,
  createProjectInvitations,
} from "@/lib/db/queries/projects"
import { broadcastToProject } from "@/lib/pusher/server"
import { PUSHER_EVENTS } from "@/lib/pusher/events"
import type { ProjectCardData } from "@/types/index"

export async function getProjectsAction(searchParams?: {
  query?: string
  sort?: string
  view?: string
  page?: number
}): Promise<{ success: true; data: ProjectCardData[] } | { success: false; error: string }> {
  try {
    const { dbUserId } = await requireAuth()
    const projects = await getProjectsByUserId(dbUserId, searchParams)
    return { success: true, data: projects as unknown as ProjectCardData[] }
  } catch (error: any) {
    return { success: false, error: "Failed to load projects." }
  }
}

/**
 * Creates a new project, establishes default lists, and assigns the creator as Admin.
 * No permission check needed — any authenticated user can create a project.
 */
export async function createProjectAction(formData: FormData) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const rawData = Object.fromEntries(formData.entries())
    const parsed = createProjectSchema.safeParse(rawData)

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const { invites, startDate, dueDate, ...projectData } = parsed.data

    const projectInsertData = {
      ...projectData,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
    }

    const project = await createProject(projectInsertData as any, userId)

    // Handle invites (Parse JSON string from FormData)
    if (invites) {
      try {
        const parsedInvites = JSON.parse(invites)
        if (Array.isArray(parsedInvites) && parsedInvites.length > 0) {
          await createProjectInvitations(project.id, userId, parsedInvites)
        }
      } catch (parseError) {}
    }

    revalidatePath("/projects", "layout")
    return { success: true, projectId: project.id }
  } catch (error) {
    return { success: false, error: "Failed to create project. Please try again." }
  }
}

/**
 * Updates a project's details. Restricted to Project Admins.
 */
export async function updateProjectAction(projectId: string, formData: FormData) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const { error: permError } = await requirePermission(projectId, userId, "project", "update")
    if (permError) return { success: false, error: permError }

    const rawData = Object.fromEntries(formData.entries())
    const parsed = updateProjectSchema.safeParse(rawData)

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const { startDate, dueDate, ...restData } = parsed.data
    const updateData = {
      ...restData,
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    }

    await updateProject(projectId, updateData as any, userId)

    await broadcastToProject(projectId, PUSHER_EVENTS.PROJECT_UPDATED, {
      changes: restData,
    })

    revalidatePath("/projects", "layout")
    revalidatePath(`/projects/${projectId}`, "layout")

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update project." }
  }
}

/**
 * Deletes a project. Strictly restricted to Project Admins.
 */
export async function deleteProjectAction(projectId: string) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const { error: permError } = await requirePermission(projectId, userId, "project", "delete")
    if (permError) return { success: false, error: permError }

    await deleteProject(projectId, userId)
  } catch (error) {
    return { success: false, error: "Failed to delete project." }
  }

  revalidatePath("/projects", "layout")
  return { success: true }
}

/**
 * Archives or unarchives a project. Restricted to Project Admins.
 */
export async function archiveProjectAction(projectId: string, isArchived: boolean) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const { error: permError } = await requirePermission(projectId, userId, "project", "archive")
    if (permError) return { success: false, error: permError }

    await archiveProject(projectId, isArchived, userId)

    await broadcastToProject(projectId, PUSHER_EVENTS.PROJECT_UPDATED, {
      changes: { isArchived },
    })

    revalidatePath("/projects", "layout")
    revalidatePath(`/projects/${projectId}`, "layout")

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to archive project." }
  }
}

/**
 * Marks a project as active or completed. Restricted to Project Admins.
 */
export async function setProjectStatusAction(projectId: string, status: "active" | "completed") {
  try {
    const { dbUserId: userId } = await requireAuth()

    const { error: permError } = await requirePermission(projectId, userId, "project", "update")
    if (permError) return { success: false, error: permError }

    await setProjectStatus(projectId, status, userId)

    await broadcastToProject(projectId, PUSHER_EVENTS.PROJECT_UPDATED, {
      changes: { status },
    })

    revalidatePath("/projects", "layout")
    revalidatePath(`/projects/${projectId}`, "layout")

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update project status." }
  }
}

/**
 * Toggles the pinned status of a project for the current user.
 * Any involved member can pin a project for themselves.
 */
export async function togglePinProjectAction(projectId: string, currentPinState: boolean) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const role = await getUserProjectRole(projectId, userId)
    if (!role) {
      return { success: false, error: "You are not a member of this project." }
    }

    await togglePinProject(projectId, userId, !currentPinState)

    revalidatePath("/projects", "layout")
    revalidatePath("/dashboard", "layout")

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to pin/unpin project." }
  }
}
