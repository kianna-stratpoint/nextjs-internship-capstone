"use server"

import { revalidatePath } from "next/cache"
import { eq, and, count } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/lib/db"
import { lists } from "@/lib/db/schema"
import { requireAuth } from "@/lib/auth"
import { requirePermission } from "@/lib/permissions"
import { broadcastToProject } from "@/lib/pusher/server"
import { PUSHER_EVENTS } from "@/lib/pusher/events"
import {
  getListsByProjectId,
  createList,
  updateList,
  deleteList,
  reorderLists,
  moveList,
} from "@/lib/db/queries/lists"
import {
  createListSchema,
  updateListSchema,
  reorderListsSchema,
  type CreateListInput,
  type UpdateListInput,
  type ReorderListsInput,
} from "@/lib/validations/list"

// Counts how many "done" lists currently exist in the project
async function getDoneListCount(projectId: string) {
  const [res] = await db
    .select({ value: count() })
    .from(lists)
    .where(and(eq(lists.projectId, projectId), eq(lists.type, "done")))

  return res?.value ?? 0
}

export async function getProjectListsAction(projectId: string) {
  try {
    const { dbUserId } = await requireAuth()

    const { error: permError } = await requirePermission(projectId, dbUserId, "list", "read")
    if (permError) return { error: permError }

    const projectLists = await getListsByProjectId(projectId)
    return { data: projectLists }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to fetch lists" }
  }
}

export async function createListAction(data: CreateListInput) {
  try {
    const { dbUserId } = await requireAuth()
    const parsed = createListSchema.parse(data)

    const { error: permError } = await requirePermission(
      parsed.projectId,
      dbUserId,
      "list",
      "create"
    )
    if (permError) return { error: permError }

    if (parsed.type === "done") {
      const doneCount = await getDoneListCount(parsed.projectId)
      if (doneCount > 0) throw new Error("A 'Done' list already exists in this project.")
    }

    const list = await createList(
      { title: parsed.title, color: parsed.color, type: parsed.type },
      parsed.projectId,
      dbUserId
    )

    await broadcastToProject(parsed.projectId, PUSHER_EVENTS.LIST_CREATED, {
      listId: list.id,
      title: list.title,
      position: list.position,
      color: list.color,
    })

    revalidatePath(`/projects/${parsed.projectId}`)
    return { list }
  } catch (error) {
    if (error instanceof z.ZodError) return { error: (error as any).issues[0].message }
    return { error: error instanceof Error ? error.message : "Failed to create list" }
  }
}

export async function updateListAction(listId: string, projectId: string, data: UpdateListInput) {
  try {
    const { dbUserId } = await requireAuth()
    const parsed = updateListSchema.parse(data)

    const { error: permError } = await requirePermission(projectId, dbUserId, "list", "update")
    if (permError) return { error: permError }

    const [existingList] = await db
      .select({ type: lists.type })
      .from(lists)
      .where(eq(lists.id, listId))
      .limit(1)

    if (!existingList) throw new Error("List not found")

    if (parsed.type && parsed.type !== existingList.type) {
      if (parsed.type === "done") {
        const doneCount = await getDoneListCount(projectId)
        if (doneCount > 0) throw new Error("A 'Done' list already exists.")
      }
      if (existingList.type === "done") {
        const doneCount = await getDoneListCount(projectId)
        if (doneCount <= 1)
          throw new Error("Cannot change type. At least one 'Done' list must exist.")
      }
    }

    const updated = await updateList(listId, parsed, dbUserId)

    await broadcastToProject(projectId, PUSHER_EVENTS.LIST_UPDATED, {
      listId,
      changes: parsed,
    })

    revalidatePath(`/projects/${projectId}`)
    return { list: updated }
  } catch (error) {
    if (error instanceof z.ZodError) return { error: (error as any).issues[0].message }
    return { error: error instanceof Error ? error.message : "Failed to update list" }
  }
}

export async function deleteListAction(
  listId: string,
  projectId: string,
  migrationListId?: string
) {
  try {
    const { dbUserId } = await requireAuth()

    const { error: permError } = await requirePermission(projectId, dbUserId, "list", "delete")
    if (permError) return { error: permError }

    const [existingList] = await db
      .select({ type: lists.type })
      .from(lists)
      .where(eq(lists.id, listId))
      .limit(1)

    if (!existingList) throw new Error("List not found")

    if (existingList.type === "done") {
      const doneCount = await getDoneListCount(projectId)
      if (doneCount <= 1)
        throw new Error("Cannot delete the final 'Done' list. Completion logic must exist.")
    }

    await deleteList(listId, dbUserId, migrationListId)

    await broadcastToProject(projectId, PUSHER_EVENTS.LIST_DELETED, {
      listId,
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to delete list" }
  }
}

export async function moveListAction(listId: string, projectId: string, position: number) {
  try {
    const { dbUserId } = await requireAuth()

    const { error: permError } = await requirePermission(projectId, dbUserId, "list", "reorder")
    if (permError) return { error: permError }

    await moveList(listId, position, projectId, dbUserId)

    await broadcastToProject(projectId, PUSHER_EVENTS.LIST_REORDERED, {
      updates: [{ listId, position }],
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to move list" }
  }
}

export async function reorderListsAction(projectId: string, data: ReorderListsInput) {
  try {
    const { dbUserId } = await requireAuth()
    const parsed = reorderListsSchema.parse(data)

    const { error: permError } = await requirePermission(projectId, dbUserId, "list", "reorder")
    if (permError) return { error: permError }

    await reorderLists(parsed.updates)

    await broadcastToProject(projectId, PUSHER_EVENTS.LIST_REORDERED, {
      updates: parsed.updates.map((u) => ({ listId: u.id, position: u.position })),
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) return { error: (error as any).issues[0].message }
    return { error: error instanceof Error ? error.message : "Failed to reorder lists" }
  }
}
