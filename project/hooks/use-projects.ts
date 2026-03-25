"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import {
  createProjectAction,
  deleteProjectAction,
  updateProjectAction,
  togglePinProjectAction,
  setProjectStatusAction,
  archiveProjectAction,
} from "@/lib/actions/projects"
import type { ProjectCardData } from "@/types/index"
import { getProjectsAction } from "@/lib/actions/projects"

function mapToProjectCardData(project: any): ProjectCardData {
  return {
    ...project,

    taskCount: project.taskCount ?? project._count?.tasks ?? 0,

    completedTaskCount: project.completedTaskCount ?? project._count?.completedTasks ?? 0,

    isPinned: project.isPinned ?? false,
    members: project.members ?? [],
  }
}

export function useProjects(searchParams?: Record<string, string>) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // FETCHING
  const {
    data: projects = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["projects", searchParams],
    queryFn: async () => {
      const result = await getProjectsAction(searchParams)
      if (!result.success) throw new Error(result.error)
      return result.data.map(mapToProjectCardData)
    },
  })

  // ✅ Helper: look up a single project's current state from the React Query cache.
  // This lets components like project-header read live cache data instead of stale server props.
  const getProjectFromCache = (projectId: string): ProjectCardData | undefined => {
    const allQueries = queryClient.getQueriesData<any[]>({ queryKey: ["projects"] })

    for (const [, data] of allQueries) {
      const found = data?.find((p) => p.id === projectId)
      if (found) return mapToProjectCardData(found) // ✅ normalize again
    }

    return undefined
  }

  // MUTATIONS
  const createMutation = useMutation({
    mutationFn: (formData: FormData) => createProjectAction(formData),
    onSuccess: (result) => {
      if (result.error || result.fieldErrors) {
        if (result.error) {
          toast({ variant: "destructive", title: "Creation failed", description: result.error })
        }
        return
      }
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast({ title: "Project created!", description: "Your new project is ready." })
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Creation failed", description: err.message })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => updateProjectAction(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] })
      const previousProjects = queryClient.getQueryData(["projects"])

      queryClient.setQueryData(["projects"], (old: ProjectCardData[] = []) =>
        old?.map((p: any) => (p.id === id ? { ...p, title: data.get("title") } : p))
      )
      return { previousProjects }
    },
    onSuccess: (result) => {
      if (result.error || result.fieldErrors) {
        queryClient.invalidateQueries({ queryKey: ["projects"] })
        if (result.error) {
          toast({ variant: "destructive", title: "Update failed", description: result.error })
        }
        return
      }
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast({ title: "Project updated!" })
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(["projects"], context?.previousProjects)
      toast({ variant: "destructive", title: "Update failed", description: err.message })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProjectAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] })
      const previousProjects = queryClient.getQueryData(["projects"])
      queryClient.setQueryData(["projects"], (old: ProjectCardData[] = []) =>
        old?.filter((p: any) => p.id !== id)
      )
      return { previousProjects }
    },
    onSuccess: (result) => {
      if (result.error) throw new Error(result.error)
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast({ title: "Project deleted" })
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(["projects"], context?.previousProjects)
      toast({ variant: "destructive", title: "Deletion failed", description: err.message })
    },
  })

  const togglePinMutation = useMutation({
    mutationFn: ({ id, currentPinState }: { id: string; currentPinState: boolean }) =>
      togglePinProjectAction(id, currentPinState),
    onMutate: async ({ id, currentPinState }) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] })
      const previousProjects = queryClient.getQueryData(["projects"])

      // Optimistic: flip to what the server will set
      queryClient.setQueryData(["projects"], (old: ProjectCardData[] = []) =>
        old?.map((p: any) => (p.id === id ? { ...p, isPinned: !currentPinState } : p))
      )
      return { previousProjects }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(["projects"], context?.previousProjects)
      toast({ variant: "destructive", title: "Action failed", description: err.message })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "completed" }) =>
      setProjectStatusAction(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast({ title: "Project Status updated!" })
    },
  })

  const toggleArchiveMutation = useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      archiveProjectAction(id, isArchived),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast({
        title: variables.isArchived ? "Project archived" : "Project unarchived",
      })
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Action failed", description: err.message })
    },
  })

  return {
    projects,
    isLoading,
    isError,
    error,

    getProjectFromCache,

    createProject: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateProject: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteProject: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    togglePin: togglePinMutation.mutateAsync,
    toggleStatus: toggleStatusMutation.mutateAsync,
    toggleArchive: toggleArchiveMutation.mutateAsync,
  }
}
