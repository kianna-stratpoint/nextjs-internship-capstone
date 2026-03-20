import { z } from "zod"

const baseTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).optional().nullable(),
  startDate: z.date().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  listId: z.string(),
  projectId: z.string(),
})

export const createTaskSchema = baseTaskSchema.refine(
  (data) => {
    if (data.startDate && data.dueDate) {
      return data.dueDate >= data.startDate
    }
    return true
  },
  {
    message: "Due date must be after start date",
    path: ["dueDate"],
  }
)

export const updateTaskSchema = baseTaskSchema
  .pick({
    title: true,
    description: true,
    priority: true,
    startDate: true,
    dueDate: true,
  })
  .extend({
    isCompleted: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.dueDate) {
        return data.dueDate >= data.startDate
      }
      return true
    },
    {
      message: "Due date must be after start date",
      path: ["dueDate"],
    }
  )

export const moveTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  listId: z.string().min(1, "Target List ID is required"),
  position: z.number(),
})

export const assignTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  assigneeUserId: z.string().min(1, "User ID is required"),
})

/** Standalone schema for attachment metadata (used after UploadThing upload) */
export const attachmentMetadataSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1),
  size: z.number(),
  type: z.string(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type MoveTaskInput = z.infer<typeof moveTaskSchema>
export type AssignTaskInput = z.infer<typeof assignTaskSchema>
export type AttachmentMetadata = z.infer<typeof attachmentMetadataSchema>
