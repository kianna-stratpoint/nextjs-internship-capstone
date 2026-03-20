"use client"

import dynamic from "next/dynamic"

const ProjectHeader = dynamic(
  () => import("@/components/features/projects/project-header").then((mod) => mod.ProjectHeader),
  { ssr: false }
)

export function ProjectHeaderClient(props: any) {
  return <ProjectHeader {...props} />
}
