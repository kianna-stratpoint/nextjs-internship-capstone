import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react"

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
            Calendar
          </h1>
          <p className="mt-2 text-payne's_gray-500 dark:text-french_gray-500">
            View project deadlines and team schedules
          </p>
        </div>
        <button className="inline-flex items-center rounded-lg bg-blue_munsell-500 px-4 py-2 text-white transition-colors hover:bg-blue_munsell-600">
          <Plus size={20} className="mr-2" />
          Add Event
        </button>
      </div>

      {/* Implementation Tasks Banner */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
        <h3 className="mb-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
          📅 Calendar Implementation Tasks
        </h3>
        <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
          <li>• Task 6.2: Add task due dates, priorities, and labels</li>
          <li>• Task 6.6: Add bulk task operations and keyboard shortcuts</li>
        </ul>
      </div>

      {/* Calendar Header */}
      <div className="rounded-lg border border-french_gray-300 bg-white p-6 dark:border-payne's_gray-400 dark:bg-outer_space-500">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="rounded-lg p-2 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold text-outer_space-500 dark:text-platinum-500">
              December 2024
            </h2>
            <button className="rounded-lg p-2 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex space-x-2">
            <button className="rounded bg-blue_munsell-100 px-3 py-1 text-sm text-blue_munsell-700 dark:bg-blue_munsell-900 dark:text-blue_munsell-300">
              Month
            </button>
            <button className="rounded px-3 py-1 text-sm text-payne's_gray-500 hover:bg-platinum-500 dark:text-french_gray-400 dark:hover:bg-payne's_gray-400">
              Week
            </button>
            <button className="rounded px-3 py-1 text-sm text-payne's_gray-500 hover:bg-platinum-500 dark:text-french_gray-400 dark:hover:bg-payne's_gray-400">
              Day
            </button>
          </div>
        </div>

        {/* Calendar Grid Placeholder */}
        <div className="flex h-96 items-center justify-center rounded-lg bg-platinum-800 dark:bg-outer_space-400">
          <div className="text-center text-payne's_gray-500 dark:text-french_gray-400">
            <Calendar size={48} className="mx-auto mb-2" />
            <p>Calendar Component Placeholder</p>
            <p className="text-sm">TODO: Implement with react-big-calendar or similar</p>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="rounded-lg border border-french_gray-300 bg-white p-6 dark:border-payne's_gray-400 dark:bg-outer_space-500">
        <h3 className="mb-4 text-lg font-semibold text-outer_space-500 dark:text-platinum-500">
          Upcoming Deadlines
        </h3>
        <div className="space-y-3">
          {[
            { title: "Website Redesign", date: "Dec 15, 2024", type: "Project Deadline" },
            { title: "Team Meeting", date: "Dec 18, 2024", type: "Meeting" },
            { title: "Mobile App Launch", date: "Dec 22, 2024", type: "Milestone" },
          ].map((event, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg bg-platinum-800 p-3 dark:bg-outer_space-400"
            >
              <div>
                <div className="font-medium text-outer_space-500 dark:text-platinum-500">
                  {event.title}
                </div>
                <div className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
                  {event.type}
                </div>
              </div>
              <div className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
                {event.date}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
