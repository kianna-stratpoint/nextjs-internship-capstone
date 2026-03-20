"use server"

import { requireAuth } from "@/lib/auth"
import { getUserById } from "@/lib/db/queries/users"

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
      },
    }
  } catch (error) {
    return { success: false, error: "Unauthorized" }
  }
}
