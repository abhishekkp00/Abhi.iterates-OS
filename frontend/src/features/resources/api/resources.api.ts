import { api } from '@/services/api'
import type { Resource, ResourceCategory, ResourceStatus, ResourcePriority, ResourceAttachment } from '@/types/resources'

export interface ResourceQueryParams {
  search?: string
  categories?: ResourceCategory[]
  priorities?: ResourcePriority[]
  statuses?: ResourceStatus[]
  page?: number
  size?: number
  sort?: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface ApiResponseEnvelope<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
  path: string
  status: number
}

export const resourcesApi = {
  /**
   * Get all resources with search, filters, pagination, and sorting.
   */
  getAll: async (params: ResourceQueryParams = {}): Promise<PaginatedResponse<Resource>> => {
    // Format parameters to match Spring Boot parameter expectations
    const queryParams: Record<string, string | number> = {
      page: params.page !== undefined ? params.page - 1 : 0, // Spring Boot is 0-indexed
      size: params.size ?? 10,
      sort: params.sort ?? 'createdAt,desc',
    }

    if (params.search?.trim()) {
      queryParams.search = params.search.trim()
    }

    // Join lists as comma-separated values to pass clean array queries
    if (params.categories && params.categories.length > 0) {
      queryParams.categories = params.categories.join(',')
    }
    if (params.priorities && params.priorities.length > 0) {
      queryParams.priorities = params.priorities.join(',')
    }
    if (params.statuses && params.statuses.length > 0) {
      queryParams.statuses = params.statuses.join(',')
    }

    const response = await api.get<ApiResponseEnvelope<PaginatedResponse<Resource>>>('/resources', {
      params: queryParams,
    })
    return response.data.data
  },

  /**
   * Get single resource by ID.
   */
  getById: async (id: string): Promise<Resource> => {
    const response = await api.get<ApiResponseEnvelope<Resource>>(`/resources/${id}`)
    return response.data.data
  },

  /**
   * Create a new resource.
   */
  create: async (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'attachments' | 'userId'>): Promise<Resource> => {
    const response = await api.post<ApiResponseEnvelope<Resource>>('/resources', resource)
    return response.data.data
  },

  /**
   * Update an existing resource.
   */
  update: async (id: string, resource: Partial<Resource>): Promise<Resource> => {
    const response = await api.put<ApiResponseEnvelope<Resource>>(`/resources/${id}`, resource)
    return response.data.data
  },

  /**
   * Delete a resource by ID.
   */
  delete: async (id: string): Promise<void> => {
    await api.delete<ApiResponseEnvelope<VoidFunction>>(`/resources/${id}`)
  },

  /**
   * Archive a resource by ID.
   */
  archive: async (id: string): Promise<Resource> => {
    const response = await api.patch<ApiResponseEnvelope<Resource>>(`/resources/${id}/archive`)
    return response.data.data
  },

  /**
   * Upload an attachment to a resource.
   */
  uploadAttachment: async (
    resourceId: string,
    file: File,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<ResourceAttachment> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post<ApiResponseEnvelope<ResourceAttachment>>(
      `/resources/${resourceId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      }
    )
    return response.data.data
  },

  /**
   * Delete an attachment.
   */
  deleteAttachment: async (attachmentId: string): Promise<void> => {
    await api.delete<ApiResponseEnvelope<void>>(`/resources/attachments/${attachmentId}`)
  },
}
