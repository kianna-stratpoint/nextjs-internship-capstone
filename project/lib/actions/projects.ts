"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createProjectSchema, updateProjectSchema } from "@/lib/validations/project"
import { requireAuth } from "@/lib/auth"
import {
  createProject,
  updateProject,
  deleteProject,
  archiveProject,
  setProjectStatus,
  togglePinProject,
  getUserProjectRole,
} from "@/lib/db/queries/projects"

/**
 * Creates a new project, establishes default lists, and assigns the creator as Admin.
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

    // 1. Separate invites from the project data so Drizzle doesn't crash
    const { invites, ...projectData } = parsed.data

    // 2. Create the project
    const project = await createProject(projectData, userId)

    // TODO: Parse `invites` JSON and insert into your project_invitations table here if needed

    // 3. Revalidate cache and return the ID
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

    // 1. RBAC Check: Only Admins can update project details
    const role = await getUserProjectRole(projectId, userId)
    if (role !== "admin") {
      return {
        success: false,
        error: "Unauthorized: Only project admins can edit project details.",
      }
    }

    // 2. Validate Input
    const rawData = Object.fromEntries(formData.entries())
    const parsed = updateProjectSchema.safeParse(rawData)

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    // 3. Database Mutation
    await updateProject(projectId, parsed.data, userId)

    // 4. Revalidate cache
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

    // 1. RBAC Check: Only Admins can delete projects
    const role = await getUserProjectRole(projectId, userId)
    if (role !== "admin") {
      return { success: false, error: "Unauthorized: Only project admins can delete projects." }
    }

    // 2. Database Mutation (CASCADE removes lists, tasks, members, etc.)
    await deleteProject(projectId, userId)
  } catch (error) {
    return { success: false, error: "Failed to delete project." }
  }

  // 3. Revalidate and Redirect
  revalidatePath("/projects", "layout")
  redirect("/projects")
}

/**
 * Archives or unarchives a project. Restricted to Project Admins.
 */
export async function archiveProjectAction(projectId: string, isArchived: boolean) {
  try {
    const { dbUserId: userId } = await requireAuth()

    const role = await getUserProjectRole(projectId, userId)
    if (role !== "admin") {
      return { success: false, error: "Unauthorized: Only project admins can archive projects." }
    }

    await archiveProject(projectId, isArchived, userId)

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

    const role = await getUserProjectRole(projectId, userId)
    if (role !== "admin") {
      return {
        success: false,
        error: "Unauthorized: Only project admins can change project status.",
      }
    }

    await setProjectStatus(projectId, status, userId)

    revalidatePath("/projects", "layout")
    revalidatePath(`/projects/${projectId}`, "layout")

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update project status." }
  }
}

/**
 * Toggles the pinned status of a project for the current user.
 * No strict RBAC needed here; any involved member can pin a project for themselves.
 */
export async function togglePinProjectAction(projectId: string, currentPinState: boolean) {
  try {
    const { dbUserId: userId } = await requireAuth()

    // Validates the user is actually in the project before pinning
    const role = await getUserProjectRole(projectId, userId)
    if (!role) {
      return { success: false, error: "You are not a member of this project." }
    }

    await togglePinProject(projectId, userId, !currentPinState)

    // Revalidate dashboard and projects list to show the new pinned state
    revalidatePath("/projects", "layout")
    revalidatePath("/dashboard", "layout")

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to pin/unpin project." }
  }
}
