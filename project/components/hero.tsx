import Link from "next/link"
import { ArrowRight, CheckCircle, Users, Zap } from "lucide-react"

export function Hero() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="container mx-auto text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-5xl font-bold text-outer_space-500 dark:text-platinum-500 md:text-6xl">
            Streamline Your
            <span className="text-blue_munsell-500"> Project Management</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-xl text-payne's_gray-500 dark:text-french_gray-500">
            Organize tasks, collaborate with your team, and deliver projects on time with our
            intuitive Kanban-style project management platform.
          </p>

          <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-lg bg-blue_munsell-500 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue_munsell-600"
            >
              Start Free Trial
              <ArrowRight className="ml-2" size={20} />
            </Link>

            <button className="inline-flex items-center rounded-lg border-2 border-blue_munsell-500 px-8 py-4 text-lg font-semibold text-blue_munsell-500 transition-colors hover:bg-blue_munsell-50 dark:hover:bg-blue_munsell-900">
              Watch Demo
            </button>
          </div>

          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex items-center justify-center space-x-2 text-outer_space-500 dark:text-platinum-500">
              <CheckCircle className="text-blue_munsell-500" size={20} />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-outer_space-500 dark:text-platinum-500">
              <Users className="text-blue_munsell-500" size={20} />
              <span>Team Collaboration</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-outer_space-500 dark:text-platinum-500">
              <Zap className="text-blue_munsell-500" size={20} />
              <span>Real-time Updates</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
