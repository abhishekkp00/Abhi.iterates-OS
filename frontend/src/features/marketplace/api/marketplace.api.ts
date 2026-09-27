import { api } from '@/services/api'
import type { Listing, ListingCategory, ListingCondition, ListingStatus } from '@/types/marketplace'

export interface MarketplaceFilterParams {
  search?: string
  categories?: ListingCategory[] | string
  conditions?: ListingCondition[] | string
  statuses?: ListingStatus[] | string
  page?: number
  size?: number
  sort?: string
}

export interface MarketplaceListingPayload {
  title: string
  description?: string
  price: number
  negotiable?: boolean
  category: ListingCategory
  condition: ListingCondition
  location?: string
  status?: ListingStatus
  tags?: string
  imageUrls?: string[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

const BASE = '/marketplace'

export const marketplaceApi = {
  list: async (params?: MarketplaceFilterParams): Promise<PageResponse<Listing>> => {
    const res = await api.get<{ data: PageResponse<Listing> }>(BASE, { params })
    return res.data.data
  },

  getMyListings: async (params?: { page?: number; size?: number; sort?: string }): Promise<PageResponse<Listing>> => {
    const res = await api.get<{ data: PageResponse<Listing> }>(`${BASE}/my-listings`, { params })
    return res.data.data
  },

  get: async (id: string): Promise<Listing> => {
    const res = await api.get<{ data: Listing }>(`${BASE}/${id}`)
    return res.data.data
  },

  create: async (data: MarketplaceListingPayload): Promise<Listing> => {
    const res = await api.post<{ data: Listing }>(BASE, data)
    return res.data.data
  },

  update: async (id: string, data: MarketplaceListingPayload): Promise<Listing> => {
    const res = await api.put<{ data: Listing }>(`${BASE}/${id}`, data)
    return res.data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },

  changeStatus: async (id: string, status: ListingStatus): Promise<Listing> => {
    const res = await api.patch<{ data: Listing }>(`${BASE}/${id}/status`, null, {
      params: { status },
    })
    return res.data.data
  },
}
