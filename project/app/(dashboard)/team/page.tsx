import type { Metadata } from "next"
import { requireAuth } from "@/lib/auth"
import { getMemberProjects } from "@/lib/db/queries/members"
import { TeamDashboard } from "@/components/features/team/team-dashboard"

export const metadata: Metadata = {
  title: "Team | FLOE.",
  description: "Manage team members and permissions across your projects",
}

export default async function TeamPage() {
  const { dbUserId: userId } = await requireAuth()

  const projects = await getMemberProjects(userId)

  const projectOptions = projects.map((p) => ({
    id: p.id,
    title: p.title,
    color: p.color,
    role: p.role,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team</h1>
        <p className="mt-1 text-muted-foreground">
          Manage team members and permissions across your projects
        </p>
      </div>

      {/* Interactive dashboard — client component */}
      <TeamDashboard projects={projectOptions} />
    </div>
  )
}
