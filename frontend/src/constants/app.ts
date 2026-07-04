// ============================================================
// Application-wide constants
// ============================================================

export const APP_NAME = 'AbhiIterates.OS' as const
export const APP_TAGLINE = 'The Operating System for Students' as const
export const APP_VERSION = '1.0.0' as const

// API
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
export const API_PREFIX = '/api/v1' as const
export const API_TIMEOUT_MS = 15_000

// Query keys — central registry prevents key typos
export const QUERY_KEYS = {
  user: ['user'] as const,
  resources: ['resources'] as const,
  marketplace: ['marketplace'] as const,
  subjects: ['subjects'] as const,
  library: ['library'] as const,
  notifications: ['notifications'] as const,
} as const

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// File upload limits (bytes)
export const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB
export const ALLOWED_FILE_TYPES = ['application/pdf'] as const

// Local storage keys
export const STORAGE_KEYS = {
  theme: 'abhi_os_theme',
  sidebarCollapsed: 'abhi_os_sidebar_collapsed',
} as const

// Navigation — sidebar items
export const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',   href: '/dashboard',   icon: 'LayoutDashboard' },
  { id: 'library',      label: 'Library',      href: '/library',     icon: 'BookOpen'        },
  { id: 'marketplace',  label: 'Marketplace',  href: '/marketplace', icon: 'ShoppingBag'     },
  { id: 'resources',    label: 'Resources',    href: '/resources',   icon: 'FolderOpen'      },
  { id: 'ai',           label: 'AI Workspace', href: '/ai',          icon: 'Sparkles'        },
] as const

export const NAV_BOTTOM_ITEMS = [
  { id: 'settings', label: 'Settings', href: '/settings', icon: 'Settings' },
] as const
