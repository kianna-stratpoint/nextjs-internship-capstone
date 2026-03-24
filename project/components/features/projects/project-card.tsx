"use client"

import { useState } from "react"
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
import { StackedAvatars } from "@/components/shared/user-avatar"

import { type ProjectCardData } from "@/types/index"
import { useProjects } from "@/hooks/use-projects"
import { useToast } from "@/hooks/use-toast"
import { useUIStore } from "@/stores/ui-store"
import { formatDate } from "@/lib/utils"

// --- Helpers ---

function calculateProgress(counts?: { tasks?: number; completedTasks?: number }) {
  const total = counts?.tasks || 0
  const completed = counts?.completedTasks || 0
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { total, completed, percent }
}

function getProjectDateStatus(project: ProjectCardData) {
  if (project.status === "completed") {
    return {
      label: `Completed • ${formatDate(project.updatedAt, "shortWithYear")}`,
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
        label: `Overdue • ${formatDate(project.dueDate, "shortWithYear")}`,
        color: "text-red-500 font-medium",
        icon: AlertCircle,
      }
    }

    return {
      label: `${diffDays} days left • ${formatDate(project.dueDate, "shortWithYear")}`,
      color: "text-emerald-600 dark:text-emerald-400 font-medium",
      icon: Calendar,
    }
  }

  return {
    label: `Updated • ${formatDate(project.updatedAt, "shortWithYear")}`,
    color: "text-muted-foreground",
    icon: Clock,
  }
}

const PRIORITY_STYLES = {
  high: "bg-red-500/10 text-red-600 dark:text-red-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
}

// --- Component ---

type ProjectCardProps = {
  project: ProjectCardData & { memberRole?: string }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { toast } = useToast()
  const openEditProjectModal = useUIStore((state) => state.openEditProjectModal)

  const { deleteProject, isDeleting, togglePin, toggleStatus, toggleArchive, getProjectFromCache } =
    useProjects()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const isAdmin = project.memberRole === "admin"
  const isCardBusy = isDeleting

  const cachedProject = getProjectFromCache(project.id)
  const activeProject = cachedProject || project

  // --- Handlers ---
  const handleTogglePin = () => togglePin({ id: project.id, currentPinState: project.isPinned })

  const handleToggleStatus = () => {
    const newStatus = project.status === "completed" ? "active" : "completed"
    toggleStatus({ id: project.id, status: newStatus })
  }

  const handleToggleArchive = () =>
    toggleArchive({ id: project.id, isArchived: !project.isArchived })

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/projects/${project.id}`)
    toast({ title: "Link copied!", description: "Project link has been copied to your clipboard." })
  }

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await deleteProject(project.id)
      setShowDeleteDialog(false)
    } catch (error: any) {
      // Errors are handled by the hook's toast notifications
    }
  }

  // --- Pre-computed View Data ---
  const progress = calculateProgress(activeProject._count)
  const dateInfo = getProjectDateStatus(activeProject)

  return (
    <>
      <div
        className={`group relative flex flex-col justify-between rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md ${
          isCardBusy ? "pointer-events-none opacity-70" : ""
        }`}
      >
        <Link
          href={`/projects/${project.id}`}
          className="absolute inset-0 z-0"
          aria-label={`View ${project.title} board`}
        />
        <div
          className="absolute left-0 top-0 h-2 w-full rounded-t-xl transition-opacity group-hover:opacity-90"
          style={{ backgroundColor: project.color || "#2D6EF7" }}
        />

        <div className="flex flex-col p-5 pt-6">
          <div className="mb-2 flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <Link href={`/projects/${project.id}`} className="relative z-0 hover:underline">
                <h3 className="line-clamp-1 text-xl font-bold text-foreground">{project.title}</h3>
              </Link>

              {/* Visibility Badge */}
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
                  className="relative z-10 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none disabled:opacity-50"
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
                    <DropdownMenuItem className="cursor-pointer" onClick={handleToggleArchive}>
                      {project.isArchived ? (
                        <Upload className="mr-2 h-4 w-4" />
                      ) : (
                        <Archive className="mr-2 h-4 w-4" />
                      )}
                      {project.isArchived ? "Unarchive" : "Archive"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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
            {project.description}
          </p>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Progress</span>
              <span className="text-foreground">
                {progress.percent}% ({progress.completed}/{progress.total})
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress.percent}%`,
                  backgroundColor: project.color || "#2D6EF7",
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium capitalize ${
                project.status === "active"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-slate-500/10 text-slate-700 dark:text-slate-400"
              }`}
            >
              {project.status === "active" && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
              {project.status}
            </span>
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize ${
                PRIORITY_STYLES[project.priority as keyof typeof PRIORITY_STYLES] ||
                PRIORITY_STYLES.medium
              }`}
            >
              {project.priority}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <div>
            {project.members?.length > 0 ? (
              <StackedAvatars
                users={project.members.map((m) => ({ user: m.user }))}
                max={3}
                size="md"
              />
            ) : (
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
