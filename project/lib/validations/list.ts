import { z } from "zod"

export const createListSchema = z.object({
  title: z
    .string()
    .min(1, "List title is required")
    .max(100, "List title must be 100 characters or less"),
  color: z
    .string()
    .regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color code")
    .optional(),
  projectId: z.string().uuid("Invalid Project ID"),
})

export const updateListSchema = createListSchema.pick({ title: true, color: true }).partial()

export const reorderListsSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid("Invalid List ID"),
      position: z.number().int("Position must be an integer"),
    })
  ),
})

export type CreateListInput = z.infer<typeof createListSchema>
export type UpdateListInput = z.infer<typeof updateListSchema>
export type ReorderListsInput = z.infer<typeof reorderListsSchema>
