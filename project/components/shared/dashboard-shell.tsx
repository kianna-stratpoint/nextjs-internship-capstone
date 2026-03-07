/* ============================================
   Client component that handles:
   - Sidebar open/close state
   - Onboarding redirect check
   - Renders Sidebar + TopNav + main content
   ============================================ */

"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/shared/sidebar"
import { TopNav } from "@/components/shared/top-nav"

interface DashboardShellProps {
  children: React.ReactNode
  onboardingComplete: boolean
}

export function DashboardShell({ children, onboardingComplete }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Redirect to onboarding if not complete
  // (skip if already on the onboarding page)
  useEffect(() => {
    if (!onboardingComplete && pathname !== "/onboarding") {
      router.replace("/onboarding")
    }
  }, [onboardingComplete, pathname, router])

  // If on onboarding page, render children without shell
  if (pathname === "/onboarding") {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <Suspense>{children}</Suspense>
        </main>
      </div>
    </div>
  )
}
