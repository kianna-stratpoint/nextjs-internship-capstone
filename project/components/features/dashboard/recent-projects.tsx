import Link from "next/link"
import { requireAuth } from "@/lib/auth"
import { getRecentProjects } from "@/lib/db/queries/dashboard"
import { UserAvatar, StackedAvatars } from "@/components/shared/user-avatar"
import { timeAgo } from "@/lib/utils"

export async function RecentProjects() {
  const { dbUserId: userId } = await requireAuth()
  const projects = await getRecentProjects(userId)

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Recent Projects</h2>

        <Link
          href="/projects"
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          View All
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent projects.</p>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const progress =
              project._count.tasks === 0
                ? 0
                : Math.round((project._count.completedTasks / project._count.tasks) * 100)

            const priorityStyles = {
              high: "bg-red-500/10 text-red-600 dark:text-red-400",
              medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              low: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
            }

            const statusStyles = {
              active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              completed: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
            }

            return (
              <Link
                href={`/projects/${project.id}`}
                key={project.id}
                className="group flex flex-col gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Left Side: Color, Title, Updated */}
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: project.color || "#2D6EF7" }}
                  />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{project.title}</h3>
                    <p className="text-xs text-muted-foreground">{timeAgo(project.updatedAt)}</p>
                  </div>
                </div>

                {/* Right Side: Progress, Badges, Members */}
                <div className="flex items-center gap-6">
                  {/* Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: project.color || "#2D6EF7",
                          width: `${progress}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-medium text-foreground">
                      {progress}%
                    </span>
                  </div>

                  {/* Status & Priority Badges (Hidden on tiny screens) */}
                  <div className="hidden items-center gap-2 md:flex">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${statusStyles[project.status as keyof typeof statusStyles] || statusStyles.active}`}
                    >
                      {project.status === "active" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                      {project.status}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${priorityStyles[project.priority as keyof typeof priorityStyles] || priorityStyles.medium}`}
                    >
                      {project.priority}
                    </span>
                  </div>

                  {/* Member Avatars (Hidden on small screens) */}
                  <div className="hidden lg:flex">
                    <StackedAvatars
                      users={project.members.map((m: any) => ({ user: m.user }))}
                      max={4}
                      size="sm"
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
