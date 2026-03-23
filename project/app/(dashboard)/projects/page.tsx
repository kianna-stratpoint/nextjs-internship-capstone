import type { Metadata } from "next"
import { CreateProjectButton } from "@/components/features/projects/create-project-button"
import { ProjectsToolbar } from "@/components/features/projects/projects-toolbar"
import { ProjectList } from "@/components/features/projects/project-list"

export const metadata: Metadata = {
  title: "Projects | FLOE.",
  description: "Manage and organize your team projects",
}

interface ProjectsPageProps {
  searchParams: Promise<{
    query?: string
    sort?: string
    view?: string
  }>
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const resolvedParams = await searchParams

  const currentView = resolvedParams.view || "active"

  let pageTitle = "Active Projects"
  if (currentView === "completed") {
    pageTitle = "Completed Projects"
  } else if (currentView === "archived") {
    pageTitle = "Archived Projects"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold capitalize text-foreground">{pageTitle}</h1>
        </div>
        <CreateProjectButton />
      </div>

      <ProjectsToolbar />
      <ProjectList />
    </div>
  )
}
