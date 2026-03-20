"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  moveTaskAction,
  rebalanceTasksAction,
  addTaskAttachmentsAction,
  deleteTaskAttachmentAction,
} from "@/lib/actions/tasks"
import type { ListWithTasks, TaskWithAssignees } from "@/types"

export function useTasks(projectId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const queryKey = ["project-lists", projectId]
  const projectsQueryKey = ["projects"]

  const updateProjectCache = (taskDelta: number, completedDelta: number) => {
    const previousProjects = queryClient.getQueryData(projectsQueryKey)
    const now = new Date()

    queryClient.setQueriesData({ queryKey: projectsQueryKey }, (oldData: any) => {
      if (!oldData) return oldData

      if (Array.isArray(oldData)) {
        return oldData.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              updatedAt: now,
              _count: {
                ...p._count,
                tasks: Math.max(0, (p._count?.tasks || 0) + taskDelta),
                completedTasks: Math.max(0, (p._count?.completedTasks || 0) + completedDelta),
              },
            }
          }
          return p
        })
      }
      return oldData
    })

    return previousProjects
  }

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData()
      formData.append("title", data.title)
      formData.append("listId", data.listId)
      formData.append("projectId", data.projectId)

      if (data.priority) formData.append("priority", data.priority)
      if (data.description) formData.append("description", data.description)

      return await createTaskAction(formData)
    },
    onMutate: async (newTaskData) => {
      await queryClient.cancelQueries({ queryKey })
      const previousLists = queryClient.getQueryData<ListWithTasks[]>(queryKey)

      const previousProjects = updateProjectCache(1, 0)

      const tempTask: TaskWithAssignees = {
        id: `temp-${Date.now()}`,
        title: newTaskData.title,
        description: newTaskData.description || null,
        priority: newTaskData.priority || "medium",
        position: 999999,
        isCompleted: false,
        completedAt: null,
        startDate: null,
        dueDate: null,
        listId: newTaskData.listId,
        projectId: newTaskData.projectId,
        createdById: "temp-user",
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        assignees: [],
        labels: [],
      }

      queryClient.setQueryData<ListWithTasks[]>(queryKey, (old) => {
        if (!old) return []
        return old.map((list) => {
          if (list.id === newTaskData.listId) {
            return { ...list, tasks: [...list.tasks, tempTask] }
          }
          return list
        })
      })

      return { previousLists, previousProjects }
    },
    onSuccess: (result) => {
      if (result?.error) throw new Error(result.error)
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: projectsQueryKey })
      toast({ title: "Task created" })
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(queryKey, context?.previousLists)
      queryClient.setQueryData(projectsQueryKey, context?.previousProjects)
      toast({ variant: "destructive", title: "Failed to create task", description: err.message })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) =>
      updateTaskAction(taskId, projectId, data),
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousLists = queryClient.getQueryData<ListWithTasks[]>(queryKey)

      let completedDelta = 0
      if (data.isCompleted !== undefined) {
        let oldTask: TaskWithAssignees | undefined
        previousLists?.forEach((list) => {
          const found = list.tasks.find((t) => t.id === taskId)
          if (found) oldTask = found
        })
        if (oldTask && oldTask.isCompleted !== data.isCompleted) {
          completedDelta = data.isCompleted ? 1 : -1
        }
      }

      const previousProjects = updateProjectCache(0, completedDelta)

      queryClient.setQueryData<ListWithTasks[]>(queryKey, (old) => {
        if (!old) return []
        return old.map((list) => ({
          ...list,
          tasks: list.tasks.map((task) => (task.id === taskId ? { ...task, ...data } : task)),
        }))
      })

      return { previousLists, previousProjects }
    },
    onSuccess: (result) => {
      if (result?.error) throw new Error(result.error)
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: projectsQueryKey })
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(queryKey, context?.previousLists)
      queryClient.setQueryData(projectsQueryKey, context?.previousProjects)
      toast({ variant: "destructive", title: "Failed to update task", description: err.message })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTaskAction(taskId, projectId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey })
      const previousLists = queryClient.getQueryData<ListWithTasks[]>(queryKey)

      let wasCompleted = false
      previousLists?.forEach((list) => {
        const found = list.tasks.find((t) => t.id === taskId)
        if (found && found.isCompleted) wasCompleted = true
      })

      const previousProjects = updateProjectCache(-1, wasCompleted ? -1 : 0)

      queryClient.setQueryData<ListWithTasks[]>(queryKey, (old) => {
        if (!old) return []
        return old.map((list) => ({
          ...list,
          tasks: list.tasks.filter((task) => task.id !== taskId),
        }))
      })

      return { previousLists, previousProjects }
    },
    onSuccess: (result) => {
      if (result?.error) throw new Error(result.error)
      toast({ title: "Task deleted" })
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: projectsQueryKey })
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(queryKey, context?.previousLists)
      queryClient.setQueryData(projectsQueryKey, context?.previousProjects)
      toast({ variant: "destructive", title: "Failed to delete task", description: err.message })
    },
  })

  const moveMutation = useMutation({
    mutationFn: async (data: { taskId: string; listId: string; position: number }) => {
      const result = await moveTaskAction(data, projectId)

      if (result?.error) {
        throw new Error(result.error)
      }

      return result
    },
    onMutate: async ({ taskId, listId, position }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousLists = queryClient.getQueryData<ListWithTasks[]>(queryKey)

      const previousProjects = updateProjectCache(0, 0)

      queryClient.setQueryData<ListWithTasks[]>(queryKey, (old) => {
        if (!old) return []

        let taskToMove: TaskWithAssignees | undefined
        old.forEach((list) => {
          const found = list.tasks.find((t) => t.id === taskId)
          if (found) taskToMove = { ...found, listId: listId, position }
        })

        if (!taskToMove) return old

        return old.map((list) => {
          let newTasks = list.tasks.filter((t) => t.id !== taskId)

          if (list.id === listId) {
            newTasks.push(taskToMove!)
            newTasks.sort((a, b) => a.position - b.position)
          }

          return { ...list, tasks: newTasks }
        })
      })

      return { previousLists, previousProjects }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(queryKey, context?.previousLists)
      queryClient.setQueryData(projectsQueryKey, context?.previousProjects)
      toast({ variant: "destructive", title: "Failed to move task", description: err.message })
    },
  })

  const rebalanceMutation = useMutation({
    mutationFn: (listId: string) => rebalanceTasksAction(listId, projectId),
    onSuccess: (result) => {
      if (result?.error) throw new Error(result.error)
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Background sync failed",
        description: "Failed to rebalance task positions, but your tasks are still safe.",
      })
    },
  })

  // ── Attachment Mutations (no useUploadThing here — upload happens at component level) ──

  const saveAttachmentsMutation = useMutation({
    mutationFn: async ({
      taskId,
      attachments,
    }: {
      taskId: string
      attachments: { url: string; name: string; size: number; type: string }[]
    }) => {
      const result = await addTaskAttachmentsAction(taskId, projectId, attachments)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ["task-activity"] })
      queryClient.invalidateQueries({ queryKey: ["task-detail"] })
      toast({ title: "Attachments uploaded" })
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Failed to save attachments",
        description: err.message,
      })
    },
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: async ({ attachmentId, taskId }: { attachmentId: string; taskId: string }) => {
      const result = await deleteTaskAttachmentAction(attachmentId, taskId, projectId)
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ["task-activity"] })
      queryClient.invalidateQueries({ queryKey: ["task-detail"] })
      toast({ title: "Attachment deleted" })
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Failed to delete attachment",
        description: err.message,
      })
    },
  })

  return {
    createTask: createMutation.mutateAsync,
    isCreatingTask: createMutation.isPending,
    updateTask: updateMutation.mutateAsync,
    isUpdatingTask: updateMutation.isPending,
    deleteTask: deleteMutation.mutateAsync,
    isDeletingTask: deleteMutation.isPending,
    moveTask: moveMutation.mutateAsync,
    isMovingTask: moveMutation.isPending,
    rebalanceTasks: rebalanceMutation.mutateAsync,
    isRebalancing: rebalanceMutation.isPending,
    // Attachments
    saveAttachments: saveAttachmentsMutation.mutateAsync,
    isSavingAttachments: saveAttachmentsMutation.isPending,
    deleteAttachment: deleteAttachmentMutation.mutateAsync,
    isDeletingAttachment: deleteAttachmentMutation.isPending,
  }
}
