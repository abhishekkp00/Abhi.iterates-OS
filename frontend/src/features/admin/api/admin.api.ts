import { api } from '@/services/api'

export interface SystemStatus {
  serviceName: string
  status: 'UP' | 'DEGRADED' | 'DOWN'
  latency: string
  message: string
}

export interface AdminSummary {
  totalUsers: number
  totalResources: number
  totalListings: number
  totalConversations: number
  systemStatus: SystemStatus[]
  recentActivities: string[]
}

export interface AdminUser {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  roles: string[]
  active: boolean
  softDeleted: boolean
  createdAt: string
}

export const adminApi = {
  getSummary: async (): Promise<AdminSummary> => {
    const response = await api.get('/admin/summary')
    return response.data?.data
  },

  getUsers: async (params: {
    search?: string
    active?: boolean | null
    page?: number
    size?: number
  }): Promise<{ content: AdminUser[]; totalElements: number; totalPages: number }> => {
    const activeParam = params.active !== undefined && params.active !== null ? `&active=${params.active}` : ''
    const response = await api.get(`/admin/users?search=${params.search || ''}${activeParam}&page=${params.page || 0}&size=${params.size || 10}`)
    return response.data?.data
  },

  updateUserRoles: async (userId: string, roles: string[]): Promise<void> => {
    await api.put(`/admin/users/${userId}/roles`, { roles })
  },

  toggleUserStatus: async (userId: string, active: boolean): Promise<void> => {
    await api.patch(`/admin/users/${userId}/status?active=${active}`)
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/admin/users/${userId}`)
  },

  getMarketplaceListings: async (): Promise<any[]> => {
    const response = await api.get('/admin/marketplace')
    return response.data?.data
  },

  updateListingStatus: async (listingId: string, status: string): Promise<void> => {
    await api.patch(`/admin/marketplace/${listingId}/status?status=${status}`)
  },

  deleteListing: async (listingId: string): Promise<void> => {
    await api.delete(`/admin/marketplace/${listingId}`)
  },

  getLibraryResources: async (): Promise<any[]> => {
    const response = await api.get('/admin/resources')
    return response.data?.data
  },

  updateResourceStatus: async (resourceId: string, status: string): Promise<void> => {
    await api.patch(`/admin/resources/${resourceId}/status?status=${status}`)
  },

  deleteResource: async (resourceId: string): Promise<void> => {
    await api.delete(`/admin/resources/${resourceId}`)
  },

  getAiConversations: async (): Promise<any[]> => {
    const response = await api.get('/admin/ai/conversations')
    return response.data?.data
  },

  getAiConversationDetail: async (conversationId: string): Promise<any[]> => {
    const response = await api.get(`/admin/ai/conversations/${conversationId}`)
    return response.data?.data
  },

  getAuditLogs: async (search?: string): Promise<any[]> => {
    const response = await api.get(`/admin/audit?search=${search || ''}`)
    return response.data?.data
  },

  getSettings: async (): Promise<any> => {
    const response = await api.get('/admin/settings')
    return response.data?.data
  },

  updateSettings: async (settings: any): Promise<void> => {
    await api.put('/admin/settings', settings)
  },
}
