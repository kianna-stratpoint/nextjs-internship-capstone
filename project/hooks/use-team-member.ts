"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import {
  getProjectMembersAction,
  getProjectMemberCountsAction,
  getMemberProjectsAction,
  getMemberProfileAction,
  updateMemberRoleAction,
  removeMemberAction,
  leaveProjectAction,
} from "@/lib/actions/members"

/**
 * Fetch and manage team members for a project.
 *
 * @param projectId - The selected project (null to skip queries)
 */
export function useTeamMembers(projectId: string | null) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  /* ==================== QUERIES ==================== */
  const {
    data: members = [],
    isLoading: isLoadingMembers,
    isError: isMembersError,
  } = useQuery({
    queryKey: ["members", projectId],
    queryFn: async () => {
      if (!projectId) return []
      const result = await getProjectMembersAction(projectId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!projectId,
  })

  // Member count stats (total, admins, contributors, viewers)
  const { data: memberCounts, isLoading: isLoadingCounts } = useQuery({
    queryKey: ["member-counts", projectId],
    queryFn: async () => {
      if (!projectId) return { total: 0, admins: 0, contributors: 0, viewers: 0 }
      const result = await getProjectMemberCountsAction(projectId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!projectId,
  })

  // All projects the current user belongs to (for project dropdown)
  const { data: memberProjects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["member-projects"],
    queryFn: async () => {
      const result = await getMemberProjectsAction()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  /* ==================== MUTATIONS ==================== */

  // Update a member's role
  const updateRoleMutation = useMutation({
    mutationFn: ({ targetUserId, newRole }: { targetUserId: string; newRole: string }) => {
      if (!projectId) throw new Error("No project selected")
      const formData = new FormData()
      formData.append("targetUserId", targetUserId)
      formData.append("newRole", newRole)
      return updateMemberRoleAction(projectId, formData)
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast({ variant: "destructive", title: "Role update failed", description: result.error })
        return
      }
      queryClient.invalidateQueries({ queryKey: ["members", projectId] })
      queryClient.invalidateQueries({ queryKey: ["member-counts", projectId] })
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      toast({ title: "Role updated!" })
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Role update failed", description: err.message })
    },
  })

  // Remove a member from the project
  const removeMemberMutation = useMutation({
    mutationFn: (targetUserId: string) => {
      if (!projectId) throw new Error("No project selected")
      const formData = new FormData()
      formData.append("targetUserId", targetUserId)
      return removeMemberAction(projectId, formData)
    },
    onMutate: async (targetUserId) => {
      await queryClient.cancelQueries({ queryKey: ["members", projectId] })
      const previousMembers = queryClient.getQueryData(["members", projectId])

      // Optimistic removal
      queryClient.setQueryData(["members", projectId], (old: any) =>
        old?.filter((m: any) => m.userId !== targetUserId)
      )
      return { previousMembers }
    },
    onSuccess: (result, _, context) => {
      if (!result.success) {
        queryClient.setQueryData(["members", projectId], context?.previousMembers)
        toast({ variant: "destructive", title: "Removal failed", description: result.error })
        return
      }
      queryClient.invalidateQueries({ queryKey: ["members", projectId] })
      queryClient.invalidateQueries({ queryKey: ["member-counts", projectId] })
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      toast({ title: "Member removed" })
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(["members", projectId], context?.previousMembers)
      toast({ variant: "destructive", title: "Removal failed", description: err.message })
    },
  })

  // Leave a project (self-removal for non-admins)
  const leaveProjectMutation = useMutation({
    mutationFn: () => {
      if (!projectId) throw new Error("No project selected")
      return leaveProjectAction(projectId)
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast({ variant: "destructive", title: "Failed to leave", description: result.error })
        return
      }
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["member-projects"] })
      toast({ title: "You left the project" })
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Failed to leave", description: err.message })
    },
  })

  return {
    // Data
    members,
    memberCounts: memberCounts ?? { total: 0, admins: 0, contributors: 0, viewers: 0 },
    memberProjects,

    // Loading states
    isLoadingMembers,
    isLoadingCounts,
    isLoadingProjects,
    isMembersError,

    // Mutations
    updateRole: updateRoleMutation.mutateAsync,
    isUpdatingRole: updateRoleMutation.isPending,

    removeMember: removeMemberMutation.mutateAsync,
    isRemoving: removeMemberMutation.isPending,

    leaveProject: leaveProjectMutation.mutateAsync,
    isLeaving: leaveProjectMutation.isPending,
  }
}

/**
 * Fetch a single member's detailed profile within a project.
 * Used by the member detail sheet.
 *
 * @param projectId - The project context
 * @param targetUserId - The member to view (null to skip)
 */
export function useMemberProfile(projectId: string | null, targetUserId: string | null) {
  return useQuery({
    queryKey: ["member-profile", projectId, targetUserId],
    queryFn: async () => {
      if (!projectId || !targetUserId) return null
      const result = await getMemberProfileAction(projectId, targetUserId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!projectId && !!targetUserId,
  })
}
