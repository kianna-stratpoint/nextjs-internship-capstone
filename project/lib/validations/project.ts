import { z } from "zod"

export const createProjectSchema = z
  .object({
    title: z
      .string()
      .min(1, "Project title is required")
      .max(100, "Project title must be 100 characters or less"),
    description: z
      .string()
      .max(500, "Description must be 500 characters or less")
      .optional()
      .nullable(),
    color: z
      .string()
      .regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color code")
      .optional(),
    priority: z
      .enum(["low", "medium", "high"], {
        message: "Priority must be low, medium, or high",
      })
      .optional(),
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

export const updateProjectSchema = createProjectSchema
  .extend({
    status: z
      .enum(["active", "completed"], {
        message: "Status must be active or completed",
      })
      .optional(),
    isArchived: z.boolean().optional(),
  })
  .partial()

export const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "contributor", "viewer"], {
    message: "Role must be admin, contributor, or viewer",
  }),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
