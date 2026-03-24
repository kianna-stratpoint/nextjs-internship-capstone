"use client"

import type React from "react"
import { useEffect, Suspense } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useUIStore } from "@/stores/ui-store"
import { Sidebar } from "@/components/shared/sidebar"
import { TopNav } from "@/components/shared/top-nav"
import { CreateProjectModal } from "../modals/create-project-modal"
import { EditProjectModal } from "@/components/modals/edit-project-modal"
import { CreateTaskModal } from "../modals/create-task-modal"
import { InviteMemberModal } from "../modals/invite-member-modal"

interface DashboardShellProps {
  children: React.ReactNode
  onboardingComplete: boolean
}

export function DashboardShell({ children, onboardingComplete }: DashboardShellProps) {
  const { isSidebarOpen, closeSidebar } = useUIStore()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!onboardingComplete && pathname !== "/onboarding") {
      router.replace("/onboarding")
    }
  }, [onboardingComplete, pathname, router])

  if (pathname === "/onboarding") {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <Suspense>{children}</Suspense>
        </main>

        <CreateProjectModal />
        <EditProjectModal />
        <CreateTaskModal />
        <InviteMemberModal />
      </div>
    </div>
  )
}
