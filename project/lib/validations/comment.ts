import { z } from "zod"

export const createCommentSchema = z.object({
  taskId: z.string().uuid("Invalid Task ID"),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be 2000 characters or less"),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
