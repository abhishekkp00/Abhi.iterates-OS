import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storeApi, StoreResourceRequest, UpiPurchasePayload } from '../api/storeApi'
import { toast } from 'sonner'

export function useStoreResourcesQuery(params?: { search?: string; category?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: ['store-resources', params],
    queryFn: () => storeApi.getStoreResources(params),
  })
}

export function useStoreCategoriesQuery() {
  return useQuery({
    queryKey: ['store-categories'],
    queryFn: () => storeApi.getCategories(),
  })
}

export function useMyPurchasesQuery() {
  return useQuery({
    queryKey: ['my-purchases'],
    queryFn: () => storeApi.getMyPurchases(),
  })
}

export function useUpiPurchaseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ resourceId, payload }: { resourceId: string; payload: UpiPurchasePayload }) =>
      storeApi.purchaseWithUpi(resourceId, payload),
    onSuccess: (data) => {
      toast.success(`Access granted! "${data.title}" unlocked successfully.`)
      queryClient.invalidateQueries({ queryKey: ['store-resources'] })
      queryClient.invalidateQueries({ queryKey: ['my-purchases'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to complete UPI purchase.')
    },
  })
}

export function useAdminStoreResourcesQuery() {
  return useQuery({
    queryKey: ['admin-store-resources'],
    queryFn: () => storeApi.getAllStoreResourcesAdmin(),
  })
}

export function useAdminCreateStoreResourceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: StoreResourceRequest) => storeApi.createStoreResourceAdmin(data),
    onSuccess: (data) => {
      toast.success(`Store note "${data.title}" created & listed successfully!`)
      queryClient.invalidateQueries({ queryKey: ['admin-store-resources'] })
      queryClient.invalidateQueries({ queryKey: ['store-resources'] })
      queryClient.invalidateQueries({ queryKey: ['store-categories'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to upload store resource.')
    },
  })
}

export function useAdminUpdateStoreResourceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StoreResourceRequest }) =>
      storeApi.updateStoreResourceAdmin(id, data),
    onSuccess: (data) => {
      toast.success(`Store note "${data.title}" updated!`)
      queryClient.invalidateQueries({ queryKey: ['admin-store-resources'] })
      queryClient.invalidateQueries({ queryKey: ['store-resources'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update store resource.')
    },
  })
}

export function useAdminDeleteStoreResourceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => storeApi.deleteStoreResourceAdmin(id),
    onSuccess: () => {
      toast.success('Store resource deactivated.')
      queryClient.invalidateQueries({ queryKey: ['admin-store-resources'] })
      queryClient.invalidateQueries({ queryKey: ['store-resources'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete store resource.')
    },
  })
}
