import { z } from "zod"

const dateHelper = z.preprocess(
  (arg) => (typeof arg === "string" && arg === "" ? undefined : arg),
  z.coerce.date().optional().nullable()
)

// 1. Define the base shape WITHOUT the superRefine
const baseProjectSchema = z.object({
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
  startDate: dateHelper,
  dueDate: dateHelper,
})

// 2. Extract the date refinement logic so it can be reused safely
const dateRefinement = (data: any, ctx: z.RefinementCtx) => {
  if (data.startDate && data.dueDate && data.dueDate < data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Due date must be after the start date",
      path: ["dueDate"],
    })
  }
}

// 3. Apply the hidden 'invites' field (from our modal) and the refinement safely
export const createProjectSchema = baseProjectSchema
  .extend({
    invites: z.string().optional(), // Accepts the JSON string of invites from the hidden input
  })
  .superRefine(dateRefinement)

// 4. Extend, make partial, and THEN apply the refinement
export const updateProjectSchema = baseProjectSchema
  .extend({
    status: z
      .enum(["active", "completed"], {
        message: "Status must be active or completed",
      })
      .optional(),
    isArchived: z.boolean().optional(),
  })
  .partial()
  .superRefine(dateRefinement)

export const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "contributor", "viewer"], {
    message: "Role must be admin, contributor, or viewer",
  }),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
