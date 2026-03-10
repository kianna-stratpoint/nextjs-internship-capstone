import { FolderKanban } from "lucide-react"
import type { Metadata } from "next"
import { requireAuth } from "@/lib/auth"
import { getProjectsByUserId } from "@/lib/db/queries/projects"

// Components
import { CreateProjectButton } from "@/components/features/projects/create-project-button"
import { ProjectsToolbar } from "@/components/features/projects/projects-toolbar"
import { ProjectCard } from "@/components/features/projects/project-card"

export const metadata: Metadata = {
  title: "Projects | FLOE.",
  description: "Manage and organize your team projects",
}

// Next.js 15 requires searchParams to be a Promise
interface ProjectsPageProps {
  searchParams: Promise<{
    query?: string
    sort?: string
    view?: string
  }>
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { dbUserId: userId } = await requireAuth()

  // 1. AWAIT the searchParams (Next.js 15 Fix)
  const resolvedParams = await searchParams

  // 2. Fetch data (The database query now handles ALL filtering and sorting!)
  const processedProjects = await getProjectsByUserId(userId, {
    query: resolvedParams.query,
    sort: resolvedParams.sort,
    view: resolvedParams.view,
  })

  // 3. Extract UI values
  const query = resolvedParams.query || ""
  const view = resolvedParams.view || "active"
  const viewTotalCount = processedProjects.length

  // 4. Split for rendering (Since the DB already sorted them, we just separate pinned vs unpinned)
  const pinnedProjects = view === "active" ? processedProjects.filter((p) => p.isPinned) : []
  const otherProjects =
    view === "active" ? processedProjects.filter((p) => !p.isPinned) : processedProjects

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold capitalize text-foreground">
            {view === "archived" ? "Archived Projects" : "Projects"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {viewTotalCount} {view === "archived" ? "archived" : "active"} projects
            {view === "active" && ` | ${pinnedProjects.length} pinned`}
          </p>
        </div>
        <CreateProjectButton />
      </div>

      {/* 🚨 MOVED TOOLBAR HERE: It will now always render 🚨 */}
      <ProjectsToolbar />

      {/* Check if user has ZERO projects entirely (no active and no archived) */}
      {viewTotalCount === 0 && view === "active" && !query ? (
        <ProjectsEmptyState />
      ) : (
        <>
          {/* Empty state for specific filters/views */}
          {processedProjects.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
              <p className="text-sm font-medium text-foreground">No projects found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {query
                  ? `No ${view} projects match your search "${query}".`
                  : `You don't have any ${view} projects right now.`}
              </p>
            </div>
          )}

          {/* Pinned Projects Section */}
          {pinnedProjects.length > 0 && view === "active" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Pinned Projects</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pinnedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}

          {/* All/Remaining Projects Section */}
          {otherProjects.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                {view === "archived" ? "Archived" : pinnedProjects.length > 0 ? "All Projects" : ""}
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {otherProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ProjectsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-20 text-card-foreground shadow-sm">
      <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="text-lg font-medium text-foreground">No projects yet</h3>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Get started by creating your first project.
      </p>
      <CreateProjectButton />
    </div>
  )
}
