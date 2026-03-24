import type { Metadata } from "next"
import { requireAuth } from "@/lib/auth"
import { getMemberProjects } from "@/lib/db/queries/members"
import { AnalyticsDashboard } from "@/components/features/analytics/analytics-dashboard"

export const metadata: Metadata = {
  title: "Analytics | FLOE.",
  description: "Track project performance and team productivity",
}

export default async function AnalyticsPage() {
  let projects: { id: string; title: string; color: string | null }[] = []

  try {
    const { dbUserId: userId } = await requireAuth()
    const memberProjects = await getMemberProjects(userId)
    projects = memberProjects.map((p) => ({
      id: p.id,
      title: p.title,
      color: p.color,
    }))
  } catch (error) {
    throw error
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Track project performance and team productivity
        </p>
      </div>

      {/* Interactive dashboard — client component */}
      <AnalyticsDashboard projects={projects} />
    </div>
  )
}
