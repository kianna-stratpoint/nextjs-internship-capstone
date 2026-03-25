"use server"

import { requireAuth } from "@/lib/auth"
import {
  getUserById,
  getUserByClerkId,
  createUser,
  updateUserByClerkId,
} from "@/lib/db/queries/users"
import { currentUser } from "@clerk/nextjs/server"

export async function getCurrentDbUserAction() {
  try {
    const { dbUserId } = await requireAuth()

    const user = await getUserById(dbUserId)

    if (!user) return { success: false, error: "User not found" }

    return {
      success: true,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        email: user.email,
        role: user.role,
      },
    }
  } catch (error) {
    return { success: false, error: "Unauthorized" }
  }
}

export async function syncUserOnboardingAction(role: string) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) return { success: false, error: "Not authenticated with Clerk" }

    const existingUser = await getUserByClerkId(clerkUser.id)

    if (existingUser) {
      await updateUserByClerkId(clerkUser.id, { role })
      return { success: true }
    }

    await createUser({
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      firstName: clerkUser.firstName ?? "",
      lastName: clerkUser.lastName ?? "",
      imageUrl: clerkUser.imageUrl ?? "",
      role: role,
    })

    return { success: true }
  } catch (error: any) {
    //console.error("Failed to sync user:", error)
    return { success: false, error: error.message || "Failed to sync user" }
  }
}
