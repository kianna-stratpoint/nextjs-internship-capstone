import { eq, and, desc, asc, count, sql, or, exists, ilike, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  projects,
  projectMembers,
  lists,
  tasks,
  activityLogs,
  users,
  projectInvitations,
  notifications,
  type NewProject,
} from "@/lib/db/schema"
import { logActivity } from "./activity"
import { filterUsersWithNotificationEnabled } from "./settings"

/**
 * Get all projects a user is a member of.
 */
export async function getProjectsByUserId(
  userId: string,
  searchParams?: { query?: string; sort?: string; view?: string; page?: number; limit?: number }
) {
  const isArchivedView = searchParams?.view === "archived"
  const query = searchParams?.query || ""
  const page = searchParams?.page || 1
  const limit = searchParams?.limit || 20
  const offset = (page - 1) * limit

  let orderByLogic
  switch (searchParams?.sort) {
    case "newest":
      orderByLogic = desc(projects.createdAt)
      break
    case "oldest":
      orderByLogic = asc(projects.createdAt)
      break
    case "desc":
      orderByLogic = desc(projects.title)
      break
    case "asc":
    default:
      orderByLogic = asc(projects.title)
      break
  }

  const userProjects = await db.query.projects.findMany({
    limit,
    offset,
    where: and(
      exists(
        db
          .select()
          .from(projectMembers)
          .where(and(eq(projectMembers.projectId, projects.id), eq(projectMembers.userId, userId)))
      ),
      isArchivedView
        ? eq(projects.isArchived, true)
        : or(eq(projects.isArchived, false), sql`${projects.isArchived} IS NULL`),
      query
        ? or(ilike(projects.title, `%${query}%`), ilike(projects.description, `%${query}%`))
        : undefined
    ),
    with: {
      members: { with: { user: true } },
      tasks: {
        columns: { isCompleted: true },
      },
    },
    orderBy: [orderByLogic],
  })

  const enriched = userProjects.map((project) => {
    const { tasks, members, ...projectData } = project

    const userMembership = members.find((m) => m.userId === userId)
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.isCompleted).length

    return {
      ...projectData,
      memberRole: userMembership?.role ?? "viewer",
      isPinned: userMembership?.isPinned ?? false,
      members: members,
      _count: {
        tasks: totalTasks,
        completedTasks: completedTasks,
      },
    }
  })

  // 3. Surface Pinned projects
  enriched.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return 0
  })

  return enriched
}

/**
 * Get a single project by ID with full details.
 */
export async function getProjectById(projectId: string, userId?: string | null) {
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      or(
        eq(projects.visibility, "public"),
        userId
          ? exists(
              db
                .select()
                .from(projectMembers)
                .where(
                  and(eq(projectMembers.projectId, projects.id), eq(projectMembers.userId, userId))
                )
            )
          : eq(projects.id, "impossible_condition_to_fail_safely")
      )
    ),
    with: {
      createdBy: true,
      members: { with: { user: true } },
      labels: true,
      lists: {
        orderBy: (lists, { asc }) => [asc(lists.position)],
        with: {
          tasks: {
            orderBy: (tasks, { asc }) => [asc(tasks.position)],
            with: {
              assignees: { with: { user: true } },
              labels: { with: { label: true } },
            },
          },
        },
      },
    },
  })

  return project ?? null
}

/**
 * Get the user's role in a project.
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
 * Create a new project.
 */
export async function createProject(
  data: Pick<
    NewProject,
    "title" | "description" | "color" | "priority" | "visibility" | "startDate" | "dueDate"
  >,
  creatorId: string
) {
  const [project] = await db
    .insert(projects)
    .values({ ...data, createdById: creatorId })
    .returning()

  if (!project) throw new Error("Failed to create project.")

  await db.insert(projectMembers).values({
    projectId: project.id,
    userId: creatorId,
    role: "admin",
  })

  const defaultLists = [
    { title: "To Do", position: 0, color: "#64748B", type: "todo" as const, isSystem: true },
    {
      title: "In Progress",
      position: 1000,
      color: "#3B82F6",
      type: "in_progress" as const,
      isSystem: true,
    },
    { title: "Review", position: 2000, color: "#8B5CF6", type: "review" as const, isSystem: true },
    { title: "Done", position: 3000, color: "#10B981", type: "done" as const, isSystem: true },
  ]

  await db
    .insert(lists)
    .values(
      defaultLists.map((list) => ({ ...list, projectId: project.id, createdById: creatorId }))
    )

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
 * Create project invitations.
 */
export async function createProjectInvitations(
  projectId: string,
  inviterId: string,
  invites: { email: string; role: "admin" | "contributor" | "viewer" }[]
) {
  if (!invites || invites.length === 0) return

  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() + 7)

  const inviteRecords = invites.map((invite) => ({
    projectId,
    invitedByUserId: inviterId,
    email: invite.email,
    role: invite.role,
    token: crypto.randomUUID(),
    expiresAt: expirationDate,
    status: "pending" as const,
  }))

  await db.insert(projectInvitations).values(inviteRecords)
}

/**
 * Update project details
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
      | "visibility"
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
      metadata: { ...data, title: updated.title },
    })

    const [members, [updater]] = await Promise.all([
      db
        .select({ userId: projectMembers.userId })
        .from(projectMembers)
        .where(eq(projectMembers.projectId, projectId)),
      db
        .select({ firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
    ])

    const updaterName =
      [updater?.firstName, updater?.lastName].filter(Boolean).join(" ") || "Someone"
    const targetMemberIds = members.map((m) => m.userId).filter((id) => id !== userId)

    if (targetMemberIds.length > 0) {
      const enabledUserIds = await filterUsersWithNotificationEnabled(
        targetMemberIds,
        "projectUpdated"
      )

      if (enabledUserIds.length > 0) {
        const notificationsToInsert = enabledUserIds.map((targetId) => ({
          userId: targetId,
          type: "project_updated" as const,
          title: "Project Updated",
          message: `${updaterName} updated "${updated.title}".`,
          actionUrl: `/projects/${projectId}`,
          metadata: { projectId, updatedBy: userId, fields: Object.keys(data) },
        }))

        await db.insert(notifications).values(notificationsToInsert)
      }
    }
  }

  return updated ?? null
}

/**
 * Delete a project.
 */
export async function deleteProject(projectId: string, userId: string) {
  const [project] = await db
    .select({ title: projects.title })
    .from(projects)
    .where(eq(projects.id, projectId))
  if (!project) throw new Error("Project not found")

  await db.delete(projects).where(eq(projects.id, projectId))

  await logActivity({
    projectId: null,
    userId,
    action: "deleted",
    entityType: "project",
    entityId: projectId,
    metadata: { title: project.title },
  })
}

/**
 * Archive/unarchive a project.
 */
export async function archiveProject(projectId: string, isArchived: boolean, userId: string) {
  const [updatedProject] = await db
    .update(projects)
    .set({ isArchived, updatedAt: new Date() })
    .where(eq(projects.id, projectId))
    .returning()

  if (!updatedProject) throw new Error("Project not found")

  await db.insert(activityLogs).values({
    projectId,
    userId,
    action: isArchived ? "archived" : "unarchived",
    entityType: "project",
    entityId: projectId,
    metadata: { title: updatedProject.title },
  })

  return updatedProject
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
 * Pin/unpin a project.
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
 * Change a member's role.
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
