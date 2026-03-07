/* ============================================
   This is now a SERVER component that:
   1. Checks if user is authenticated (redirects to /sign-in if not)
   2. Checks if onboarding is complete (redirects to /onboarding if not)
   3. Renders the client-side DashboardShell (sidebar + topnav)
   
   The actual sidebar/topnav UI lives in DashboardShell
   (client component) since it needs useState for mobile menu.
   ============================================ */

import type React from "react"
import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/shared/dashboard-shell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  // Not authenticated — redirect to sign-in
  if (!userId) {
    redirect("/sign-in")
  }

  // Check if onboarding is complete
  // Skip this check if we're already on the onboarding page
  const user = await currentUser()
  const onboardingComplete = user?.unsafeMetadata?.onboardingComplete === true

  // We can't check the current path in a layout server component easily,
  // so the onboarding page itself will handle not redirecting in a loop.
  // This flag is passed down so the shell knows whether to redirect.

  return <DashboardShell onboardingComplete={onboardingComplete}>{children}</DashboardShell>
}
