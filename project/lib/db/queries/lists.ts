import { eq, asc, and, desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { lists, activityLogs, type NewList } from "@/lib/db/schema"

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
        },
      },
    },
  })

  return result
}

/**
 * Create a new list in a project.
 * Position is set to the next available slot (max + 1000).
 */
export async function createList(
  data: Pick<NewList, "title" | "color">,
  projectId: string,
  createdById: string
) {
  // Find the highest position in the project
  const [maxList] = await db
    .select({ position: lists.position })
    .from(lists)
    .where(eq(lists.projectId, projectId))
    .orderBy(desc(lists.position)) // Descending order puts the highest number first
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

  // SAFETY CHECK: Fixes the "possibly 'undefined'" TypeScript errors
  if (!list) {
    throw new Error("Failed to create list. Database returned undefined.")
  }

  await db.insert(activityLogs).values({
    projectId,
    userId: createdById,
    action: "created",
    entityType: "list",
    entityId: list.id,
    metadata: { title: list.title },
  })

  return list
}

/**
 * Update list details (rename, change color).
 */
export async function updateList(
  listId: string,
  data: Partial<Pick<NewList, "title" | "color">>,
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
  }

  return updated ?? null
}

/**
 * Delete a list. CASCADE removes all tasks in the list.
 */
export async function deleteList(listId: string, userId: string) {
  // Get project ID before deleting for the activity log
  const [list] = await db
    .select({ projectId: lists.projectId, title: lists.title })
    .from(lists)
    .where(eq(lists.id, listId))
    .limit(1)

  if (!list) return

  await db.delete(lists).where(eq(lists.id, listId))

  await db.insert(activityLogs).values({
    projectId: list.projectId,
    userId,
    action: "deleted",
    entityType: "list",
    entityId: listId,
    metadata: { title: list.title },
  })
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
