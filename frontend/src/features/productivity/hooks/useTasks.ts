import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks.api'
import { toast } from 'sonner'
import type { Task, TaskRequest } from '@/types/productivity'

export function useTasks() {
  const queryClient = useQueryClient()

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.list,
  })

  const summaryQuery = useQuery({
    queryKey: ['tasks', 'summary'],
    queryFn: tasksApi.getSummary,
  })

  const invalidateAllPlannerQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['analytics'] })
  }

  const createTaskMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      invalidateAllPlannerQueries()
      toast.success('Task created successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create task')
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskRequest }) => tasksApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(['tasks'], (old) =>
          old ? old.map((t) => (t.id === id ? { ...t, ...data } : t)) : []
        )
      }

      return { previousTasks }
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
      toast.error(err.response?.data?.message || 'Failed to update task')
    },
    onSettled: () => {
      invalidateAllPlannerQueries()
      toast.success('Task updated successfully')
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: tasksApi.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(['tasks'], (old) =>
          old ? old.filter((t) => t.id !== id) : []
        )
      }

      return { previousTasks }
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
      toast.error(err.response?.data?.message || 'Failed to delete task')
    },
    onSettled: () => {
      invalidateAllPlannerQueries()
      toast.success('Task deleted successfully')
    },
  })

  return {
    tasks: tasksQuery.data || [],
    isLoadingTasks: tasksQuery.isLoading,
    summary: summaryQuery.data,
    isLoadingSummary: summaryQuery.isLoading,
    createTask: createTaskMutation.mutateAsync,
    isCreatingTask: createTaskMutation.isPending,
    updateTask: updateTaskMutation.mutateAsync,
    isUpdatingTask: updateTaskMutation.isPending,
    deleteTask: deleteTaskMutation.mutateAsync,
    isDeletingTask: deleteTaskMutation.isPending,
  }
}
