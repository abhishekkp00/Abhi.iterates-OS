import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { calendarApi } from '../api/calendar.api'
import { toast } from 'sonner'
import type { CalendarEventRequest } from '@/types/productivity'

export function useCalendar() {
  const queryClient = useQueryClient()

  const eventsQuery = useQuery({
    queryKey: ['calendar'],
    queryFn: calendarApi.list,
  })

  const createEventMutation = useMutation({
    mutationFn: calendarApi.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] }) // Invalidate tasks summary as todayTasksCount could change
      toast.success('Event added successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create event')
    },
  })

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CalendarEventRequest }) => calendarApi.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Event updated successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update event')
    },
  })

  const deleteEventMutation = useMutation({
    mutationFn: calendarApi.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Event deleted successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete event')
    },
  })

  return {
    events: eventsQuery.data || [],
    isLoadingEvents: eventsQuery.isLoading,
    createEvent: createEventMutation.mutateAsync,
    isCreatingEvent: createEventMutation.isPending,
    updateEvent: updateEventMutation.mutateAsync,
    isUpdatingEvent: updateEventMutation.isPending,
    deleteEvent: deleteEventMutation.mutateAsync,
    isDeletingEvent: deleteEventMutation.isPending,
  }
}
