import { z } from "zod"

const datePreprocess = z.preprocess((arg) => {
  if (typeof arg === "string") return new Date(arg)
  if (arg instanceof Date) return arg
  return undefined
}, z.date())

const optionalDatePreprocess = z.preprocess((arg) => {
  if (typeof arg === "string") return new Date(arg)
  if (arg instanceof Date) return arg
  return undefined
}, z.date().optional())

export const createCalendarEventSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
    description: z.string().max(1000).optional().nullable(),
    startDate: datePreprocess,
    endDate: datePreprocess,
    allDay: z.boolean().default(true),
    color: z.string().optional().nullable(),
    projectId: z.string().uuid().optional().nullable(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })

export const updateCalendarEventSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional().nullable(),
    startDate: optionalDatePreprocess,
    endDate: optionalDatePreprocess,
    allDay: z.boolean().optional(),
    color: z.string().optional().nullable(),
    projectId: z.string().uuid().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate
      }
      return true
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>
