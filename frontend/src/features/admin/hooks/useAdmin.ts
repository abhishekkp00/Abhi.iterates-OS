import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../api/admin.api'
import { toast } from 'sonner'

export function useAdminSummaryQuery() {
  return useQuery({
    queryKey: ['admin', 'summary'],
    queryFn: adminApi.getSummary,
    staleTime: 1000 * 30, // 30 seconds cache
    refetchOnWindowFocus: true,
  })
}

export function useAdminUsersQuery(params: {
  search?: string
  active?: boolean | null
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.getUsers(params),
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  })
}

export function useUpdateUserRolesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
      adminApi.updateUserRoles(userId, roles),
    onSuccess: () => {
      toast.success('User roles updated successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update user roles')
    },
  })
}

export function useToggleUserStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      adminApi.toggleUserStatus(userId, active),
    onSuccess: (_, variables) => {
      toast.success(variables.active ? 'User reactivated successfully' : 'User deactivated successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to toggle user status')
    },
  })
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      toast.success('User soft-deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    },
  })
}

export function useAdminMarketplaceQuery() {
  return useQuery({
    queryKey: ['admin', 'marketplace'],
    queryFn: adminApi.getMarketplaceListings,
    staleTime: 5000,
  })
}

export function useUpdateListingStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ listingId, status }: { listingId: string; status: string }) =>
      adminApi.updateListingStatus(listingId, status),
    onSuccess: (_, variables) => {
      toast.success(`Listing status updated to ${variables.status}`)
      queryClient.invalidateQueries({ queryKey: ['admin', 'marketplace'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to moderate listing')
    },
  })
}

export function useDeleteListingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (listingId: string) => adminApi.deleteListing(listingId),
    onSuccess: () => {
      toast.success('Listing permanently deleted')
      queryClient.invalidateQueries({ queryKey: ['admin', 'marketplace'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete listing')
    },
  })
}

export function useAdminResourcesQuery() {
  return useQuery({
    queryKey: ['admin', 'resources'],
    queryFn: adminApi.getLibraryResources,
    staleTime: 5000,
  })
}

export function useUpdateResourceStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ resourceId, status }: { resourceId: string; status: string }) =>
      adminApi.updateResourceStatus(resourceId, status),
    onSuccess: (_, variables) => {
      toast.success(`Resource status updated to ${variables.status}`)
      queryClient.invalidateQueries({ queryKey: ['admin', 'resources'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to moderate resource')
    },
  })
}

export function useDeleteResourceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (resourceId: string) => adminApi.deleteResource(resourceId),
    onSuccess: () => {
      toast.success('Resource permanently deleted')
      queryClient.invalidateQueries({ queryKey: ['admin', 'resources'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete resource')
    },
  })
}

export function useAdminAiConversationsQuery() {
  return useQuery({
    queryKey: ['admin', 'ai-conversations'],
    queryFn: adminApi.getAiConversations,
    staleTime: 5000,
  })
}

export function useAdminAiConversationDetailQuery(conversationId: string | null) {
  return useQuery({
    queryKey: ['admin', 'ai-conversations', conversationId],
    queryFn: () => adminApi.getAiConversationDetail(conversationId!),
    enabled: !!conversationId,
    staleTime: 5000,
  })
}

export function useAdminAuditLogsQuery(search?: string) {
  return useQuery({
    queryKey: ['admin', 'audit', search],
    queryFn: () => adminApi.getAuditLogs(search),
    staleTime: 5000,
  })
}

export function useAdminSettingsQuery() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminApi.getSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  })
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: any) => adminApi.updateSettings(settings),
    onSuccess: () => {
      toast.success('System settings saved successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save system settings')
    },
  })
}
