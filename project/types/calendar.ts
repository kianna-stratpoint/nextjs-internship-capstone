export type CalendarProject = {
  id: string
  title: string
  color: string | null
}

export type CalendarEventData = {
  id: string
  title: string
  description: string | null
  start: string
  end: string
  allDay: boolean
  color: string
  type: "event" | "task"
  projectId: string | null
  projectTitle: string | null
  projectColor: string | null
  createdBy: any | null
  isCompleted: boolean
  priority: string | null
  listTitle: string | null
}
