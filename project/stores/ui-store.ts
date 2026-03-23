// TODO: Task 5.3 - Set up client-side state management with Zustand

/*
TODO: Implementation Notes for Interns:

UI state management store for:
- Modal states (create project, create task, etc.)
- Sidebar state
- Theme preferences
- Loading states
- Error states
- Notifications/toasts

Install: pnpm add zustand

Example structure:
import { create } from 'zustand'

interface UIState {
  // Modal states
  isCreateProjectModalOpen: boolean
  isCreateTaskModalOpen: boolean
  isTaskDetailModalOpen: boolean
  selectedTaskId: string | null

  // UI states
  sidebarOpen: boolean
  theme: 'light' | 'dark'

  // Loading states
  isLoading: boolean
  loadingMessage: string

  // Actions
  openCreateProjectModal: () => void
  closeCreateProjectModal: () => void
  openCreateTaskModal: () => void
  closeCreateTaskModal: () => void
  openTaskDetailModal: (taskId: string) => void
  closeTaskDetailModal: () => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setLoading: (loading: boolean, message?: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  // ... implementation
}))
*/

import { create } from "zustand"
import { type ProjectCardData } from "@/types"

interface UIState {
  // Sidebar States
  isSidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void

  // Modal States
  isCreateProjectModalOpen: boolean
  openCreateProjectModal: () => void
  closeCreateProjectModal: () => void

  isEditProjectModalOpen: boolean
  editingProject: ProjectCardData | null
  openEditProjectModal: (project: ProjectCardData) => void
  closeEditProjectModal: () => void

  isCreateTaskModalOpen: boolean
  openCreateTaskModal: () => void
  closeCreateTaskModal: () => void

  isInviteMemberModalOpen: boolean
  inviteProjectId: string | null
  openInviteMemberModal: (projectId: string) => void
  closeInviteMemberModal: () => void

  isCalendarEventModalOpen: boolean
  calendarEditingEvent: any | null
  calendarDefaultDate: Date | null
  openCalendarEventModal: (defaultDate?: Date, event?: any) => void
  closeCalendarEventModal: () => void

  // --- Theme State ---
  theme: "light" | "dark"
  setTheme: (theme: "light" | "dark") => void

  // --- Loading States ---
  isGlobalLoading: boolean
  setGlobalLoading: (isLoading: boolean) => void

  isMutatingTask: boolean
  setMutatingTask: (isMutating: boolean) => void

  // --- Error States ---
  globalError: string | null
  setGlobalError: (error: string | null) => void
  clearGlobalError: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  isCreateProjectModalOpen: false,
  openCreateProjectModal: () => set({ isCreateProjectModalOpen: true }),
  closeCreateProjectModal: () => set({ isCreateProjectModalOpen: false }),

  isEditProjectModalOpen: false,
  editingProject: null,
  openEditProjectModal: (project) => set({ isEditProjectModalOpen: true, editingProject: project }),
  closeEditProjectModal: () => set({ isEditProjectModalOpen: false, editingProject: null }),

  isCreateTaskModalOpen: false,
  openCreateTaskModal: () => set({ isCreateTaskModalOpen: true }),
  closeCreateTaskModal: () => set({ isCreateTaskModalOpen: false }),

  isInviteMemberModalOpen: false,
  inviteProjectId: null,
  openInviteMemberModal: (projectId) =>
    set({ isInviteMemberModalOpen: true, inviteProjectId: projectId }),
  closeInviteMemberModal: () => set({ isInviteMemberModalOpen: false, inviteProjectId: null }),

  isCalendarEventModalOpen: false,
  calendarEditingEvent: null,
  calendarDefaultDate: null,
  openCalendarEventModal: (defaultDate, event) =>
    set({
      isCalendarEventModalOpen: true,
      calendarDefaultDate: defaultDate ?? null,
      calendarEditingEvent: event ?? null,
    }),
  closeCalendarEventModal: () =>
    set({
      isCalendarEventModalOpen: false,
      calendarEditingEvent: null,
      calendarDefaultDate: null,
    }),

  theme: "light",
  setTheme: (theme) => set({ theme }),

  isGlobalLoading: false,
  setGlobalLoading: (isLoading) => set({ isGlobalLoading: isLoading }),

  isMutatingTask: false,
  setMutatingTask: (isMutating) => set({ isMutatingTask: isMutating }),

  globalError: null,
  setGlobalError: (error) => set({ globalError: error }),
  clearGlobalError: () => set({ globalError: null }),
}))
