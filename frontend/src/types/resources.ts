export type ResourceCategory = 'LECTURE' | 'BOOK' | 'CHEATSHEET' | 'PAST_PAPER' | 'OTHER'

export type ResourceStatus = 'ACTIVE' | 'ARCHIVED' | 'DRAFT'

export type ResourcePriority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface ResourceAttachment {
  id: string
  fileName: string
  fileSize: number
  contentType: string
  downloadUrl: string
}

export interface Resource {
  id: string
  title: string
  description?: string
  category: ResourceCategory
  status: ResourceStatus
  priority: ResourcePriority
  deadline?: string // ISO date string
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
  attachments: ResourceAttachment[]
  tags?: string
  userId: string
}
