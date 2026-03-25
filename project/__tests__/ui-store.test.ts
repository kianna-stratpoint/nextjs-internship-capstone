/* ============================================
   UI Store Integration Tests

   Tests the global UI store that controls
   modal open/close state across the app.
   ============================================ */

import { act } from "@testing-library/react"
import { useUIStore } from "@/stores/ui-store"

beforeEach(() => {
  act(() => {
    useUIStore.setState({
      isCreateProjectModalOpen: false,
      isEditProjectModalOpen: false,
      editingProject: null,
      isCreateTaskModalOpen: false,
      isInviteMemberModalOpen: false,
      inviteProjectId: null,
      isCalendarEventModalOpen: false,
      calendarEditingEvent: null,
      calendarDefaultDate: null,
    })
  })
})

describe("UI Store — Project Modals", () => {
  it("should open and close create project modal", () => {
    act(() => {
      useUIStore.getState().openCreateProjectModal()
    })
    expect(useUIStore.getState().isCreateProjectModalOpen).toBe(true)

    act(() => {
      useUIStore.getState().closeCreateProjectModal()
    })
    expect(useUIStore.getState().isCreateProjectModalOpen).toBe(false)
  })

  it("should open edit project modal with project data", () => {
    const project = { id: "p-1", title: "Test" } as any

    act(() => {
      useUIStore.getState().openEditProjectModal(project)
    })

    expect(useUIStore.getState().isEditProjectModalOpen).toBe(true)
    expect(useUIStore.getState().editingProject?.id).toBe("p-1")
  })

  it("should clear editing project on close", () => {
    const project = { id: "p-1", title: "Test" } as any
    act(() => {
      useUIStore.getState().openEditProjectModal(project)
    })

    act(() => {
      useUIStore.getState().closeEditProjectModal()
    })

    expect(useUIStore.getState().isEditProjectModalOpen).toBe(false)
    expect(useUIStore.getState().editingProject).toBeNull()
  })
})

describe("UI Store — Task Modal", () => {
  it("should toggle create task modal", () => {
    act(() => {
      useUIStore.getState().openCreateTaskModal()
    })
    expect(useUIStore.getState().isCreateTaskModalOpen).toBe(true)

    act(() => {
      useUIStore.getState().closeCreateTaskModal()
    })
    expect(useUIStore.getState().isCreateTaskModalOpen).toBe(false)
  })
})

describe("UI Store — Invite Member Modal", () => {
  it("should open with project ID", () => {
    act(() => {
      useUIStore.getState().openInviteMemberModal("project-1")
    })

    expect(useUIStore.getState().isInviteMemberModalOpen).toBe(true)
    expect(useUIStore.getState().inviteProjectId).toBe("project-1")
  })

  it("should clear project ID on close", () => {
    act(() => {
      useUIStore.getState().openInviteMemberModal("project-1")
    })
    act(() => {
      useUIStore.getState().closeInviteMemberModal()
    })

    expect(useUIStore.getState().isInviteMemberModalOpen).toBe(false)
    expect(useUIStore.getState().inviteProjectId).toBeNull()
  })
})

describe("UI Store — Calendar Event Modal", () => {
  it("should open with default date for creation", () => {
    const date = new Date("2026-03-25")

    act(() => {
      useUIStore.getState().openCalendarEventModal(date)
    })

    expect(useUIStore.getState().isCalendarEventModalOpen).toBe(true)
    expect(useUIStore.getState().calendarDefaultDate).toEqual(date)
    expect(useUIStore.getState().calendarEditingEvent).toBeNull()
  })

  it("should open with event data for editing", () => {
    const event = { id: "evt-1", title: "Meeting", type: "event" }

    act(() => {
      useUIStore.getState().openCalendarEventModal(undefined, event)
    })

    expect(useUIStore.getState().isCalendarEventModalOpen).toBe(true)
    expect(useUIStore.getState().calendarEditingEvent?.id).toBe("evt-1")
    expect(useUIStore.getState().calendarDefaultDate).toBeNull()
  })

  it("should clear all state on close", () => {
    const event = { id: "evt-1", title: "Meeting" }
    act(() => {
      useUIStore.getState().openCalendarEventModal(new Date(), event)
    })

    act(() => {
      useUIStore.getState().closeCalendarEventModal()
    })

    expect(useUIStore.getState().isCalendarEventModalOpen).toBe(false)
    expect(useUIStore.getState().calendarEditingEvent).toBeNull()
    expect(useUIStore.getState().calendarDefaultDate).toBeNull()
  })
})

describe("UI Store — Independent State", () => {
  it("should not affect other modals when one is opened", () => {
    act(() => {
      useUIStore.getState().openCreateProjectModal()
    })

    expect(useUIStore.getState().isCreateProjectModalOpen).toBe(true)
    expect(useUIStore.getState().isCreateTaskModalOpen).toBe(false)
    expect(useUIStore.getState().isInviteMemberModalOpen).toBe(false)
    expect(useUIStore.getState().isCalendarEventModalOpen).toBe(false)
  })
})
