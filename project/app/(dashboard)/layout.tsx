import type React from "react"
import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/shared/dashboard-shell"
import { QueryProvider } from "@/components/providers/query-provider"
import { PusherProvider } from "@/components/providers/pusher-provider"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  // Not authenticated — redirect to sign-in
  if (!userId) {
    redirect("/sign-in")
  }

  const user = await currentUser()
  const onboardingComplete = user?.unsafeMetadata?.onboardingComplete === true

  if (!onboardingComplete) {
    redirect("/onboarding")
  }

  return (
    <QueryProvider>
      <PusherProvider>
        <DashboardShell>{children}</DashboardShell>
      </PusherProvider>
    </QueryProvider>
  )
}
