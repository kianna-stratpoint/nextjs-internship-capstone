"use client"
import { useState, useTransition, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Pin,
  CheckCircle2,
  Copy,
  Edit,
  Archive,
  Trash2,
  Loader2,
  Upload,
  Calendar,
  Clock,
  Sparkles,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

import { useProjectHeaderLogic } from "@/hooks/use-project-header"
import { useUIStore } from "@/stores/ui-store"

// --- Helpers ---
function getInitials(firstName?: string | null, lastName?: string | null) {
  return ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "U"
}

const PRIORITY_STYLES = {
  high: "bg-red-500/10 text-red-600 dark:text-red-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
}

// --- Component ---
export function ProjectHeader({ project, isPinned }: any) {
  const { state, setters, handlers, viewData } = useProjectHeaderLogic(project, isPinned)
  const { progressData, updatedText, dueDateText, showCompletionPrompt } = viewData
  const { openInviteMemberModal } = useUIStore()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [dismissPrompt, setDismissPrompt] = useState(false)

  const [localSearch, setLocalSearch] = useState(searchParams.get("query") || "")

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQuery = searchParams.get("query") || ""

      if (currentQuery !== localSearch) {
        const params = new URLSearchParams(searchParams.toString())
        if (localSearch) {
          params.set("query", localSearch)
        } else {
          params.delete("query")
        }

        startTransition(() => {
          router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, pathname, router, searchParams])

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const handleSwitchChange = (key: string, checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (checked) {
      params.set(key, "true")
    } else {
      params.delete(key)
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const hasActiveFilters =
    searchParams.has("priority") ||
    searchParams.has("assignee") ||
    searchParams.has("overdue") ||
    searchParams.has("due7days")

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-border bg-background px-6 pb-4 pt-6">
        {showCompletionPrompt && !dismissPrompt && (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 animate-in fade-in slide-in-from-top-2 duration-500 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p>
                <strong>Awesome!</strong> All tasks are done. Ready to mark this project as
                completed?
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlers.handleToggleStatus}
                className="font-medium text-emerald-700 underline underline-offset-2 transition-colors hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Mark as Completed
              </button>
              <div className="h-4 w-px bg-emerald-500/30" />
              <button
                onClick={() => setDismissPrompt(true)}
                className="text-emerald-600/70 transition-colors hover:text-emerald-800 dark:text-emerald-400/70 dark:hover:text-emerald-300"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Top Row: Breadcrumb */}
        <Link
          href="/projects"
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Projects / {project.title}
        </Link>

        {/* Title Row */}
        <div>
          <div className="flex items-center gap-3">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: project.color || "#3b82f6" }}
            />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{project.title}</h1>
          </div>
          <div className="mt-1.5 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-muted-foreground/70" />
              <span>Updated {updatedText}</span>
            </div>
            <div className={`flex items-center gap-1.5 ${!project.dueDate ? "opacity-60" : ""}`}>
              <Calendar size={14} className="text-muted-foreground/70" />
              <span>Due: {dueDateText}</span>
            </div>
          </div>
        </div>

        {/* Toolbar Row */}
        <div className="mt-2 flex flex-wrap items-center gap-4">
          {/* Badges */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold capitalize ${project.status === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-500/10 text-slate-600 dark:text-slate-400"}`}
            >
              {project.status === "active" && (
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
              {project.status}
            </span>
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold capitalize ${PRIORITY_STYLES[project.priority as keyof typeof PRIORITY_STYLES] || PRIORITY_STYLES.medium}`}
            >
              {project.priority}
            </span>
          </div>

          <div className="hidden h-6 w-px bg-border sm:block" />

          {/* Fixed Progress */}
          <div className="w-full sm:w-56">
            <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Progress</span>
              <span className="text-foreground">
                {progressData.percent}% ({progressData.completed}/{progressData.total})
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressData.percent}%`,
                  backgroundColor: project.color || "#2D6EF7",
                }}
              />
            </div>
          </div>

          <div className="hidden h-6 w-px bg-border sm:block" />

          {/* Members & Add Member Dialog */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {project.members?.slice(0, 5).map((member: any) => (
                <div
                  key={member.userId}
                  className="relative z-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-foreground text-xs font-bold text-background transition-transform hover:z-10 hover:scale-110"
                  title={`${member.user?.firstName} ${member.user?.lastName}`}
                >
                  {getInitials(member.user?.firstName, member.user?.lastName)}
                </div>
              ))}
              {project.members?.length > 5 && (
                <div className="relative z-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground">
                  +{project.members.length - 5}
                </div>
              )}
            </div>

            <button
              onClick={() => openInviteMemberModal(project.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground transition-colors hover:border-foreground hover:bg-muted hover:text-foreground"
              aria-label="Invite Member"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="hidden h-6 w-px bg-border lg:block" />

          {/* Search Input */}
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="h-9 pl-9 pr-8 text-foreground"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)} // Simplified!
            />
            {isPending && (
              <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="relative h-9 gap-2 text-sm text-muted-foreground"
              >
                <Filter size={16} />
                <span className="hidden sm:inline-flex">Filter</span>
                {hasActiveFilters && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium leading-none text-foreground">Filter Tasks</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => router.replace(pathname, { scroll: false })}
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={searchParams.get("priority") || "all"}
                    onValueChange={(val) => handleFilterChange("priority", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee */}
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select
                    value={searchParams.get("assignee") || "all"}
                    onValueChange={(val) => handleFilterChange("assignee", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Anyone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Anyone</SelectItem>
                      <SelectItem value="me">My Tasks</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Switches */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="overdue-filter" className="cursor-pointer text-sm font-medium">
                      Overdue Only
                    </Label>
                    <Switch
                      id="overdue-filter"
                      checked={searchParams.get("overdue") === "true"}
                      onCheckedChange={(checked) => handleSwitchChange("overdue", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="due7days-filter" className="cursor-pointer text-sm font-medium">
                      Due within 7 days
                    </Label>
                    <Switch
                      id="due7days-filter"
                      checked={searchParams.get("due7days") === "true"}
                      onCheckedChange={(checked) => handleSwitchChange("due7days", checked)}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex-1" />

          {/* 3-Dot Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 text-foreground">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem className="cursor-pointer" onClick={handlers.handleTogglePin}>
                <Pin className="mr-2 h-4 w-4" />
                {state.optimisticPinned ? "Unpin project" : "Pin project"}
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer" onClick={handlers.handleToggleStatus}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {project.status === "completed" ? "Mark as Active" : "Mark as Done"}
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer" onClick={handlers.handleCopyLink}>
                <Copy className="mr-2 h-4 w-4" /> Copy link
              </DropdownMenuItem>

              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handlers.openEditProjectModal}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Details
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer" onClick={handlers.handleToggleArchive}>
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
                  onClick={() => setters.setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Project
                </DropdownMenuItem>
              </>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ALERT DIALOG */}
      <AlertDialog open={state.showDeleteDialog} onOpenChange={setters.setShowDeleteDialog}>
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
            <AlertDialogCancel className="text-foreground" disabled={state.isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlers.handleDeleteConfirm}
              disabled={state.isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {state.isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
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
