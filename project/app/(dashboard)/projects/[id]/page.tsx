import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { getProjectById } from "@/lib/db/queries/projects"
import { getListsByProjectId } from "@/lib/db/queries/lists"

import { KanbanBoard } from "@/components/features/board/kanban-board"
import { ProjectHeaderClient } from "@/components/features/projects/project-header-client"

import { Metadata } from "next"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params

  try {
    const { dbUserId: userId } = await requireAuth()
    const project = await getProjectById(resolvedParams.id, userId)

    if (!project) {
      return {
        title: "Project Not Found",
      }
    }

    return {
      title: `${project.title} | FLOE.`,
      description: project.description || `Manage tasks and lists for ${project.title}.`,
    }
  } catch (error) {
    return {
      title: "Project",
    }
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const { dbUserId: userId } = await requireAuth()

  const project = await getProjectById(resolvedParams.id, userId)

  if (!project) {
    notFound()
  }

  const lists = await getListsByProjectId(project.id)

  const isAdmin = project.createdById === userId

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-background">
      {/* INTERACTIVE HEADER COMPONENT */}
      <ProjectHeaderClient project={project} currentUserId={userId} />

      {/* KANBAN BOARD */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6 pt-2">
        <KanbanBoard project={project} initialLists={lists} currentUserId={userId} />
      </div>
    </div>
  )
}
