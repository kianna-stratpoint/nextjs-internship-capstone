"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { FolderKanban, Loader2, AlertCircle } from "lucide-react"

import { useProjects } from "@/hooks/use-projects"
import { ProjectCard } from "./project-card"
import { CreateProjectButton } from "./create-project-button"
import type { ProjectCardData } from "@/types/index"

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

export function ProjectList() {
  const searchParams = useSearchParams()

  const query = searchParams.get("query")?.toLowerCase() || ""
  const view = searchParams.get("view") || "active"
  const sortBy = searchParams.get("sortBy") || "updatedAt"
  const sortDir = searchParams.get("sortDir") || "desc"

  const priorityParam = searchParams.get("priority")
  const statusParam = searchParams.get("status")
  const isOverdue = searchParams.get("overdue") === "true"
  const isPinnedOnly = searchParams.get("pinned") === "true"

  const { projects, isLoading, isError, error } = useProjects({ view })

  // --- FILTER & SORT LOGIC ---
  const { pinnedProjects, otherProjects, totalFiltered } = useMemo(() => {
    if (!projects) return { pinnedProjects: [], otherProjects: [], totalFiltered: 0 }

    const now = new Date()

    const priorities = priorityParam ? priorityParam.split(",") : []
    const statuses = statusParam ? statusParam.split(",") : []

    // FILTER
    let filtered = projects.filter((p: ProjectCardData) => {
      // Search query
      if (query && !p.title.toLowerCase().includes(query)) return false

      // View (active/archived)
      if (view === "archived" && !p.isArchived) return false
      if (view === "active" && p.isArchived) return false

      if (view === "active" && p.status !== "active") return false
      if (view === "completed" && p.status !== "completed") return false

      // Priority checkboxes
      if (priorities.length > 0 && !priorities.includes(p.priority)) return false

      // Status checkboxes
      if (statuses.length > 0 && !statuses.includes(p.status)) return false

      // Quick Filters
      if (isPinnedOnly && !p.isPinned) return false
      if (isOverdue) {
        if (!p.dueDate || p.status !== "active") return false
        if (new Date(p.dueDate) >= now) return false
      }

      return true
    })

    // SORT
    filtered = filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        case "priority":
          const pA = PRIORITY_ORDER[a.priority as string] ?? 99
          const pB = PRIORITY_ORDER[b.priority as string] ?? 99
          comparison = pA - pB
          break
        case "progress":
          const getProgress = (p: ProjectCardData) => {
            const tasks = p._count?.tasks ?? 0
            const completed = p._count?.completedTasks ?? 0
            return tasks > 0 ? completed / tasks : 0
          }
          comparison = getProgress(a) - getProgress(b)
          break
        case "dueDate":
          if (!a.dueDate) return sortDir === "asc" ? 1 : -1
          if (!b.dueDate) return sortDir === "asc" ? -1 : 1
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          break
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "updatedAt":
        default:
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
      }

      return sortDir === "desc" ? -comparison : comparison
    })

    if (view === "active" && !isPinnedOnly) {
      return {
        pinnedProjects: filtered.filter((p) => p.isPinned),
        otherProjects: filtered.filter((p) => !p.isPinned),
        totalFiltered: filtered.length,
      }
    }

    return {
      pinnedProjects: [],
      otherProjects: filtered,
      totalFiltered: filtered.length,
    }
  }, [projects, query, view, sortBy, sortDir, priorityParam, statusParam, isOverdue, isPinnedOnly])

  // --- STATES ---
  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50/50 py-20 text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
        <AlertCircle className="mb-4 h-12 w-12 opacity-50" />
        <h3 className="text-lg font-medium">Failed to load projects</h3>
        <p className="mt-1 text-sm opacity-80">
          {error instanceof Error ? error.message : "Something went wrong. Please try again."}
        </p>
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
        <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium text-foreground">No projects yet</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Get started by creating your first project.
        </p>
        <CreateProjectButton />
      </div>
    )
  }

  if (totalFiltered === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium text-foreground">No projects found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {query
            ? `No ${view} projects match your search "${query}".`
            : `You don't have any ${view} projects right now.`}
        </p>
      </div>
    )
  }

  // --- RENDER ---
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mt-0 flex items-center justify-between gap-3">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {totalFiltered} {view} projects
          {view === "active" && pinnedProjects.length > 0 && ` ● ${pinnedProjects.length} pinned`}
        </p>
        <div className="h-px flex-1 bg-border" />
      </header>

      {pinnedProjects.length > 0 && (
        <section>
          <h2 className="mb-4 font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pinned Projects
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pinnedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}

      {otherProjects.length > 0 && (
        <section>
          {pinnedProjects.length > 0 && (
            <h2 className="mb-4 font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Other Projects
            </h2>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {otherProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
