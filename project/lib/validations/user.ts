import { z } from "zod"

export const onboardingSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
  role: z.string().min(1, "Please select a role"),
})

export const profileUpdateSchema = onboardingSchema.partial()

export type OnboardingInput = z.infer<typeof onboardingSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
