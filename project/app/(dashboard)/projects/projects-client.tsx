"use client"

import { useState } from "react"
import { Search, Filter } from "lucide-react"
// Import your ProjectCard component here!
// import { ProjectCard } from "@/components/features/projects/project-card"

type ProjectData = any // Replace with your inferred Project type from schema

export function ProjectsClient({ initialProjects }: { initialProjects: ProjectData[] }) {
  const [searchQuery, setSearchQuery] = useState("")

  // Basic client-side filtering (Task 4.6 implementation will expand on this)
  const filteredProjects = initialProjects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pinnedProjects = filteredProjects.filter((p) => p.isPinned)
  const otherProjects = filteredProjects.filter((p) => !p.isPinned)

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="text-payne's_gray-500 absolute left-3 top-1/2 -translate-y-1/2 transform"
            size={16}
          />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-french_gray-300 focus:ring-blue_munsell-500 dark:border-payne's_gray-400 dark:bg-outer_space-500 w-full rounded-lg border bg-white py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
          />
        </div>
        <button className="border-french_gray-300 hover:bg-platinum-500 dark:border-payne's_gray-400 inline-flex items-center rounded-lg border px-4 py-2">
          <Filter size={16} className="mr-2" />
          Filter
        </button>
      </div>

      {pinnedProjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-outer_space-500 dark:text-platinum-500 text-lg font-semibold">
            Pinned Projects
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Map over pinnedProjects using your ProjectCard */}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-outer_space-500 dark:text-platinum-500 text-lg font-semibold">
          All Projects
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Map over otherProjects using your ProjectCard */}
          {otherProjects.map((project) => (
            <div
              key={project.id}
              className="dark:bg-outer_space-500 rounded-lg border bg-white p-4"
            >
              <h3 className="font-bold">{project.title}</h3>
              {/* Integrate full ProjectCard UI here */}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
