// TODO: Task 4.5 - Design and implement project cards and layouts

/*
TODO: Implementation Notes for Interns:

This component should display:
- Project name and description
- Progress indicator
- Team member count
- Due date
- Status badge
- Actions menu (edit, delete, etc.)

Props interface:
interface ProjectCardProps {
  project: {
    id: string
    name: string
    description?: string
    progress: number
    memberCount: number
    dueDate?: Date
    status: 'active' | 'completed' | 'on-hold'
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

Features to implement:
- Hover effects
- Click to navigate to project board
- Responsive design
- Loading states
- Error states
*/

"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  MoreHorizontal,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Pin,
  Link as LinkIcon,
  Edit,
  Archive,
  Trash2,
  LayoutDashboard,
  Clock,
  Loader2,
  Lock,
  Globe,
  Upload,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { type ProjectCardData } from "@/types/index"
import { useProjects } from "@/hooks/use-projects"
import { useToast } from "@/hooks/use-toast"
import { useUIStore } from "@/stores/ui-store"

// Server Actions
import {
  togglePinProjectAction,
  setProjectStatusAction,
  deleteProjectAction,
  archiveProjectAction,
} from "@/lib/actions/projects" // Adjusted to your actions path

// --- Helpers ---

function getInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.[0] || ""
  const last = lastName?.[0] || ""
  return (first + last).toUpperCase() || "U"
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

