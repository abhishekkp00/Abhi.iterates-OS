import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/store/sidebar.store'
import { NAV_GROUPS, NAV_BOTTOM_ITEMS, APP_NAME } from '@/constants/app'
import type { NavItem } from '@/constants/app'
import {
  LayoutDashboard, BookOpen, ShoppingBag, FolderOpen, Sparkles, Settings,
  PanelLeftClose, PanelLeftOpen, GraduationCap, Calendar, Clock, List,
} from '@/lib/icons'

// ── Icon registry ─────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  BookOpen,
  ShoppingBag,
  FolderOpen,
  Sparkles,
  Settings,
  Calendar,
  Clock,
  List,
}

// ── NavItem ───────────────────────────────────────────────────────────────────
interface NavItemProps {
  item: NavItem
  isCollapsed: boolean
  onNavigate?: () => void
}

export function NavItem({ item, isCollapsed, onNavigate }: NavItemProps) {
  const Icon = ICON_MAP[item.icon]

  return (
    <NavLink
      to={item.href}
      onClick={onNavigate}
      aria-label={item.label}
      className={({ isActive }) =>
        cn(
          // Base layout
          'group relative flex items-center gap-2.5 rounded-md px-2.5 py-2',
          'text-sm font-medium transition-all duration-100',
          // Focus ring
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          // Active vs. inactive states
          isActive
            ? [
                // Active: stronger background + primary-colored text + left accent bar
                'bg-sidebar-accent text-sidebar-accent-foreground',
                // The left accent bar is rendered via the ::before pseudo-element below
                'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2',
                'before:h-4 before:w-[3px] before:rounded-r-full before:bg-primary',
              ]
            : [
                'text-sidebar-foreground/60',
                'hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
              ],
          isCollapsed && 'justify-center px-2'
        )
      }
    >
      {/* Icon */}
      {Icon && (
        <Icon
          className={cn(
            'size-4 shrink-0 transition-colors',
            // Icon is primary-colored when active, muted otherwise
          )}
          aria-hidden="true"
        />
      )}

      {/* Label — animated in/out on collapse */}
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

      {/* "Soon" badge */}
      {item.soon && !isCollapsed && (
        <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
          Soon
        </span>
      )}

      {/* Numeric badge */}
      {item.badge && item.badge > 0 && !isCollapsed && (
        <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground min-w-[16px] text-center">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}

      {/* Tooltip — only in collapsed (icon-only) mode */}
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
          {item.soon && ' (Coming soon)'}
        </span>
      )}
    </NavLink>
  )
}

// ── NavGroup ──────────────────────────────────────────────────────────────────
interface NavGroupProps {
  id: string
  label: string | null
  items: readonly NavItem[]
  isCollapsed: boolean
  onNavigate?: () => void
}

function NavGroup({ id, label, items, isCollapsed, onNavigate }: NavGroupProps) {
  return (
    <div role="group" aria-labelledby={label ? `nav-group-${id}` : undefined}>
      {/* Group label — hidden when sidebar is collapsed */}
      <AnimatePresence initial={false}>
        {label && !isCollapsed && (
          <motion.p
            id={`nav-group-${id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'overflow-hidden px-2.5 pt-4 pb-1',
              'text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40',
              'select-none'
            )}
          >
            {label}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Divider when collapsed — shows group boundary without text */}
      {isCollapsed && label && (
        <div className="mx-2 my-2 h-px bg-sidebar-border" aria-hidden="true" />
      )}

      {/* Nav items */}
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}

// ── SidebarContent ────────────────────────────────────────────────────────────
// Shared between the desktop Sidebar and the MobileDrawer.
// Accepts `onNavigate` so the mobile drawer can close itself after navigation.

interface SidebarContentProps {
  isCollapsed: boolean
  onNavigate?: () => void
}

export function SidebarContent({ isCollapsed, onNavigate }: SidebarContentProps) {
  const { toggle } = useSidebarStore()

  return (
    <>
      {/* ── Brand logo row ─────────────────────────────────────────────────── */}
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
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <span className="block whitespace-nowrap text-sm font-semibold text-sidebar-foreground leading-tight">
                {APP_NAME}
              </span>
              <span className="block whitespace-nowrap text-[9px] text-sidebar-foreground/40 font-medium uppercase tracking-widest">
                Student OS
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Primary navigation (grouped) ───────────────────────────────────── */}
      <nav
        className="flex flex-1 flex-col overflow-y-auto p-2 pt-2"
        aria-label="Primary navigation"
      >
        {NAV_GROUPS.map((group) => (
          <NavGroup
            key={group.id}
            id={group.id}
            label={group.label}
            items={group.items}
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* ── Bottom navigation ───────────────────────────────────────────────── */}
      <div className="border-t border-sidebar-border p-2 pb-3 space-y-0.5">
        {NAV_BOTTOM_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        ))}

        {/* Collapse toggle — only shown in desktop sidebar context */}
        {!onNavigate && (
          <button
            onClick={toggle}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'mt-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2',
              'text-sm text-sidebar-foreground/40 transition-colors',
              'hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
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

// ── Sidebar (desktop only) ────────────────────────────────────────────────────
/**
 * Desktop persistent sidebar — hidden below md breakpoint.
 * Width animates between 56px (icon-only) and 220px (expanded).
 */
export function Sidebar() {
  const { isCollapsed } = useSidebarStore()

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 56 : 220 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        'hidden md:flex',
        'h-full flex-col border-r border-sidebar-border bg-sidebar',
        'overflow-hidden shrink-0'
      )}
    >
      <SidebarContent isCollapsed={isCollapsed} />
    </motion.aside>
  )
}
