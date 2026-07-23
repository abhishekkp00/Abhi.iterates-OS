// ============================================================
// Application-wide constants
// ============================================================

export const APP_NAME = 'AbhiIterates.OS' as const
export const APP_TAGLINE = 'The Operating System for Students' as const
export const APP_VERSION = '1.0.0' as const

// API
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8095'
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

// ── Navigation types ──────────────────────────────────────────────────────────

export type NavItem = {
  readonly id: string
  readonly label: string
  readonly href: string
  readonly icon: string
  /** Optional: show a badge (e.g. notification count) */
  readonly badge?: number
  /** Optional: mark as coming soon — renders disabled with a "Soon" badge */
  readonly soon?: boolean
}

export type NavGroup = {
  readonly id: string
  /** If null, no label is rendered above this group (used for the primary "Dashboard" item) */
  readonly label: string | null
  readonly items: readonly NavItem[]
}

// ── Navigation groups ─────────────────────────────────────────────────────────
//
// Structure:
//   - null label  → no section header (used for top-level Overview group)
//   - string label → rendered as a small uppercase section label in the sidebar
//
// Design rule: keep groups short (1–3 items). Long groups are harder to scan.
// Navigation groups are the primary wayfinding tool — they must feel intentional.

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: 'overview',
    label: null,
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
      { id: 'analytics', label: 'Analytics', href: '/analytics', icon: 'BarChart3' },
    ],
  },
  {
    id: 'productivity',
    label: 'Productivity',
    items: [
      { id: 'planner',   label: 'Planner',   href: '/planner',   icon: 'Clock' },
      { id: 'tasks',     label: 'Tasks',     href: '/tasks',     icon: 'List' },
      { id: 'calendar',  label: 'Calendar',  href: '/calendar',  icon: 'Calendar' },
    ],
  },
  {
    id: 'study',
    label: 'Study',
    items: [
      { id: 'library',   label: 'Library',      href: '/library',   icon: 'BookOpen'  },
      { id: 'resources', label: 'My Resources',  href: '/resources', icon: 'FolderOpen' },
      { id: 'ai',        label: 'AI Workspace',  href: '/ai',        icon: 'Sparkles'  },
    ],
  },
] as const


// Bottom items stay flat — they're persistent utility links, not grouped features.
export const NAV_BOTTOM_ITEMS: readonly NavItem[] = [
  { id: 'settings', label: 'Settings', href: '/settings', icon: 'Settings' },
] as const

// ── Breadcrumb route labels ───────────────────────────────────────────────────
// Maps URL path segments → human-readable labels.
// Used by the Breadcrumbs component to auto-generate crumbs from location.pathname.

export const ROUTE_LABELS: Readonly<Record<string, string>> = {
  dashboard:    'Dashboard',
  library:      'Library',
  marketplace:  'Marketplace',
  resources:    'My Resources',
  ai:           'AI Workspace',
  settings:     'Settings',
  profile:      'Profile',
  security:     'Security',
  notifications:'Notifications',
  appearance:   'Appearance',
  new:          'Add Resource',
  edit:         'Edit',
  planner:      'Planner',
  tasks:        'Tasks',
  calendar:     'Calendar',
  day:          'Day',
  week:         'Week',
  month:        'Month',
  activity:     'Activity Log',
  comments:     'Comments & Discussions',
  analytics:    'Analytics',
  productivity: 'Productivity Metrics',
} as const

// ── Legacy flat arrays (kept for backward compatibility during migration) ──────
// Sidebar.tsx now reads NAV_GROUPS directly.
// These may be removed once all consumers are migrated.
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items) as NavItem[]
