// ============================================================
// Global TypeScript types shared across the application
// ============================================================

// Theme
export type Theme = 'light' | 'dark' | 'system'

// API pagination
export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// Standard API envelope — mirrors Spring Boot ApiResponse<T>
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
  timestamp: string
  path: string
  status: number
}

// Paginated response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta
}

// Generic error shape
export interface AppError {
  message: string
  status: number
  path?: string
}

// User — lightweight representation used in navbar / sidebar
export interface UserProfile {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: 'STUDENT' | 'CREATOR' | 'ADMIN'
}

// Notification shape (placeholder)
export interface AppNotification {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

// Component size variants (used across UI components)
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// Component color variants
export type Variant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'ghost'
  | 'link'
  | 'outline'
  | 'success'
  | 'warning'
