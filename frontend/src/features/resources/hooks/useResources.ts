import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resourcesApi, type ResourceQueryParams } from '../api/resources.api'
import type { Resource } from '@/types/resources'
import { toast } from 'sonner'

export function useResourcesListQuery(params: ResourceQueryParams) {
  return useQuery({
    queryKey: ['resources', params],
    queryFn: () => resourcesApi.getAll(params),
    placeholderData: (previousData) => previousData, // keep previous page data during pagination transitions
    staleTime: 5000,
  })
}

export function useResourceDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['resource', id],
    queryFn: () => resourcesApi.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // Cache individual items for 5 mins
  })
}

export function useCreateResourceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resourcesApi.create,
    onSuccess: () => {
      toast.success('Resource created successfully!')
      // Invalidate resource list query cache
      queryClient.invalidateQueries({ queryKey: ['resources'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create resource.')
    },
  })
}

export function useUpdateResourceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, resource }: { id: string; resource: Partial<Resource> }) =>
      resourcesApi.update(id, resource),
    onSuccess: (data) => {
      toast.success('Resource updated successfully!')
      // Invalidate specific resource and list queries
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['resource', data.id] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update resource.')
    },
  })
}

export function useDeleteResourceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resourcesApi.delete,
    // Optimistic Update deletion
    onMutate: async (deletedId: string) => {
      // Cancel outgoing queries to avoid overwriting optimistic state
      await queryClient.cancelQueries({ queryKey: ['resources'] })

      // Snapshot previous query data state
      const previousResources = queryClient.getQueryData(['resources'])

      return { previousResources, deletedId }
    },
    onSuccess: () => {
      toast.success('Resource deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['resources'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete resource.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
    },
  })
}

export function useArchiveResourceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resourcesApi.archive,
    // Optimistic Update status mapping
    onMutate: async (archivedId: string) => {
      await queryClient.cancelQueries({ queryKey: ['resources'] })
      await queryClient.cancelQueries({ queryKey: ['resource', archivedId] })

      const previousDetail = queryClient.getQueryData(['resource', archivedId])

      // Optimistically update resource detail status
      if (previousDetail) {
        queryClient.setQueryData(['resource', archivedId], (old: Resource | undefined) => {
          if (!old) return old
          return { ...old, status: 'ARCHIVED' }
        })
      }

      return { previousDetail, archivedId }
    },
    onSuccess: (data) => {
      toast.success('Resource archived successfully!')
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['resource', data.id] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to archive resource.')
    },
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['resources'] })
        queryClient.invalidateQueries({ queryKey: ['resource', data.id] })
      }
    },
  })
}

export function useUploadAttachmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      resourceId,
      file,
      onUploadProgress,
    }: {
      resourceId: string
      file: File
      onUploadProgress?: (progressEvent: any) => void
    }) => resourcesApi.uploadAttachment(resourceId, file, onUploadProgress),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resource', variables.resourceId] })
    },
  })
}

export function useDeleteAttachmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ attachmentId }: { attachmentId: string; resourceId: string }) =>
      resourcesApi.deleteAttachment(attachmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resource', variables.resourceId] })
      toast.success('Attachment removed successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove attachment.')
    },
  })
}
