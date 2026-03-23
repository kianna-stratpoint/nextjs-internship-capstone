import { cn } from "@/lib/utils"

/* ==================== BASE ==================== */

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />
}

/* ==================== DASHBOARD ==================== */

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <Bone className="mb-3 h-9 w-9 rounded-lg" />
          <Bone className="mb-1 h-8 w-16" />
          <Bone className="mb-1 h-3 w-20" />
          <Bone className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

export function RecentProjectsSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <Bone className="h-5 w-32" />
        <Bone className="h-4 w-16" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-border p-4"
          >
            <div className="flex items-center gap-3">
              <Bone className="h-3 w-3 rounded-full" />
              <div className="space-y-2">
                <Bone className="h-4 w-40" />
                <Bone className="h-3 w-28" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Bone className="h-1.5 w-24 rounded-full" />
                <Bone className="h-3 w-8" />
              </div>
              <div className="hidden items-center gap-2 md:flex">
                <Bone className="h-5 w-14 rounded-full" />
                <Bone className="h-5 w-14 rounded-full" />
              </div>
              <div className="hidden -space-x-1.5 lg:flex">
                {[1, 2, 3].map((j) => (
                  <Bone key={j} className="h-6 w-6 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RecentActivitySkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <Bone className="h-5 w-32" />
        <Bone className="h-4 w-16" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg p-3">
            <Bone className="h-7 w-7 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Bone className="h-3.5 w-3/4" />
              <Bone className="h-2.5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function QuickActionsSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <Bone className="mb-4 h-5 w-28" />
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Bone key={i} className="h-10 w-36 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="space-y-2">
        <Bone className="h-8 w-64" />
        <Bone className="h-4 w-48" />
      </div>

      <StatsCardsSkeleton />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <RecentProjectsSkeleton />
        <RecentActivitySkeleton />
      </div>

      <QuickActionsSkeleton />
    </div>
  )
}

/* ==================== PROJECTS ==================== */

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <Bone className="h-2 w-full rounded-t-xl" />
      <div className="space-y-4 p-5 pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Bone className="h-6 w-48" />
            <Bone className="h-4 w-16 rounded-full" />
          </div>
          <Bone className="h-6 w-6 rounded-md" />
        </div>
        <Bone className="h-10 w-full" />
        <div className="space-y-2">
          <div className="flex justify-between">
            <Bone className="h-3 w-16" />
            <Bone className="h-3 w-24" />
          </div>
          <Bone className="h-1.5 w-full rounded-full" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-6 w-16 rounded-md" />
          <Bone className="h-6 w-16 rounded-md" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border px-5 py-4">
        <div className="flex -space-x-1.5">
          {[1, 2, 3].map((i) => (
            <Bone key={i} className="h-7 w-7 rounded-full" />
          ))}
        </div>
        <Bone className="h-3 w-32" />
      </div>
    </div>
  )
}

export function ProjectGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Bone className="h-8 w-48" />
        <Bone className="h-10 w-36 rounded-lg" />
      </div>
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Bone className="h-10 w-64 rounded-lg" />
        <Bone className="h-10 w-32 rounded-lg" />
        <Bone className="h-10 w-10 rounded-lg" />
      </div>
      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

/* ==================== KANBAN BOARD ==================== */

function TaskCardSkeleton() {
  return (
    <div className="mb-2 space-y-3 rounded-md border border-border bg-card p-3">
      <Bone className="h-4 w-3/4" />
      <Bone className="h-3 w-full" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bone className="h-5 w-14 rounded-full" />
          <Bone className="h-5 w-20 rounded-sm" />
        </div>
        <Bone className="h-6 w-6 rounded-full" />
      </div>
    </div>
  )
}

function ColumnSkeleton() {
  return (
    <div className="w-80 flex-shrink-0 rounded-xl border bg-secondary/30">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Bone className="h-3 w-3 rounded-full" />
          <Bone className="h-5 w-24" />
          <Bone className="h-5 w-6 rounded-full" />
        </div>
        <Bone className="h-6 w-6 rounded-md" />
      </div>
      {/* Tasks */}
      <div className="space-y-2 px-2 pb-2 pt-1">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
      {/* Add button */}
      <div className="p-2 pt-0">
        <Bone className="h-9 w-full rounded-lg" />
      </div>
    </div>
  )
}

