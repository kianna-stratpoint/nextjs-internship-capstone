import { currentUser } from "@clerk/nextjs/server"
import { DashboardGreeting } from "@/components/features/dashboard/dashboard-greeting"
import { DashboardStats } from "@/components/features/dashboard/dashboard-stats"
import { RecentProjects } from "@/components/features/dashboard/recent-projects"
import { RecentActivity } from "@/components/features/dashboard/recent-activity"
import { QuickActions } from "@/components/features/dashboard/quick-actions"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard | FLOE.",
  description: "Your project management dashboard",
}

export default async function DashboardPage() {
  const user = await currentUser()

  return (
    <div className="space-y-6">
      <DashboardGreeting firstName={user?.firstName ?? undefined} />
      <DashboardStats />

      {/* Recent Projects + Recent Activity side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <RecentProjects />
        <RecentActivity />
      </div>

      <QuickActions />
    </div>
  )
}
