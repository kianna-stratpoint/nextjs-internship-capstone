import { Kanban, Users, Calendar, BarChart3, Shield, Zap } from "lucide-react"

const features = [
  {
    icon: Kanban,
    title: "Kanban Boards",
    description:
      "Visualize your workflow with intuitive drag-and-drop Kanban boards that keep your team organized.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together seamlessly with real-time updates, comments, and task assignments.",
  },
  {
    icon: Calendar,
    title: "Timeline Management",
    description:
      "Track deadlines and milestones with integrated calendar views and due date reminders.",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Monitor project progress with detailed analytics and performance insights.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Enterprise-grade security ensures your project data stays safe and confidential.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized performance delivers instant updates and smooth user experience.",
  },
]

export function Features() {
  return (
    <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-outer_space-500 dark:text-platinum-500">
            Everything You Need to Succeed
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-payne's_gray-500 dark:text-french_gray-500">
            Powerful features designed to help teams collaborate effectively and deliver projects on
            time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border border-french_gray-300 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:border-payne's_gray-400 dark:bg-outer_space-400"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue_munsell-100 dark:bg-blue_munsell-900">
                <feature.icon className="text-blue_munsell-500" size={24} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-outer_space-500 dark:text-platinum-500">
                {feature.title}
              </h3>
              <p className="text-payne's_gray-500 dark:text-french_gray-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
