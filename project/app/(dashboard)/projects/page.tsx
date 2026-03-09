import { FolderKanban } from "lucide-react"
import { requireAuth } from "@/lib/auth"
import { getProjectsByUserId } from "@/lib/db/queries/projects"
import { ProjectsClient } from "./projects-client"
import { CreateProjectButton } from "@/components/features/projects/create-project-button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Projects | FLOE.",
  description: "Manage and organize your team projects",
}

export default async function ProjectsPage() {
  const { dbUserId: userId } = await requireAuth()

  const projects = await getProjectsByUserId(userId)

  const pinnedCount = projects.filter((p) => p.isPinned).length
  const totalCount = projects.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="mt-2 text-sm text-foreground">
            {totalCount} projects | {pinnedCount} pinned
          </p>
        </div>

        {/* Replaced static button with our working CreateProjectButton */}
        <CreateProjectButton />
      </div>

      {/* Empty State vs Real Data */}
      {totalCount === 0 ? (
        <div className="border-french_gray-300 dark:border-payne's_gray-400 dark:bg-outer_space-500 flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-20">
          <FolderKanban className="text-payne's_gray-400 mb-4 h-12 w-12" />
          <h3 className="text-lg font-medium text-foreground">No projects yet</h3>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">
            Get started by creating your first project.
          </p>
          <CreateProjectButton />
        </div>
      ) : (
        /* Client Component handles the search, filter, and mapped cards */
        <ProjectsClient initialProjects={projects} />
      )}
    </div>
  )
}
