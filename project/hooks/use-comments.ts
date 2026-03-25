"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import {
  getCommentsAction,
  createCommentAction,
  updateCommentAction,
  deleteCommentAction,
} from "@/lib/actions/comments"

type OptimisticUser = {
  id: string
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
}

export function useComments(taskId: string, projectId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const queryKey = ["comments", taskId]

  // 1. Fetch Comments
  const {
    data: comments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await getCommentsAction(taskId)
      if (result?.error) throw new Error(result.error)
      return result?.data || []
    },
    enabled: !!taskId,
  })

  // 2. Create Comment (with Optimistic UI)
  const createMutation = useMutation({
    mutationFn: async ({ content }: { content: string; currentUser: OptimisticUser }) => {
      const result = await createCommentAction({ taskId, content }, projectId)
      if (result?.error) throw new Error(result.error)
      return result?.data
    },
    onMutate: async ({ content, currentUser }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousComments = queryClient.getQueryData<any[]>(queryKey)

      const tempComment = {
        id: `temp-${Date.now()}`,
        taskId,
        userId: currentUser.id,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { ...currentUser },
      }

      queryClient.setQueryData(queryKey, (old: any[]) => {
        return old ? [...old, tempComment] : [tempComment]
      })

      return { previousComments }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(queryKey, context?.previousComments)
      toast({ variant: "destructive", title: "Failed to post comment", description: err.message })
    },
  })

  // 3. Update Comment (with Optimistic UI)
  const updateMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const result = await updateCommentAction({ commentId, content }, projectId)
      if (result?.error) throw new Error(result.error)
      return result?.data
    },
    onMutate: async ({ commentId, content }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousComments = queryClient.getQueryData<any[]>(queryKey)

      queryClient.setQueryData(queryKey, (old: any[]) => {
        if (!old) return []
        return old.map((comment) =>
          comment.id === commentId ? { ...comment, content, updatedAt: new Date() } : comment
        )
      })

      return { previousComments }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(queryKey, context?.previousComments)
      toast({ variant: "destructive", title: "Failed to update comment", description: err.message })
    },
  })

  // 4. Delete Comment (with Optimistic UI)
  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const result = await deleteCommentAction(commentId, projectId)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey })
      const previousComments = queryClient.getQueryData<any[]>(queryKey)

      // Filter the comment out of the array instantly
      queryClient.setQueryData(queryKey, (old: any[]) => {
        if (!old) return []
        return old.filter((comment) => comment.id !== commentId)
      })

      return { previousComments }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(queryKey, context?.previousComments)
      toast({ variant: "destructive", title: "Failed to delete comment", description: err.message })
    },
  })

  return {
    comments,
    isLoading,
    error,
    addComment: createMutation.mutateAsync,
    isAdding: createMutation.isPending,
    editComment: updateMutation.mutateAsync,
    isEditing: updateMutation.isPending,
    deleteComment: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}
