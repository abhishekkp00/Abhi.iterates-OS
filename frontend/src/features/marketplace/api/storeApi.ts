import { api } from '@/services/api'

export interface StoreResourceItem {
  id: string
  title: string
  description: string
  category: string
  priceInRupees: number
  expiryDate: string | null
  fileUrl: string
  fileName: string | null
  fileSize: number | null
  previewUrl: string | null
  active: boolean
  tags: string | null
  createdAt: string
  isPurchased: boolean
  isExpired: boolean
  purchaseExpiresAt: string | null
  paymentRefId: string | null
}

export interface StoreResourceRequest {
  title: string
  description: string
  category: string
  priceInRupees: number
  expiryDate?: string | null
  fileUrl: string
  fileName?: string
  previewUrl?: string
  tags?: string
}

export interface UpiPurchasePayload {
  paymentRefId: string
}

export const storeApi = {
  // Student API
  getStoreResources: async (params?: { search?: string; category?: string; page?: number; size?: number }) => {
    const res = await api.get('/marketplace/store', { params })
    return res.data.data // Returns Page<StoreResourceItem>
  },

  getCategories: async () => {
    const res = await api.get('/marketplace/store/categories')
    return res.data.data as string[]
  },

  purchaseWithUpi: async (resourceId: string, payload: UpiPurchasePayload) => {
    const res = await api.post(`/marketplace/store/${resourceId}/purchase`, payload)
    return res.data.data as StoreResourceItem
  },

  getMyPurchases: async () => {
    const res = await api.get('/marketplace/store/my-purchases')
    return res.data.data as StoreResourceItem[]
  },

  // Admin API
  getAllStoreResourcesAdmin: async () => {
    const res = await api.get('/admin/store-resources')
    return res.data.data as StoreResourceItem[]
  },

  createStoreResourceAdmin: async (data: StoreResourceRequest) => {
    const res = await api.post('/admin/store-resources', data)
    return res.data.data as StoreResourceItem
  },

  updateStoreResourceAdmin: async (id: string, data: StoreResourceRequest) => {
    const res = await api.put(`/admin/store-resources/${id}`, data)
    return res.data.data as StoreResourceItem
  },

  deleteStoreResourceAdmin: async (id: string) => {
    const res = await api.delete(`/admin/store-resources/${id}`)
    return res.data.data
  },
}
