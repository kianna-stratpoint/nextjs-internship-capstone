import { Calendar, Users, Settings, MoreHorizontal } from "lucide-react"

export function ProjectHeader({ projectId }: { projectId: string }) {
  return (
    <div className="rounded-lg border border-french_gray-300 bg-white p-6 dark:border-payne's_gray-400 dark:bg-outer_space-500">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center space-x-3">
            <div className="h-3 w-3 rounded-full bg-blue_munsell-500" />
            <h1 className="text-2xl font-bold text-outer_space-500 dark:text-platinum-500">
              Website Redesign
            </h1>
          </div>

          <p className="mb-4 text-payne's_gray-500 dark:text-french_gray-400">
            Complete overhaul of company website with modern design and improved user experience
          </p>

          <div className="flex items-center space-x-6 text-sm text-payne's_gray-500 dark:text-french_gray-400">
            <div className="flex items-center">
              <Users size={16} className="mr-2" />5 members
            </div>
            <div className="flex items-center">
              <Calendar size={16} className="mr-2" />
              Due Feb 15, 2024
            </div>
            <div className="flex items-center">
              <div className="mr-2 h-2 w-2 rounded-full bg-green-500" />
              75% complete
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="rounded-lg p-2 transition-colors hover:bg-platinum-500 dark:hover:bg-payne's_gray-400">
            <Settings size={20} />
          </button>
          <button className="rounded-lg p-2 transition-colors hover:bg-platinum-500 dark:hover:bg-payne's_gray-400">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
