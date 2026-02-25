import Link from "next/link"
import { ArrowRight, CheckCircle, Users, Kanban } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-platinum-900 to-platinum-800 dark:from-outer_space-500 dark:to-payne's_gray-500">
      {/* Header */}
      <header className="border-b border-french_gray-300 bg-white/80 backdrop-blur-sm dark:border-payne's_gray-400 dark:bg-outer_space-500/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="text-2xl font-bold text-blue_munsell-500">ProjectFlow</div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link
                href="/dashboard"
                className="text-outer_space-500 hover:text-blue_munsell-500 dark:text-platinum-500"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="text-outer_space-500 hover:text-blue_munsell-500 dark:text-platinum-500"
              >
                Projects
              </Link>
              <Link
                href="/sign-in"
                className="text-outer_space-500 hover:text-blue_munsell-500 dark:text-platinum-500"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-blue_munsell-500 px-4 py-2 text-white hover:bg-blue_munsell-600"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <h1 className="mb-6 text-5xl font-bold text-outer_space-500 dark:text-platinum-500 md:text-6xl">
            Manage Projects with
            <span className="text-blue_munsell-500"> Kanban Boards</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-xl text-payne's_gray-500 dark:text-french_gray-500">
            Organize tasks, collaborate with teams, and track progress with our intuitive
            drag-and-drop project management platform.
          </p>

          <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-lg bg-blue_munsell-500 px-8 py-4 text-lg font-semibold text-white hover:bg-blue_munsell-600"
            >
              Start Managing Projects
              <ArrowRight className="ml-2" size={20} />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center rounded-lg border-2 border-blue_munsell-500 px-8 py-4 text-lg font-semibold text-blue_munsell-500 hover:bg-blue_munsell-50 dark:hover:bg-blue_munsell-900"
            >
              View Projects
            </Link>
          </div>

          {/* Feature highlights */}
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex items-center justify-center space-x-2 text-outer_space-500 dark:text-platinum-500">
              <Kanban className="text-blue_munsell-500" size={20} />
              <span>Drag & Drop Boards</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-outer_space-500 dark:text-platinum-500">
              <Users className="text-blue_munsell-500" size={20} />
              <span>Team Collaboration</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-outer_space-500 dark:text-platinum-500">
              <CheckCircle className="text-blue_munsell-500" size={20} />
              <span>Task Management</span>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Demo Section */}
      <section className="bg-white/50 px-4 py-16 dark:bg-outer_space-400/50 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <h2 className="mb-8 text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
            🚀 Navigate the Mock Site
          </h2>
          <p className="mb-8 text-lg text-payne's_gray-500 dark:text-french_gray-500">
            All pages are accessible without authentication for development purposes
          </p>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboard"
              className="rounded-lg border border-french_gray-300 bg-white p-4 transition-shadow hover:shadow-lg dark:border-payne's_gray-400 dark:bg-outer_space-500"
            >
              <h3 className="mb-2 font-semibold text-outer_space-500 dark:text-platinum-500">
                Dashboard
              </h3>
              <p className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
                Main dashboard view
              </p>
            </Link>

            <Link
              href="/projects"
              className="rounded-lg border border-french_gray-300 bg-white p-4 transition-shadow hover:shadow-lg dark:border-payne's_gray-400 dark:bg-outer_space-500"
            >
              <h3 className="mb-2 font-semibold text-outer_space-500 dark:text-platinum-500">
                Projects
              </h3>
              <p className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
                Projects listing page
              </p>
            </Link>

            <Link
              href="/projects/1"
              className="rounded-lg border border-french_gray-300 bg-white p-4 transition-shadow hover:shadow-lg dark:border-payne's_gray-400 dark:bg-outer_space-500"
            >
              <h3 className="mb-2 font-semibold text-outer_space-500 dark:text-platinum-500">
                Kanban Board
              </h3>
              <p className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
                Project board view
              </p>
            </Link>

            <Link
              href="/sign-in"
              className="rounded-lg border border-french_gray-300 bg-white p-4 transition-shadow hover:shadow-lg dark:border-payne's_gray-400 dark:bg-outer_space-500"
            >
              <h3 className="mb-2 font-semibold text-outer_space-500 dark:text-platinum-500">
                Auth Pages
              </h3>
              <p className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
                Sign in/up placeholders
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Task Implementation Status */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
            Implementation Roadmap
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { phase: "1.0", title: "Project Setup", status: "pending", tasks: 6 },
              { phase: "2.0", title: "Authentication", status: "pending", tasks: 6 },
              { phase: "3.0", title: "Database Setup", status: "pending", tasks: 6 },
              { phase: "4.0", title: "Core Features", status: "pending", tasks: 6 },
              { phase: "5.0", title: "Kanban Board", status: "pending", tasks: 6 },
              { phase: "6.0", title: "Advanced Features", status: "pending", tasks: 6 },
              { phase: "7.0", title: "Testing", status: "pending", tasks: 6 },
              { phase: "8.0", title: "Deployment", status: "pending", tasks: 6 },
            ].map((item) => (
              <div
                key={item.phase}
                className="rounded-lg border border-french_gray-300 bg-white p-6 dark:border-payne's_gray-400 dark:bg-outer_space-500"
              >
                <div className="mb-2 text-sm font-semibold text-blue_munsell-500">
                  Phase {item.phase}
                </div>
                <h3 className="mb-2 font-semibold text-outer_space-500 dark:text-platinum-500">
                  {item.title}
                </h3>
                <div className="mb-3 text-sm text-payne's_gray-500 dark:text-french_gray-400">
                  {item.tasks} tasks
                </div>
                <div className="flex items-center">
                  <div className="mr-2 h-2 w-2 rounded-full bg-yellow-500"></div>
                  <span className="text-sm capitalize text-payne's_gray-500 dark:text-french_gray-400">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
