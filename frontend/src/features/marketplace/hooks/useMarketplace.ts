import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { marketplaceApi, MarketplaceFilterParams, MarketplaceListingPayload } from '../api/marketplace.api'
import { toast } from 'sonner'
import type { ListingStatus } from '@/types/marketplace'

export function useMarketplaceListingsQuery(params?: MarketplaceFilterParams) {
  const searchKey = params?.search ?? ''
  const categoryKey = Array.isArray(params?.categories)
    ? params?.categories.join(',')
    : params?.categories ?? ''
  const conditionKey = Array.isArray(params?.conditions)
    ? params?.conditions.join(',')
    : params?.conditions ?? ''
  const pageKey = params?.page ?? 0
  const sortKey = params?.sort ?? 'createdAt,desc'

  return useQuery({
    queryKey: ['marketplace-listings', searchKey, categoryKey, conditionKey, pageKey, sortKey],
    queryFn: () => marketplaceApi.list(params),
    staleTime: 1000 * 15,
  })
}

export function useMyMarketplaceListingsQuery(params?: { page?: number; size?: number; sort?: string }) {
  const pageKey = params?.page ?? 0
  const sortKey = params?.sort ?? 'createdAt,desc'

  return useQuery({
    queryKey: ['my-marketplace-listings', pageKey, sortKey],
    queryFn: () => marketplaceApi.getMyListings(params),
    staleTime: 1000 * 15,
  })
}

export function useMarketplaceListingQuery(id?: string) {
  return useQuery({
    queryKey: ['marketplace-listing', id],
    queryFn: () => marketplaceApi.get(id!),
    enabled: Boolean(id),
  })
}

export function useCreateMarketplaceListingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: MarketplaceListingPayload) => marketplaceApi.create(data),
    onSuccess: (data) => {
      toast.success(`Listing "${data.title}" published successfully!`)
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] })
      queryClient.invalidateQueries({ queryKey: ['my-marketplace-listings'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to publish listing.')
    },
  })
}

export function useUpdateMarketplaceListingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MarketplaceListingPayload }) =>
      marketplaceApi.update(id, data),
    onSuccess: (data) => {
      toast.success(`Listing "${data.title}" updated successfully!`)
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] })
      queryClient.invalidateQueries({ queryKey: ['my-marketplace-listings'] })
      queryClient.invalidateQueries({ queryKey: ['marketplace-listing', data.id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update listing.')
    },
  })
}

export function useDeleteMarketplaceListingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => marketplaceApi.delete(id),
    onSuccess: () => {
      toast.success('Listing deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] })
      queryClient.invalidateQueries({ queryKey: ['my-marketplace-listings'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete listing.')
    },
  })
}

export function useChangeMarketplaceListingStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ListingStatus }) =>
      marketplaceApi.changeStatus(id, status),
    onSuccess: (data) => {
      toast.success(`Listing status updated to ${data.status}!`)
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] })
      queryClient.invalidateQueries({ queryKey: ['my-marketplace-listings'] })
      queryClient.invalidateQueries({ queryKey: ['marketplace-listing', data.id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update listing status.')
    },
  })
}
