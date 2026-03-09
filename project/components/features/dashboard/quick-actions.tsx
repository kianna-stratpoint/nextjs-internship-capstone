import { Plus, UserPlus, ClipboardList } from "lucide-react"
import { CreateProjectButton } from "@/components/features/projects/create-project-button"

export function QuickActions() {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Quick Actions
        </h2>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Create New Project — primary dark CTA */}
        <CreateProjectButton className="group flex w-full items-center gap-4 rounded-xl bg-primary p-5 text-left text-primary-foreground transition-colors hover:bg-primary/90">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
            <Plus size={20} />
          </div>
          <div>
            <p className="font-display text-sm font-semibold">Create New Project</p>
            <p className="text-xs opacity-60">Set up new project and invite your team</p>
          </div>
        </CreateProjectButton>

        {/* Add Team Member */}
        <button className="group flex items-center gap-4 rounded-xl border border-border p-5 text-left transition-colors hover:bg-accent/50">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <UserPlus size={20} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-foreground">Add Team Member</p>
            <p className="text-xs text-muted-foreground">Invite someone to your workspace</p>
          </div>
        </button>

        {/* Create Task */}
        <button className="group flex items-center gap-4 rounded-xl border border-border p-5 text-left transition-colors hover:bg-accent/50">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <ClipboardList size={20} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-foreground">Create Task</p>
            <p className="text-xs text-muted-foreground">Add a task directly to any project</p>
          </div>
        </button>
      </div>
    </div>
  )
}
