import type { Metadata } from "next"
import { requireAuth } from "@/lib/auth"
import { getMemberProjects } from "@/lib/db/queries/members"
import { CalendarDashboard } from "@/components/features/calendar/calendar-dashboard"

export const metadata: Metadata = {
  title: "Calendar | FLOE.",
  description: "View project deadlines and manage events",
}

export default async function CalendarPage() {
  const { dbUserId: userId } = await requireAuth()

  // Fetch projects on server — instant, no client-side loading needed
  const projects = await getMemberProjects(userId)

  const projectOptions = projects.map((p) => ({
    id: p.id,
    title: p.title,
    color: p.color,
  }))

  return (
    <div className="space-y-6">
      {/* Header  */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Calendar</h1>
        <p className="mt-1 text-muted-foreground">View project deadlines and manage events</p>
      </div>

      {/* Interactive calendar — client component */}
      <CalendarDashboard projects={projectOptions} />
    </div>
  )
}
