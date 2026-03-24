export type TimeRange = "7d" | "30d" | "all"

export type AnalyticsStats = {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  efficiency: number
  activeUsers: number
  avgCompletionDays: number
  avgCompletionHours: number
  totalAssigned: number
}

export type VelocityDataPoint = {
  period: string
  completed: number
  created: number
}

export type TimelineDataPoint = {
  date: string
  activities: number
}

export type TasksByStatusEntry = {
  name: string
  type: string
  value: number
}

export type TasksByPriorityEntry = {
  name: string
  value: number
}

export type LeaderboardEntry = {
  userId: string
  completedCount: number
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  } | null
}

export type ActivityLogEntry = {
  id: string
  action: string
  entityType: string
  entityId: string | null
  metadata: Record<string, any> | null
  createdAt: Date
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  }
  project?: {
    id: string
    title: string
    color: string | null
  } | null
}

export type AnalyticsData = {
  stats: AnalyticsStats
  velocity: VelocityDataPoint[]
  timeline: TimelineDataPoint[]
  activity: ActivityLogEntry[]
  leaderboard: LeaderboardEntry[]
  tasksByStatus: TasksByStatusEntry[]
  tasksByPriority: TasksByPriorityEntry[]
}
