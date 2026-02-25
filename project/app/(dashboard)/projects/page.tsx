import { Plus, Search, Filter } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function ProjectsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
              Projects
            </h1>
            <p className="mt-2 text-payne's_gray-500 dark:text-french_gray-500">
              Manage and organize your team projects
            </p>
          </div>
          <button className="inline-flex items-center rounded-lg bg-blue_munsell-500 px-4 py-2 text-white transition-colors hover:bg-blue_munsell-600">
            <Plus size={20} className="mr-2" />
            New Project
          </button>
        </div>

        {/* Implementation Tasks Banner */}
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <h3 className="mb-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
            📋 Projects Page Implementation Tasks
          </h3>
          <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
            <li>• Task 4.1: Implement project CRUD operations</li>
            <li>• Task 4.2: Create project listing and dashboard interface</li>
            <li>• Task 4.5: Design and implement project cards and layouts</li>
            <li>• Task 4.6: Add project and task search/filtering capabilities</li>
          </ul>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 transform text-payne's_gray-500 dark:text-french_gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full rounded-lg border border-french_gray-300 bg-white py-2 pl-10 pr-4 text-outer_space-500 placeholder-payne's_gray-500 focus:outline-none focus:ring-2 focus:ring-blue_munsell-500 dark:border-payne's_gray-400 dark:bg-outer_space-500 dark:text-platinum-500 dark:placeholder-french_gray-400"
            />
          </div>
          <button className="inline-flex items-center rounded-lg border border-french_gray-300 px-4 py-2 text-outer_space-500 transition-colors hover:bg-platinum-500 dark:border-payne's_gray-400 dark:text-platinum-500 dark:hover:bg-payne's_gray-400">
            <Filter size={16} className="mr-2" />
            Filter
          </button>
        </div>

        {/* Projects Grid Placeholder */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => {
            //Math.random fix: Create deterministic values based on the index 'i'
            // This satisfies the purity rule because it doesn't change on re-render
            const daysLeft = (i * 7) % 30 || 1
            const members = (i % 5) + 2
            const tasks = i * 3 + 5
            const progress = 20 + ((i * 12) % 61)
            return (
              <div
                key={i}
                className="rounded-lg border border-french_gray-300 bg-white p-6 transition-shadow hover:shadow-lg dark:border-payne's_gray-400 dark:bg-outer_space-500"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="h-3 w-3 rounded-full bg-blue_munsell-500"></div>
                  <div className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
                    {daysLeft} days left
                  </div>
                </div>

                <h3 className="mb-2 text-lg font-semibold text-outer_space-500 dark:text-platinum-500">
                  Sample Project {i}
                </h3>

                <p className="mb-4 text-sm text-payne's_gray-500 dark:text-french_gray-400">
                  This is a placeholder project description that will be replaced with actual
                  project data.
                </p>

                <div className="mb-4 flex items-center justify-between text-sm text-payne's_gray-500 dark:text-french_gray-400">
                  <span>{members} members</span>
                  <span>{tasks} tasks</span>
                </div>

                <div className="h-2 w-full rounded-full bg-french_gray-300 dark:bg-payne's_gray-400">
                  <div
                    className="h-2 rounded-full bg-blue_munsell-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Component Placeholders */}
        <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 dark:border-gray-600 dark:bg-gray-800/50">
          <h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
            📁 Components to Implement
          </h3>
          <div className="grid grid-cols-1 gap-4 text-sm text-gray-600 dark:text-gray-400 md:grid-cols-2">
            <div>
              <strong>components/project-card.tsx</strong>
              <p>Project display component with progress, members, and actions</p>
            </div>
            <div>
              <strong>components/modals/create-project-modal.tsx</strong>
              <p>Modal for creating new projects with form validation</p>
            </div>
            <div>
              <strong>hooks/use-projects.ts</strong>
              <p>Custom hook for project data fetching and mutations</p>
            </div>
            <div>
              <strong>lib/db/schema.ts</strong>
              <p>Database schema for projects, lists, and tasks</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