type ProjectCardProps = {
  project: ProjectCardData & { memberRole?: string }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { toast } = useToast()

  const [isPending, startTransition] = useTransition()
  const { openEditProjectModal } = useUIStore()
  const { deleteProject, isDeleting } = useProjects()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // RBAC Check
  const isAdmin = project.memberRole === "admin"

  // --- Handlers for Server Actions ---

  const handleTogglePin = () => {
    startTransition(async () => {
      await togglePinProjectAction(project.id, project.isPinned)
    })
  }

  const handleToggleStatus = () => {
    startTransition(async () => {
      const newStatus = project.status === "completed" ? "active" : "completed"
      await setProjectStatusAction(project.id, newStatus)

      toast({
        title: "Status updated!",
        description: "The Project Status has been updated.",
      })
    })
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/projects/${project.id}`
    navigator.clipboard.writeText(url)

    toast({
      title: "Link copied!",
      description: "Project link has been copied to your clipboard.",
    })
  }

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()

    try {
      await deleteProject(project.id)
      setShowDeleteDialog(false)

      toast({
        title: "Project deleted",
        description: "The project has been permanently removed.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete project",
        description: error?.error || "An unexpected error occurred. Please try again.",
      })
    }
  }

  // --- Computed UI Data ---

  const totalTasks = project._count?.tasks || 0
  const completedTasks = project._count?.completedTasks || 0
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

  const getDateInfo = () => {
    if (project.status === "completed") {
      return {
        label: `Completed • ${formatDate(project.updatedAt)}`,
        color: "text-muted-foreground",
        icon: CheckCircle2,
      }
    }

    if (project.dueDate) {
      const due = new Date(project.dueDate)
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      due.setHours(0, 0, 0, 0)

      const diffTime = due.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) {
        return {
          label: `Overdue • ${formatDate(project.dueDate)}`,
          color: "text-red-500 font-medium",
          icon: AlertCircle,
        }
      }

      return {
        label: `${diffDays} days left • ${formatDate(project.dueDate)}`,
        color: "text-emerald-600 dark:text-emerald-400 font-medium",
        icon: Calendar,
      }
    }

    return {
      label: `Updated • ${formatDate(project.updatedAt)}`,
      color: "text-muted-foreground",
      icon: Clock,
    }
  }

  const dateInfo = getDateInfo()
  const displayMembers = project.members?.slice(0, 3) || []
  const remainingMembers = (project.members?.length || 0) - 3

  const priorityStyles = {
    high: "bg-red-500/10 text-red-600 dark:text-red-400",
    medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    low: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  }

  const isCardBusy = isPending || isDeleting

  return (
    <>
      <div
        className={`group relative flex flex-col justify-between rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md ${isCardBusy ? "pointer-events-none opacity-70" : ""}`}
      >
        <div
          className="absolute left-0 top-0 h-2 w-full rounded-t-xl"
          style={{ backgroundColor: project.color || "#2D6EF7" }}
        />

        <div className="flex flex-col p-5 pt-6">
          <div className="mb-2 flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <Link href={`/projects/${project.id}`} className="hover:underline">
                <h3 className="line-clamp-1 text-lg font-bold text-foreground">{project.title}</h3>
              </Link>

              {/* NEW: Visibility Badge */}
              <div className="flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {project.visibility === "private" ? (
                  <>
                    <Lock size={10} />
                    <span>Private</span>
                  </>
                ) : (
                  <>
                    <Globe size={10} />
                    <span>Public</span>
                  </>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="shrink-0 text-muted-foreground hover:text-foreground focus:outline-none disabled:opacity-50"
                  disabled={isCardBusy}
                >
                  <MoreHorizontal size={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${project.id}`} className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Open board
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={handleTogglePin}>
                  <Pin className="mr-2 h-4 w-4" />{" "}
                  {project.isPinned ? "Unpin project" : "Pin project"}
                </DropdownMenuItem>

                {isAdmin && (
                  <DropdownMenuItem className="cursor-pointer" onClick={handleToggleStatus}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {project.status === "completed" ? "Mark as Active" : "Mark as Done"}
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem className="cursor-pointer" onClick={handleCopyLink}>
                  <LinkIcon className="mr-2 h-4 w-4" /> Copy link
                </DropdownMenuItem>

                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => openEditProjectModal(project)}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit Details
                    </DropdownMenuItem>
                    {/* Import Upload or Undo icon from lucide-react at the top */}
                    {project.isArchived ? (
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() =>
                          startTransition(() => {
                            // Assuming false means "unarchive"
                            archiveProjectAction(project.id, false)
                          })
                        }
                      >
                        <Upload className="mr-2 h-4 w-4" /> Unarchive
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() =>
                          startTransition(() => {
                            archiveProjectAction(project.id, true)
                          })
                        }
                      >
                        <Archive className="mr-2 h-4 w-4" /> Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {/* TRIGGER DELETE MODAL HERE */}
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/50"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Project
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="mb-6 mt-2 line-clamp-2 min-h-[40px] text-sm text-muted-foreground">
            {project.description || "No description provided."}
          </p>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Progress</span>
              <span className="text-foreground">
                {progressPercent}% ({completedTasks}/{totalTasks})
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: project.color || "#2D6EF7",
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium capitalize ${project.status === "active" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-slate-500/10 text-slate-700 dark:text-slate-400"}`}
            >
              {project.status === "active" && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
              {project.status}
            </span>
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize ${priorityStyles[project.priority as keyof typeof priorityStyles] || priorityStyles.medium}`}
            >
              {project.priority}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <div className="flex -space-x-1.5">
            {displayMembers.map((member) => (
              <div
                key={member.user.id}
                className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-foreground text-[10px] font-bold text-background"
              >
                {getInitials(member.user.firstName, member.user.lastName)}
              </div>
            ))}
            {remainingMembers > 0 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-secondary text-[10px] font-bold text-secondary-foreground">
                +{remainingMembers}
              </div>
            )}
            {project.members?.length === 0 && (
              <span className="text-xs text-muted-foreground">Unassigned</span>
            )}
          </div>
          <div className={`flex items-center text-xs ${dateInfo.color}`}>
            <dateInfo.icon size={14} className="mr-1.5" />
            {dateInfo.label}
          </div>
        </div>
      </div>

      {/* ALERT DIALOG COMPONENT */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the <strong>{project.title}</strong> project. All
              associated lists, tasks, comments, and activity logs will be removed. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
