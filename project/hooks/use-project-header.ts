import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useUIStore } from "@/stores/ui-store"
import { useProjects } from "@/hooks/use-projects"
import type { ProjectCardData } from "@/types/index"

export function useProjectHeaderLogic(project: ProjectCardData, isPinned?: boolean) {
  const router = useRouter()
  const { toast } = useToast()
  const { openEditProjectModal } = useUIStore()
  const { deleteProject, isDeleting, togglePin, toggleStatus, toggleArchive, getProjectFromCache } =
    useProjects()

  // --- Local UI State ---
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [localPinOverride, setLocalPinOverride] = useState<boolean | null>(null)

  const cachedProject = getProjectFromCache(project.id)
  const optimisticPinned =
    localPinOverride !== null
      ? localPinOverride
      : cachedProject
        ? cachedProject.isPinned
        : project.isPinned

  // --- Handlers ---
  const handleTogglePin = () => {
    const currentState = optimisticPinned
    const newState = !currentState

    // Immediate local UI update
    setLocalPinOverride(newState)

    togglePin({
      id: project.id,
      currentPinState: currentState,
    })
      .then(() => {
        setLocalPinOverride(null)
      })
      .catch(() => {
        setLocalPinOverride(null)
      })
  }

  const handleToggleStatus = () => {
    const newStatus = project.status === "completed" ? "active" : "completed"
    toggleStatus({ id: project.id, status: newStatus })
  }

  const handleToggleArchive = () =>
    toggleArchive({ id: project.id, isArchived: !project.isArchived })

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/projects/${project.id}`)
    toast({ title: "Link copied!", description: "Project link copied to clipboard." })
  }

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await deleteProject(project.id)
      setShowDeleteDialog(false)
      router.push("/projects")
    } catch (error) {
      // Handled by react-query hook
    }
  }

  const handleInviteMember = () => {
    toast({
      title: "Invite Sent!",
      description: "Server action for standalone invites coming soon.",
    })
    setIsAddMemberOpen(false)
  }

  // --- Derived View Data ---
  const calculateProgress = (total?: number, completed?: number) => {
    const safeTotal = total ?? 0
    const safeCompleted = completed ?? 0

    const percent = safeTotal === 0 ? 0 : Math.round((safeCompleted / safeTotal) * 100)

    return { total: safeTotal, completed: safeCompleted, percent }
  }

  const getTimeAgo = (dateString: Date | string | null) => {
    if (!dateString) return "Unknown"
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000)
    let interval = seconds / 86400
    if (interval >= 1) return `${Math.floor(interval)}d ago`
    interval = seconds / 3600
    if (interval >= 1) return `${Math.floor(interval)}h ago`
    interval = seconds / 60
    if (interval >= 1) return `${Math.floor(interval)}m ago`
    return "Just now"
  }

  const activeProject = cachedProject || project

  const progressData = calculateProgress(
    activeProject.taskCount ?? 0,
    activeProject.completedTaskCount ?? 0
  )
  const updatedText = getTimeAgo(activeProject.updatedAt)
  const dueDateText = activeProject.dueDate
    ? new Date(activeProject.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No due date"

  const showCompletionPrompt =
    progressData.percent === 100 && activeProject.status === "active" && !activeProject.isArchived

  return {
    state: { isAddMemberOpen, showDeleteDialog, searchQuery, isDeleting, optimisticPinned },
    setters: { setIsAddMemberOpen, setShowDeleteDialog, setSearchQuery },
    handlers: {
      handleTogglePin,
      handleToggleStatus,
      handleToggleArchive,
      handleCopyLink,
      handleDeleteConfirm,
      handleInviteMember,
      openEditProjectModal: () => openEditProjectModal(project),
    },
    viewData: { progressData, updatedText, dueDateText, showCompletionPrompt },
  }
}
