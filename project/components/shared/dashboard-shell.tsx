"use client"

import type React from "react"
import { Suspense } from "react"
import { useUIStore } from "@/stores/ui-store"
import { Sidebar } from "@/components/shared/sidebar"
import { TopNav } from "@/components/shared/top-nav"
import { CreateProjectModal } from "../modals/create-project-modal"
import { EditProjectModal } from "@/components/modals/edit-project-modal"
import { CreateTaskModal } from "../modals/create-task-modal"
import { InviteMemberModal } from "../modals/invite-member-modal"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { isSidebarOpen, closeSidebar } = useUIStore()

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
