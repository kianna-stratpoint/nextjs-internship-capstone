import { eq, asc, and, desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { lists, tasks, activityLogs, projects, type NewList } from "@/lib/db/schema"

/**
 * Get all lists for a project, ordered by position.
 * Includes tasks with assignees and labels for the Kanban board.
 */
export async function getListsByProjectId(projectId: string) {
  const result = await db.query.lists.findMany({
    where: eq(lists.projectId, projectId),
    orderBy: asc(lists.position),
    with: {
      tasks: {
        orderBy: asc(lists.position),
        with: {
          assignees: {
            with: {
              user: true,
            },
          },
          labels: {
            with: {
              label: true,
            },
          },
          attachments: true,
        },
      },
    },
  })

  return result
}

/**
 * Create a new list in a project.
 */
export async function createList(
  data: Pick<NewList, "title" | "color" | "type">, // Added type
  projectId: string,
  createdById: string
) {
  const [maxList] = await db
    .select({ position: lists.position })
    .from(lists)
    .where(eq(lists.projectId, projectId))
    .orderBy(desc(lists.position))
    .limit(1)

  const maxPosition = maxList?.position ?? -1000

  const [list] = await db
    .insert(lists)
    .values({
      ...data,
      projectId,
      createdById,
      position: maxPosition + 1000,
    })
    .returning()

  if (!list) throw new Error("Failed to create list.")

  await db.insert(activityLogs).values({
    projectId,
    userId: createdById,
    action: "created",
    entityType: "list",
    entityId: list.id,
    metadata: { title: list.title },
  })

  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId))

  return list
}

/**
 * Update list details (rename, change color, change type).
 */
export async function updateList(
  listId: string,
  data: Partial<Pick<NewList, "title" | "color" | "type">>, // Added type
  userId: string
) {
  const [updated] = await db.update(lists).set(data).where(eq(lists.id, listId)).returning()

  if (updated) {
    await db.insert(activityLogs).values({
      projectId: updated.projectId,
      userId,
      action: "updated",
      entityType: "list",
      entityId: listId,
      metadata: data,
    })
    await db
      .update(projects)
      .set({ updatedAt: new Date() })
      .where(eq(projects.id, updated.projectId))
  }
  return updated ?? null
}

/**
 * Delete a list. If migrationListId is provided, tasks are moved there safely.
 */
export async function deleteList(listId: string, userId: string, migrationListId?: string) {
  const [list] = await db
    .select({ projectId: lists.projectId, title: lists.title })
    .from(lists)
    .where(eq(lists.id, listId))
    .limit(1)

  if (!list) return

  // MIGRATION LOGIC: Move tasks to the new list before deleting
  if (migrationListId) {
    await db.update(tasks).set({ listId: migrationListId }).where(eq(tasks.listId, listId))
  }

  // Delete the list
  await db.delete(lists).where(eq(lists.id, listId))

  await db.insert(activityLogs).values({
    projectId: list.projectId,
    userId,
    action: "deleted",
    entityType: "list",
    entityId: listId,
    metadata: { title: list.title, tasksMigrated: !!migrationListId },
  })
  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, list.projectId))
}

/**
 * Move a list to a new fractional position.
 */
export async function moveList(
  listId: string,
  position: number,
  projectId: string,
  userId: string
) {
  const [updated] = await db.update(lists).set({ position }).where(eq(lists.id, listId)).returning()

  if (updated) {
    await db.insert(activityLogs).values({
      projectId,
      userId,
      action: "moved",
      entityType: "list",
      entityId: listId,
      metadata: { title: updated.title, newPosition: position },
    })
    await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId))
  }

  return updated ?? null
}

/**
 * Reorder lists by updating their positions.
 * Accepts an array of { id, position } pairs from the drag-and-drop UI.
 */
export async function reorderLists(updates: { id: string; position: number }[]) {
  await Promise.all(
    updates.map(({ id, position }) => db.update(lists).set({ position }).where(eq(lists.id, id)))
  )
}
