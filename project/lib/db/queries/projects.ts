import { eq, and, desc, asc, count, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  projects,
  projectMembers,
  lists,
  tasks,
  activityLogs,
  users,
  type NewProject,
} from "@/lib/db/schema"

/**
 * Get all projects a user is a member of.
 * Includes member count and task stats for the Projects page.
 */
export async function getProjectsByUserId(userId: string) {
  const userProjects = await db.query.projectMembers.findMany({
    where: eq(projectMembers.userId, userId),
    with: {
      project: {
        with: {
          members: {
            with: {
              user: true,
            },
          },
        },
      },
    },
    orderBy: desc(projectMembers.joinedAt),
  })

  // Enrich with task counts
  const enriched = await Promise.all(
    userProjects.map(async (pm) => {
      const [taskStats] = await db
        .select({
          total: count(tasks.id),
          completed: count(sql`CASE WHEN ${tasks.isCompleted} = true THEN 1 END`),
        })
        .from(tasks)
        .where(eq(tasks.projectId, pm.project.id))

      return {
        ...pm.project,
        memberRole: pm.role,
        isPinned: pm.isPinned,
        members: pm.project.members,
        _count: {
          tasks: taskStats?.total ?? 0,
          completedTasks: taskStats?.completed ?? 0,
        },
      }
    })
  )

  return enriched
}

/**
 * Get a single project by ID with full details.
 * Used for the Kanban board page.
 */
export async function getProjectById(projectId: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      createdBy: true,
      members: {
        with: {
          user: true,
        },
      },
      labels: true,
    },
  })

  return project ?? null
}

/**
 * Get the user's role in a project.
 * Returns null if user is not a member.
 */
export async function getUserProjectRole(projectId: string, userId: string) {
  const membership = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1)

  return membership[0]?.role ?? null
}

/**
 * Create a new project with default lists and admin membership.
 * Wraps everything in a single operation for consistency.
 */
export async function createProject(
  data: Pick<NewProject, "title" | "description" | "color" | "priority" | "startDate" | "dueDate">,
  creatorId: string
) {
  // Insert the project
  const [project] = await db
    .insert(projects)
    .values({
      ...data,
      createdById: creatorId,
    })
    .returning()

  // SAFETY CHECK:
  if (!project) {
    throw new Error("Failed to create project. Database returned undefined.")
  }

  // Add creator as admin
  await db.insert(projectMembers).values({
    projectId: project.id,
    userId: creatorId,
    role: "admin",
  })

  // Create default lists
  const defaultLists = [
    { title: "To Do", position: 0 },
    { title: "In Progress", position: 1000 },
    { title: "Review", position: 2000 },
    { title: "Done", position: 3000 },
  ]

  await db.insert(lists).values(
    defaultLists.map((list) => ({
      ...list,
      projectId: project.id,
      createdById: creatorId,
    }))
  )

  // Log activity
  await db.insert(activityLogs).values({
    projectId: project.id,
    userId: creatorId,
    action: "created",
    entityType: "project",
    entityId: project.id,
    metadata: { title: project.title },
  })

  return project
}

/**
 * Update project details.
 */
export async function updateProject(
  projectId: string,
  data: Partial<
    Pick<
      NewProject,
      | "title"
      | "description"
      | "color"
      | "priority"
      | "status"
      | "startDate"
      | "dueDate"
      | "isArchived"
    >
  >,
  userId: string
) {
  const [updated] = await db
    .update(projects)
    .set(data)
    .where(eq(projects.id, projectId))
    .returning()

  if (updated) {
    await db.insert(activityLogs).values({
      projectId,
      userId,
      action: "updated",
      entityType: "project",
      entityId: projectId,
      metadata: data,
    })
  }

  return updated ?? null
}

/**
 * Delete a project. CASCADE handles all related data.
 */
export async function deleteProject(projectId: string, userId: string) {
  // Log before delete (since cascade will remove the log too if we don't)
  await db.delete(projects).where(eq(projects.id, projectId))
}

/**
 * Archive/unarchive a project.
 */
export async function archiveProject(projectId: string, isArchived: boolean, userId: string) {
  return updateProject(projectId, { isArchived }, userId)
}

/**
 * Mark project as completed/active.
 */
export async function setProjectStatus(
  projectId: string,
  status: "active" | "completed",
  userId: string
) {
  return updateProject(projectId, { status }, userId)
}

/**
 * Pin/unpin a project for a specific user.
 */
export async function togglePinProject(projectId: string, userId: string, isPinned: boolean) {
  await db
    .update(projectMembers)
    .set({ isPinned })
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
}

/**
 * Add a member to a project.
 */
export async function addProjectMember(
  projectId: string,
  userId: string,
  role: "admin" | "contributor" | "viewer",
  invitedByUserId: string
) {
  const [member] = await db.insert(projectMembers).values({ projectId, userId, role }).returning()

  await db.insert(activityLogs).values({
    projectId,
    userId: invitedByUserId,
    action: "invited",
    entityType: "member",
    entityId: userId,
    metadata: { role },
  })

  return member
}

/**
 * Remove a member from a project.
 */
export async function removeProjectMember(
  projectId: string,
  userId: string,
  removedByUserId: string
) {
  await db
    .delete(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))

  await db.insert(activityLogs).values({
    projectId,
    userId: removedByUserId,
    action: "removed",
    entityType: "member",
    entityId: userId,
  })
}

/**
 * Change a member's role in a project.
 */
export async function changeProjectMemberRole(
  projectId: string,
  userId: string,
  newRole: "admin" | "contributor" | "viewer",
  changedByUserId: string
) {
  const [updated] = await db
    .update(projectMembers)
    .set({ role: newRole })
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .returning()

  await db.insert(activityLogs).values({
    projectId,
    userId: changedByUserId,
    action: "role_changed",
    entityType: "member",
    entityId: userId,
    metadata: { newRole },
  })

  return updated ?? null
}
