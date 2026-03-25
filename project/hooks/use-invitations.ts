"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import {
  inviteMemberAction,
  getPendingInvitationsAction,
  getMyInvitationsAction,
  acceptInvitationAction,
  declineInvitationAction,
  cancelInvitationAction,
  resendInvitationAction,
} from "@/lib/actions/invitations"

/**
 * Manage outgoing invitations for a project (admin view).
 * Used on the team page pending invites section.
 *
 * @param projectId - The selected project (null to skip)
 */
export function useProjectInvitations(projectId: string | null) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  /* ==================== QUERIES ==================== */

  const {
    data: pendingInvitations = [],
    isLoading: isLoadingInvitations,
    isError: isInvitationsError,
  } = useQuery({
    queryKey: ["invitations", projectId],
    queryFn: async () => {
      if (!projectId) return []
      const result = await getPendingInvitationsAction(projectId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!projectId,
  })

  /* ==================== MUTATIONS ==================== */

  // Send a new invitation
  const inviteMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) => {
      if (!projectId) throw new Error("No project selected")
      const formData = new FormData()
      formData.append("email", email)
      formData.append("role", role)
      return inviteMemberAction(projectId, formData)
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Invitation failed",
          description: result.error,
        })
        return
      }
      queryClient.invalidateQueries({ queryKey: ["invitations", projectId] })
      toast({ title: "Invitation sent!", description: "The user will be notified." })
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Invitation failed", description: err.message })
    },
  })

  // Cancel a pending invitation
  const cancelMutation = useMutation({
    mutationFn: (invitationId: string) => {
      if (!projectId) throw new Error("No project selected")
      return cancelInvitationAction(projectId, invitationId)
    },
    onMutate: async (invitationId) => {
      await queryClient.cancelQueries({ queryKey: ["invitations", projectId] })
      const previous = queryClient.getQueryData(["invitations", projectId])

      // Optimistic removal
      queryClient.setQueryData(["invitations", projectId], (old: any) =>
        old?.filter((inv: any) => inv.id !== invitationId)
      )
      return { previous }
    },
    onSuccess: (result, _, context) => {
      if (!result.success) {
        queryClient.setQueryData(["invitations", projectId], context?.previous)
        toast({ variant: "destructive", title: "Cancel failed", description: result.error })
        return
      }
      queryClient.invalidateQueries({ queryKey: ["invitations", projectId] })
      toast({ title: "Invitation cancelled" })
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(["invitations", projectId], context?.previous)
      toast({ variant: "destructive", title: "Cancel failed", description: err.message })
    },
  })

  // Resend an invitation (extend or recreate)
  const resendMutation = useMutation({
    mutationFn: (invitationId: string) => {
      if (!projectId) throw new Error("No project selected")
      return resendInvitationAction(projectId, invitationId)
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast({ variant: "destructive", title: "Resend failed", description: result.error })
        return
      }
      queryClient.invalidateQueries({ queryKey: ["invitations", projectId] })
      toast({
        title: "Invitation resent!",
        description:
          result.action === "extended"
            ? "Expiry extended by 7 days."
            : "A new invitation was sent.",
      })
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Resend failed", description: err.message })
    },
  })

  return {
    // Data
    pendingInvitations,
    isLoadingInvitations,
    isInvitationsError,

    // Mutations
    inviteMember: inviteMutation.mutateAsync,
    isInviting: inviteMutation.isPending,

    cancelInvitation: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,

    resendInvitation: resendMutation.mutateAsync,
    isResending: resendMutation.isPending,
  }
}

/**
 * Manage incoming invitations for the current user.
 * Used by the notification bell / invitations list.
 */
export function useMyInvitations() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  /* ==================== QUERIES ==================== */

  const {
    data: myInvitations = [],
    isLoading: isLoadingMyInvitations,
    isError: isMyInvitationsError,
  } = useQuery({
    queryKey: ["my-invitations"],
    queryFn: async () => {
      const result = await getMyInvitationsAction()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  /* ==================== MUTATIONS ==================== */

  // Accept an invitation
  const acceptMutation = useMutation({
    mutationFn: (invitationId: string) => acceptInvitationAction(invitationId),
    onSuccess: (result) => {
      if (!result.success) {
        toast({ variant: "destructive", title: "Accept failed", description: result.error })
        return
      }
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["member-projects"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast({ title: "Invitation accepted!", description: "You've joined the project." })
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Accept failed", description: err.message })
    },
  })

  // Decline an invitation
  const declineMutation = useMutation({
    mutationFn: (invitationId: string) => declineInvitationAction(invitationId),
    onMutate: async (invitationId) => {
      await queryClient.cancelQueries({ queryKey: ["my-invitations"] })
      const previous = queryClient.getQueryData(["my-invitations"])

      // Optimistic removal
      queryClient.setQueryData(["my-invitations"], (old: any) =>
        old?.filter((inv: any) => inv.id !== invitationId)
      )
      return { previous }
    },
    onSuccess: (result, _, context) => {
      if (!result.success) {
        queryClient.setQueryData(["my-invitations"], context?.previous)
        toast({ variant: "destructive", title: "Decline failed", description: result.error })
        return
      }
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast({ title: "Invitation declined" })
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(["my-invitations"], context?.previous)
      toast({ variant: "destructive", title: "Decline failed", description: err.message })
    },
  })

  return {
    // Data
    myInvitations,
    isLoadingMyInvitations,
    isMyInvitationsError,

    // Mutations
    acceptInvitation: acceptMutation.mutateAsync,
    isAccepting: acceptMutation.isPending,

    declineInvitation: declineMutation.mutateAsync,
    isDeclining: declineMutation.isPending,
  }
}
