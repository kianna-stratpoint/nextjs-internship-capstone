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
  // Create Modal
  isCreateProjectModalOpen: boolean
  openCreateProjectModal: () => void
  closeCreateProjectModal: () => void

  // Edit Modal
  isEditProjectModalOpen: boolean
  editingProject: ProjectCardData | null
  openEditProjectModal: (project: ProjectCardData) => void
  closeEditProjectModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isCreateProjectModalOpen: false,
  openCreateProjectModal: () => set({ isCreateProjectModalOpen: true }),
  closeCreateProjectModal: () => set({ isCreateProjectModalOpen: false }),

  isEditProjectModalOpen: false,
  editingProject: null,
  openEditProjectModal: (project) => set({ isEditProjectModalOpen: true, editingProject: project }),
  closeEditProjectModal: () => set({ isEditProjectModalOpen: false, editingProject: null }),
}))
