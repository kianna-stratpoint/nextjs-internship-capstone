"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import {
  getNotificationsAction,
  getUnreadCountAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  deleteNotificationAction,
} from "@/lib/actions/notifications"

/**
 * Fetch and manage notifications for the current user.
 *
 * @param options.limit - Number of notifications per page (default 20)
 * @param options.unreadOnly - Only show unread notifications
 */
export function useNotifications(options?: { limit?: number; unreadOnly?: boolean }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const limit = options?.limit ?? 20
  const unreadOnly = options?.unreadOnly ?? false

  /* ==================== QUERIES ==================== */

  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    isError: isNotificationsError,
  } = useQuery({
    queryKey: ["notifications", { limit, unreadOnly }],
    queryFn: async () => {
      const result = await getNotificationsAction({ limit, unreadOnly })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  // Unread count (for badge) — separate query so the badge
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const result = await getUnreadCountAction()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    // Poll every 30 seconds for badge freshness
    refetchInterval: 30_000,
  })

  /* ==================== MUTATIONS ==================== */

  // Mark a single notification as read
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationReadAction(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] })
      const previousData = queryClient.getQueryData(["notifications", { limit, unreadOnly }])

      // Optimistic: mark as read in the cache
      queryClient.setQueryData(["notifications", { limit, unreadOnly }], (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: old.items.map((n: any) => (n.id === notificationId ? { ...n, isRead: true } : n)),
        }
      })

      // Optimistic: decrement unread count
      queryClient.setQueryData(["notifications-unread-count"], (old: number) =>
        Math.max((old ?? 1) - 1, 0)
      )

      return { previousData }
    },
    onSuccess: (result, _, context) => {
      if (!result.success) {
        queryClient.setQueryData(["notifications", { limit, unreadOnly }], context?.previousData)
        queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] })
        return
      }
    },
    onError: (_err, _, context) => {
      queryClient.setQueryData(["notifications", { limit, unreadOnly }], context?.previousData)
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] })
    },
  })

  // Mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsReadAction(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] })
      const previousData = queryClient.getQueryData(["notifications", { limit, unreadOnly }])

      // Optimistic: mark all as read
      queryClient.setQueryData(["notifications", { limit, unreadOnly }], (old: any) => {
        if (!old?.items) return old
        return {
          ...old,
          items: old.items.map((n: any) => ({ ...n, isRead: true })),
        }
      })

      queryClient.setQueryData(["notifications-unread-count"], 0)

      return { previousData }
    },
    onSuccess: (result, _, context) => {
      if (!result.success) {
        queryClient.setQueryData(["notifications", { limit, unreadOnly }], context?.previousData)
        queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] })
        toast({ variant: "destructive", title: "Failed", description: result.error })
        return
      }
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast({ title: "All notifications marked as read" })
    },
    onError: (_err, _, context) => {
      queryClient.setQueryData(["notifications", { limit, unreadOnly }], context?.previousData)
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] })
    },
  })

  // Delete a notification
  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) => deleteNotificationAction(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] })
      const previousData = queryClient.getQueryData(["notifications", { limit, unreadOnly }])

      // Optimistic removal
      queryClient.setQueryData(["notifications", { limit, unreadOnly }], (old: any) => {
        if (!old?.items) return old
        const removed = old.items.find((n: any) => n.id === notificationId)
        return {
          ...old,
          items: old.items.filter((n: any) => n.id !== notificationId),
          total: Math.max((old.total ?? 1) - 1, 0),
        }
      })

      return { previousData }
    },
    onSuccess: (result, _, context) => {
      if (!result.success) {
        queryClient.setQueryData(["notifications", { limit, unreadOnly }], context?.previousData)
        toast({ variant: "destructive", title: "Delete failed", description: result.error })
        return
      }
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] })
    },
    onError: (_err, _, context) => {
      queryClient.setQueryData(["notifications", { limit, unreadOnly }], context?.previousData)
    },
  })

  return {
    // Data
    notifications: notificationsData?.items ?? [],
    totalNotifications: notificationsData?.total ?? 0,
    unreadCount,

    // Loading states
    isLoadingNotifications,
    isNotificationsError,

    // Mutations
    markAsRead: markReadMutation.mutateAsync,
    isMarkingRead: markReadMutation.isPending,

    markAllAsRead: markAllReadMutation.mutateAsync,
    isMarkingAllRead: markAllReadMutation.isPending,

    deleteNotification: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}
