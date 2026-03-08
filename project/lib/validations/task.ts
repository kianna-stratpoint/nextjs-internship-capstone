import { z } from "zod"

export const createTaskSchema = z
  .object({
    title: z
      .string()
      .min(1, "Task title is required")
      .max(200, "Task title must be 200 characters or less"),
    description: z.string().optional().nullable(),
    priority: z
      .enum(["low", "medium", "high"], {
        message: "Priority must be low, medium, or high",
      })
      .optional(),
    listId: z.string().uuid("Invalid List ID"),
    projectId: z.string().uuid("Invalid Project ID"),
    startDate: z.coerce.date().optional().nullable(),
    dueDate: z.coerce.date().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.dueDate && data.dueDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Due date must be after the start date",
        path: ["dueDate"],
      })
    }
  })

export const updateTaskSchema = createTaskSchema
  .pick({ title: true, description: true, priority: true, startDate: true, dueDate: true })
  .extend({
    isCompleted: z.boolean().optional(),
  })
  .partial()

export const moveTaskSchema = z.object({
  taskId: z.string().uuid("Invalid Task ID"),
  targetListId: z.string().uuid("Invalid Target List ID"),
  position: z.number().int("Position must be an integer"),
})

export const assignTaskSchema = z.object({
  taskId: z.string().uuid("Invalid Task ID"),
  assigneeUserId: z.string().uuid("Invalid User ID"),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type MoveTaskInput = z.infer<typeof moveTaskSchema>
export type AssignTaskInput = z.infer<typeof assignTaskSchema>
