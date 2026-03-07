/* ============================================
   Server-side auth helpers. Used in server
   components and server actions instead of calling
   Clerk directly — makes it easier to swap auth
   providers later if needed.
   ============================================ */

import { currentUser, auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

/**
 * Get the current authenticated user.
 * Returns null if not signed in.
 */
export async function getCurrentUser() {
  const user = await currentUser()
  if (!user) return null

  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress ?? "",
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    fullName: [user.firstName, user.lastName].filter(Boolean).join(" "),
    role: (user.unsafeMetadata?.role as string) ?? null,
    onboardingComplete: user.unsafeMetadata?.onboardingComplete === true,
  }
}

/**
 * Require authentication. Redirects to sign-in if not authenticated.
 * Use in server components or server actions that must have a user.
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/sign-in")
  }
  return user
}

/**
 * Get just the user ID from the session.
 * Lighter than getCurrentUser() when you only need the ID.
 */
export async function getUserId() {
  const { userId } = await auth()
  return userId
}

/**
 * Check if the current user has completed onboarding.
 */
export async function isOnboardingComplete() {
  const user = await currentUser()
  return user?.unsafeMetadata?.onboardingComplete === true
}