export function KanbanBoardSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Project Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Bone className="h-4 w-4 rounded-full" />
          <Bone className="h-7 w-48" />
          <Bone className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Bone className="h-8 w-8 rounded-lg" />
          <Bone className="h-8 w-8 rounded-lg" />
          <div className="flex -space-x-1.5">
            {[1, 2, 3].map((i) => (
              <Bone key={i} className="h-8 w-8 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      {/* Board */}
      <div className="flex flex-1 items-start gap-6 overflow-x-auto px-6 pb-4 pt-4">
        <ColumnSkeleton />
        <ColumnSkeleton />
        <ColumnSkeleton />
        <ColumnSkeleton />
      </div>
    </div>
  )
}

/* ==================== TEAM ==================== */

export function MemberCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-4">
      <Bone className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Bone className="h-4 w-32" />
        <Bone className="h-3 w-48" />
      </div>
      <Bone className="h-6 w-20 rounded-full" />
    </div>
  )
}

export function TeamPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Bone className="h-8 w-32" />
        <div className="flex gap-3">
          <Bone className="h-10 w-48 rounded-lg" />
          <Bone className="h-10 w-32 rounded-lg" />
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <Bone className="mb-2 h-8 w-12" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>
      {/* Member list */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <MemberCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

/* ==================== ANALYTICS ==================== */

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Bone className="h-8 w-32" />
          <Bone className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Bone className="h-10 w-52 rounded-lg" />
          <Bone className="h-10 w-40 rounded-lg" />
        </div>
      </div>
      {/* Stats */}
      <StatsCardsSkeleton />
      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6">
            <Bone className="mb-4 h-4 w-32" />
            <Bone className="h-[280px] w-full rounded-lg" />
          </div>
        ))}
      </div>
      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border bg-card p-6">
          <Bone className="h-4 w-40" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Bone className="h-8 w-8 rounded-full" />
              <Bone className="h-4 w-32 flex-1" />
              <Bone className="h-4 w-8" />
            </div>
          ))}
        </div>
        <div className="space-y-3 rounded-xl border border-border bg-card p-6">
          <Bone className="h-4 w-40" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 py-2">
              <Bone className="h-7 w-7 rounded-full" />
              <div className="flex-1 space-y-1">
                <Bone className="h-3.5 w-3/4" />
                <Bone className="h-2.5 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ==================== CALENDAR ==================== */

export function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Bone className="h-8 w-32" />
        <div className="flex gap-3">
          <Bone className="h-10 w-48 rounded-lg" />
          <Bone className="h-10 w-32 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        {/* Calendar grid */}
        <div className="rounded-xl border border-border bg-card p-5">
          {/* Toolbar */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bone className="h-9 w-16 rounded-full" />
              <Bone className="h-9 w-9 rounded-lg" />
              <Bone className="h-9 w-9 rounded-lg" />
            </div>
            <Bone className="h-6 w-40" />
            <div className="flex gap-1">
              <Bone className="h-9 w-16 rounded-lg" />
              <Bone className="h-9 w-16 rounded-lg" />
              <Bone className="h-9 w-16 rounded-lg" />
            </div>
          </div>
          {/* Grid */}
          <div className="grid grid-cols-7 gap-px">
            {/* Headers */}
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Bone key={`h-${i}`} className="h-8 w-full" />
            ))}
            {/* Cells */}
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-24 border border-border p-1">
                <Bone className="h-4 w-6" />
              </div>
            ))}
          </div>
        </div>
        {/* Sidebar */}
        <div className="space-y-4">
          <div className="space-y-3 rounded-xl border border-border bg-card p-5">
            <Bone className="h-4 w-40" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                <Bone className="h-3.5 w-3/4" />
                <Bone className="h-2.5 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==================== SETTINGS ==================== */

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Bone className="h-8 w-24" />
        <Bone className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        {/* Nav */}
        <div className="space-y-1 rounded-xl border border-border bg-card p-3">
          {[1, 2, 3, 4].map((i) => (
            <Bone key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        {/* Content */}
        <div className="space-y-6 rounded-xl border border-border bg-card p-6">
          <div className="space-y-1">
            <Bone className="h-6 w-24" />
            <Bone className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-4">
            <Bone className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Bone className="h-4 w-28" />
              <Bone className="h-3 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Bone className="h-4 w-20" />
              <Bone className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Bone className="h-4 w-20" />
              <Bone className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <Bone className="h-4 w-12" />
            <Bone className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Bone className="h-4 w-32" />
            <Bone className="h-10 w-72 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==================== ACTIVITY ==================== */

export function ActivityPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Bone className="h-8 w-24" />
        <Bone className="h-4 w-64" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Bone className="h-10 w-64 rounded-lg" />
        <Bone className="h-10 w-48 rounded-lg" />
        <Bone className="h-10 w-40 rounded-lg" />
      </div>
      <div className="space-y-6">
        {[1, 2].map((group) => (
          <div key={group} className="space-y-3">
            <Bone className="h-3 w-48" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-3">
                <Bone className="h-7 w-7 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Bone className="h-3.5 w-3/4" />
                  <Bone className="h-2.5 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
