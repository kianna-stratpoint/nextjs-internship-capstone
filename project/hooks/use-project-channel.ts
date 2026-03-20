"use client"

/* ============================================
   useProjectChannel Hook

   Subscribes to a project's Pusher channel and
   invalidates React Query caches when events
   arrive so the UI updates automatically.

   IMPORTANT: Query keys here MUST match the keys
   used in the actual hooks:
   - use-lists.ts:       ["project-lists", projectId]
   - use-projects.ts:    ["projects", ...]
   - use-comments.ts:    ["comments", taskId]
   - use-team-member.ts: ["members", projectId]
   - use-invitations.ts: ["invitations", projectId]
   ============================================ */

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { Channel } from "pusher-js"
import { usePusher } from "@/components/providers/pusher-provider"
import { PUSHER_EVENTS, getProjectChannel } from "@/lib/pusher/events"

/**
 * Subscribe to real-time events for a project.
 * Automatically invalidates relevant React Query caches
 * when events are received.
 *
 * @param projectId - The project to subscribe to (null to skip)
 */
export function useProjectChannel(projectId: string | null) {
  const pusher = usePusher()
  const queryClient = useQueryClient()
  const channelRef = useRef<Channel | null>(null)

  useEffect(() => {
    if (!pusher || !projectId) return

    const channelName = getProjectChannel(projectId)
    const channel = pusher.subscribe(channelName)
    channelRef.current = channel

    // Helper: invalidate the board data (lists + nested tasks)
    const invalidateBoard = () => {
      queryClient.invalidateQueries({ queryKey: ["project-lists", projectId] })
    }

    // Helper: invalidate the projects list (cards, stats, header)
    const invalidateProjects = () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    }

    /* ==================== TASK EVENTS ==================== */

    channel.bind(PUSHER_EVENTS.TASK_CREATED, () => {
      invalidateBoard()
      invalidateProjects()
    })

    channel.bind(PUSHER_EVENTS.TASK_UPDATED, (data: any) => {
      invalidateBoard()
      if (data?.taskId) {
        queryClient.invalidateQueries({ queryKey: ["task-detail", data.taskId] })
        queryClient.invalidateQueries({ queryKey: ["task-activity", data.taskId] })
      }
    })

    channel.bind(PUSHER_EVENTS.TASK_MOVED, () => {
      invalidateBoard()
      invalidateProjects()
    })

    channel.bind(PUSHER_EVENTS.TASK_DELETED, () => {
      invalidateBoard()
      invalidateProjects()
    })

    channel.bind(PUSHER_EVENTS.TASK_ASSIGNED, (data: any) => {
      invalidateBoard()
      if (data?.taskId) {
        queryClient.invalidateQueries({ queryKey: ["task-detail", data.taskId] })
      }
    })

    channel.bind(PUSHER_EVENTS.TASK_UNASSIGNED, (data: any) => {
      invalidateBoard()
      if (data?.taskId) {
        queryClient.invalidateQueries({ queryKey: ["task-detail", data.taskId] })
      }
    })

    channel.bind(PUSHER_EVENTS.TASK_COMPLETED, () => {
      invalidateBoard()
      invalidateProjects()
    })

    /* ==================== LIST EVENTS ==================== */

    channel.bind(PUSHER_EVENTS.LIST_CREATED, () => {
      invalidateBoard()
    })

    channel.bind(PUSHER_EVENTS.LIST_UPDATED, () => {
      invalidateBoard()
    })

    channel.bind(PUSHER_EVENTS.LIST_DELETED, () => {
      invalidateBoard()
    })

    channel.bind(PUSHER_EVENTS.LIST_REORDERED, () => {
      invalidateBoard()
    })

    /* ==================== MEMBER EVENTS ==================== */

    channel.bind(PUSHER_EVENTS.MEMBER_JOINED, () => {
      queryClient.invalidateQueries({ queryKey: ["members", projectId] })
      queryClient.invalidateQueries({ queryKey: ["member-counts", projectId] })
      invalidateProjects()
    })

    channel.bind(PUSHER_EVENTS.MEMBER_REMOVED, () => {
      queryClient.invalidateQueries({ queryKey: ["members", projectId] })
      queryClient.invalidateQueries({ queryKey: ["member-counts", projectId] })
      invalidateProjects()
    })

    channel.bind(PUSHER_EVENTS.MEMBER_ROLE_CHANGED, () => {
      queryClient.invalidateQueries({ queryKey: ["members", projectId] })
      queryClient.invalidateQueries({ queryKey: ["member-counts", projectId] })
    })

    /* ==================== INVITATION EVENTS ==================== */

    channel.bind(PUSHER_EVENTS.INVITATION_CREATED, () => {
      queryClient.invalidateQueries({ queryKey: ["invitations", projectId] })
    })

    channel.bind(PUSHER_EVENTS.INVITATION_RESPONDED, () => {
      queryClient.invalidateQueries({ queryKey: ["invitations", projectId] })
      queryClient.invalidateQueries({ queryKey: ["members", projectId] })
      queryClient.invalidateQueries({ queryKey: ["member-counts", projectId] })
    })

    /* ==================== COMMENT EVENTS ==================== */

    // Comments are keyed by taskId, not projectId.
    // We receive the taskId in the event payload.
    channel.bind(PUSHER_EVENTS.COMMENT_ADDED, (data: any) => {
      if (data?.taskId) {
        queryClient.invalidateQueries({ queryKey: ["comments", data.taskId] })
      }
    })

    channel.bind(PUSHER_EVENTS.COMMENT_DELETED, (data: any) => {
      if (data?.taskId) {
        queryClient.invalidateQueries({ queryKey: ["comments", data.taskId] })
      }
    })

    /* ==================== PROJECT EVENTS ==================== */

    channel.bind(PUSHER_EVENTS.PROJECT_UPDATED, () => {
      invalidateBoard()
      invalidateProjects()
    })

    /* ==================== CLEANUP ==================== */

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(channelName)
      channelRef.current = null
    }
  }, [pusher, projectId, queryClient])
}
