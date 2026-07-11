import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/store/sidebar.store'
import { NAV_ITEMS, NAV_BOTTOM_ITEMS, APP_NAME } from '@/constants/app'
import {
  LayoutDashboard, BookOpen, ShoppingBag, FolderOpen, Sparkles, Settings,
  PanelLeftClose, PanelLeftOpen, GraduationCap,
} from '@/lib/icons'

// ── Icon registry ────────────────────────────────────────────────────────────
// Keeps the constants file free of React component imports.
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  BookOpen,
  ShoppingBag,
  FolderOpen,
  Sparkles,
  Settings,
}

// ── NavItem ──────────────────────────────────────────────────────────────────
interface NavItemProps {
  item: (typeof NAV_ITEMS)[number] | (typeof NAV_BOTTOM_ITEMS)[number]
  isCollapsed: boolean
  /** Called when the user clicks a nav link — used by MobileDrawer to close itself */
  onNavigate?: () => void
}

export function NavItem({ item, isCollapsed, onNavigate }: NavItemProps) {
  const Icon = ICON_MAP[item.icon]

  return (
    <NavLink
      to={item.href}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-md px-2.5 py-2',
          'text-sm font-medium transition-colors duration-100',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70',
          isCollapsed && 'justify-center px-2'
        )
      }
    >
      {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}

      {/* Label — animated in/out when sidebar collapses */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Tooltip — only visible when sidebar is collapsed (icon-only mode) */}
      {isCollapsed && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-full ml-2 z-50',
            'rounded-md bg-foreground px-2 py-1 text-xs text-background',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
            'whitespace-nowrap shadow-lg'
          )}
        >
          {item.label}
        </span>
      )}
    </NavLink>
  )
}

// ── SidebarContent ───────────────────────────────────────────────────────────
// Extracted so MobileDrawer can render the same content without duplicating markup.
interface SidebarContentProps {
  isCollapsed: boolean
  onNavigate?: () => void
}

export function SidebarContent({ isCollapsed, onNavigate }: SidebarContentProps) {
  const { toggle } = useSidebarStore()

  return (
    <>
      {/* Brand logo row */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-sidebar-border px-3',
          isCollapsed ? 'justify-center' : 'gap-2.5'
        )}
      >
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          aria-hidden="true"
        >
          <GraduationCap className="size-4" />
        </div>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden whitespace-nowrap text-sm font-semibold text-sidebar-foreground"
            >
              {APP_NAME}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Primary navigation */}
      <nav
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pt-3"
        aria-label="Primary navigation"
      >
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Bottom navigation (Settings, etc.) */}
      <div className="border-t border-sidebar-border p-2 pb-3">
        {NAV_BOTTOM_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        ))}

        {/* Collapse toggle — only rendered inside the desktop sidebar.
            The mobile drawer always shows expanded content so we only
            show this button when not in mobile drawer mode (onNavigate not set). */}
        {!onNavigate && (
          <button
            onClick={toggle}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'mt-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2',
              'text-sm text-sidebar-foreground/50 transition-colors',
              'hover:bg-sidebar-accent hover:text-sidebar-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isCollapsed && 'justify-center px-2'
            )}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="size-4 shrink-0" aria-hidden="true" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </button>
        )}
      </div>
    </>
  )
}

// ── Sidebar (desktop) ────────────────────────────────────────────────────────
/**
 * Desktop-only persistent sidebar.
 * Hidden below the `md` breakpoint — MobileDrawer takes over on smaller screens.
 *
 * Width is animated between 56px (icon-only) and 220px (expanded).
 * `overflow-hidden` on the aside ensures no content leaks during animation.
 */
export function Sidebar() {
  const { isCollapsed } = useSidebarStore()

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 56 : 220 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        // hidden on mobile — MobileDrawer handles small screens
        'hidden md:flex',
        'h-full flex-col border-r border-sidebar-border bg-sidebar',
        'overflow-hidden shrink-0'
      )}
    >
      <SidebarContent isCollapsed={isCollapsed} />
    </motion.aside>
  )
}
