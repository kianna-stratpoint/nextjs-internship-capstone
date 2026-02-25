import { CheckCircle, Clock, AlertCircle, Users } from "lucide-react"

const taskStats = [
  {
    label: "Completed",
    count: 24,
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900",
  },
  {
    label: "In Progress",
    count: 18,
    icon: Clock,
    color: "text-blue_munsell-500",
    bgColor: "bg-blue_munsell-100 dark:bg-blue_munsell-900",
  },
  {
    label: "Overdue",
    count: 3,
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900",
  },
  {
    label: "Assigned to Me",
    count: 12,
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900",
  },
]

export function TaskOverview() {
  return (
    <div className="rounded-lg border border-french_gray-300 bg-white p-6 dark:border-payne's_gray-400 dark:bg-outer_space-500">
      <h3 className="mb-6 text-lg font-semibold text-outer_space-500 dark:text-platinum-500">
        Task Overview
      </h3>

      <div className="space-y-4">
        {taskStats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between rounded-lg border border-french_gray-300 p-3 dark:border-payne's_gray-400"
          >
            <div className="flex items-center space-x-3">
              <div
                className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}
              >
                <stat.icon className={stat.color} size={20} />
              </div>
              <span className="font-medium text-outer_space-500 dark:text-platinum-500">
                {stat.label}
              </span>
            </div>
            <span className="text-2xl font-bold text-outer_space-500 dark:text-platinum-500">
              {stat.count}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-french_gray-300 pt-4 dark:border-payne's_gray-400">
        <div className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
          <span className="font-medium">Productivity:</span> 89% completion rate this week
        </div>
      </div>
    </div>
  )
}
