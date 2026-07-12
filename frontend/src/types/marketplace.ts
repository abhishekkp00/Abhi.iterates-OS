export type ListingCategory = 'BOOKS' | 'ELECTRONICS' | 'HOUSING' | 'SERVICES' | 'CLOTHING' | 'OTHER'

export type ListingCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR'

export type ListingStatus = 'ACTIVE' | 'SOLD' | 'DRAFT' | 'ARCHIVED'

export interface ListingImage {
  id: string
  imageUrl: string
  isPrimary: boolean
}

export interface ListingSeller {
  id: string
  fullName: string
  avatarUrl?: string
  email: string
}

export interface Listing {
  id: string
  title: string
  description?: string
  price: number
  negotiable: boolean
  category: ListingCategory
  condition: ListingCondition
  location?: string
  status: ListingStatus
  seller: ListingSeller
  images: ListingImage[]
  isFavorited?: boolean
  createdAt: string
  updatedAt: string
  tags?: string
}
