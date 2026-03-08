import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, type NewUser } from "@/lib/db/schema"

/**
 * Get a user by their Clerk ID.
 * Used after auth to find the local DB user.
 */
export async function getUserByClerkId(clerkId: string) {
  const result = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)

  return result[0] ?? null
}

/**
 * Get a user by their internal UUID.
 */
export async function getUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1)

  return result[0] ?? null
}

/**
 * Get a user by their email.
 */
export async function getUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1)

  return result[0] ?? null
}

/**
 * Create a new user (called from Clerk webhook on user.created).
 */
export async function createUser(data: NewUser) {
  const result = await db.insert(users).values(data).returning()
  return result[0]
}

/**
 * Update user profile (called from Clerk webhook on user.updated).
 */
export async function updateUserByClerkId(
  clerkId: string,
  data: Partial<Omit<NewUser, "id" | "clerkId" | "createdAt">>
) {
  const result = await db.update(users).set(data).where(eq(users.clerkId, clerkId)).returning()

  return result[0] ?? null
}

/**
 * Delete a user (called from Clerk webhook on user.deleted).
 * CASCADE will clean up all related data.
 */
export async function deleteUserByClerkId(clerkId: string) {
  await db.delete(users).where(eq(users.clerkId, clerkId))
}
