/* ============================================
   File: lib/db/queries/invitations.ts
   Action: CREATE new file
   Task: 3.5
   ============================================ */

import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { projectInvitations, projectMembers, activityLogs, notifications } from "@/lib/db/schema"
import { getUserByEmail } from "./users"

/**
 * Create a project invitation.
 * Generates a unique token and sets expiry to 7 days.
 */
export async function createInvitation(
  projectId: string,
  email: string,
  role: "admin" | "contributor" | "viewer",
  invitedByUserId: string
) {
  // Generate a unique token
  const token = crypto.randomUUID()

  // Set expiry to 7 days from now
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const [invitation] = await db
    .insert(projectInvitations)
    .values({
      projectId,
      invitedByUserId,
      email,
      role,
      token,
      expiresAt,
    })
    .returning()

  // Create notification for the invitee if they have an account
  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    await db.insert(notifications).values({
      userId: existingUser.id,
      type: "invitation",
      title: "Project Invitation",
      message: `You've been invited to join a project as a ${role}.`,
      actionUrl: `/invitations/${token}`,
      metadata: { projectId, role, token },
    })
  }

  return invitation
}

/**
 * Get invitation by token (for accept/decline flow).
 */
export async function getInvitationByToken(token: string) {
  const invitation = await db.query.projectInvitations.findFirst({
    where: eq(projectInvitations.token, token),
    with: {
      project: true,
      invitedBy: true,
    },
  })

  return invitation ?? null
}

/**
 * Get pending invitations for a user's email.
 */
export async function getPendingInvitationsByEmail(email: string) {
  return db.query.projectInvitations.findMany({
    where: and(eq(projectInvitations.email, email), eq(projectInvitations.status, "pending")),
    with: {
      project: true,
      invitedBy: true,
    },
  })
}

/**
 * Accept an invitation — adds user as project member.
 */
export async function acceptInvitation(token: string, userId: string) {
  const invitation = await getInvitationByToken(token)

  if (!invitation) return { error: "Invitation not found" }
  if (invitation.status !== "pending") return { error: "Invitation already processed" }
  if (new Date() > invitation.expiresAt) {
    await db
      .update(projectInvitations)
      .set({ status: "expired" })
      .where(eq(projectInvitations.token, token))
    return { error: "Invitation has expired" }
  }

  // Update invitation status
  await db
    .update(projectInvitations)
    .set({ status: "accepted" })
    .where(eq(projectInvitations.token, token))

  // Add user as project member
  await db
    .insert(projectMembers)
    .values({
      projectId: invitation.projectId,
      userId,
      role: invitation.role,
    })
    .onConflictDoNothing()

  // Log activity
  await db.insert(activityLogs).values({
    projectId: invitation.projectId,
    userId,
    action: "invited",
    entityType: "member",
    entityId: userId,
    metadata: { role: invitation.role, viaInvitation: true },
  })

  return { success: true, projectId: invitation.projectId }
}

/**
 * Decline an invitation.
 */
export async function declineInvitation(token: string) {
  await db
    .update(projectInvitations)
    .set({ status: "declined" })
    .where(eq(projectInvitations.token, token))
}
