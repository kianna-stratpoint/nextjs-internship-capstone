"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import {
  getCalendarEventsAction,
  createCalendarEventAction,
  updateCalendarEventAction,
  deleteCalendarEventAction,
} from "@/lib/actions/calendar"

export function useCalendar(
  startRange: string | null,
  endRange: string | null,
  projectFilter?: string | null
) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const queryKey = ["calendar-events", startRange, endRange, projectFilter]

  // Fetch events
  const {
    data: events = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!startRange || !endRange) return []
      const result = await getCalendarEventsAction(startRange, endRange, projectFilter)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!startRange && !!endRange,
    staleTime: 30_000,
  })

  // Create event
  const createMutation = useMutation({
    mutationFn: (data: any) => createCalendarEventAction(data),
    onSuccess: (result) => {
      if (!result.success) {
        toast({ variant: "destructive", title: "Failed", description: result.error })
        return
      }
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
      toast({ title: "Event created!" })
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Failed", description: err.message })
    },
  })

  // Update event
  const updateMutation = useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: any }) =>
      updateCalendarEventAction(eventId, data),
    onSuccess: (result) => {
      if (!result.success) {
        toast({ variant: "destructive", title: "Failed", description: result.error })
        return
      }
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
      toast({ title: "Event updated!" })
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Failed", description: err.message })
    },
  })

  // Delete event
  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => deleteCalendarEventAction(eventId),
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: any) => old?.filter((e: any) => e.id !== eventId))
      return { previous }
    },
    onSuccess: (result, _, context) => {
      if (!result.success) {
        queryClient.setQueryData(queryKey, context?.previous)
        toast({ variant: "destructive", title: "Failed", description: result.error })
        return
      }
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
      toast({ title: "Event deleted" })
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      toast({ variant: "destructive", title: "Failed", description: err.message })
    },
  })

  return {
    events,
    isLoading,
    isError,

    createEvent: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateEvent: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteEvent: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}
