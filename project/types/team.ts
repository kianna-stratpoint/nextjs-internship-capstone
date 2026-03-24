/* ============================================
   Team Types

   Shared between server page, client
   components, and hooks.
   ============================================ */

export type TeamProject = {
  id: string
  title: string
  color: string | null
  role: string
}

export type MemberCounts = {
  total: number
  admins: number
  contributors: number
  viewers: number
}

export type TeamMember = {
  id: string
  userId: string
  role: string
  joinedAt: Date | string
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
    imageUrl: string | null
    role: string | null
  }
}

export type PendingInvitation = {
  id: string
  email: string
  role: string
  createdAt: Date | string
  invitedBy?: {
    id: string
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  }
}
