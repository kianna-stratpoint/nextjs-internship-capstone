import { TrendingUp, Users, CheckCircle, Clock } from "lucide-react"

const stats = [
  {
    name: "Active Projects",
    value: "12",
    change: "+2.5%",
    changeType: "positive",
    icon: TrendingUp,
  },
  {
    name: "Team Members",
    value: "24",
    change: "+4.1%",
    changeType: "positive",
    icon: Users,
  },
  {
    name: "Completed Tasks",
    value: "156",
    change: "+12.3%",
    changeType: "positive",
    icon: CheckCircle,
  },
  {
    name: "Pending Tasks",
    value: "43",
    change: "-2.1%",
    changeType: "negative",
    icon: Clock,
  },
]

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="overflow-hidden rounded-lg border border-french_gray-300 bg-white p-6 dark:border-payne's_gray-400 dark:bg-outer_space-500"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue_munsell-100 dark:bg-blue_munsell-900">
                <stat.icon className="text-blue_munsell-500" size={20} />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-payne's_gray-500 dark:text-french_gray-400">
                  {stat.name}
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-outer_space-500 dark:text-platinum-500">
                    {stat.value}
                  </div>
                  <div
                    className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stat.changeType === "positive"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {stat.change}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
