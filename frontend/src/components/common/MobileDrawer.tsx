import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/store/sidebar.store'
import { SidebarContent } from '@/components/common/Sidebar'
import { X } from '@/lib/icons'

/**
 * MobileDrawer — slide-in sidebar overlay for screens below the `md` breakpoint.
 *
 * Design decisions:
 *  - Rendered as a portal-style fixed overlay so it sits above all page content.
 *  - A semi-transparent backdrop closes the drawer on click (standard mobile UX).
 *  - Escape key closes the drawer for keyboard accessibility.
 *  - Navigation automatically closes the drawer (handled via useEffect on location).
 *  - Uses the same SidebarContent as the desktop sidebar — zero duplication.
 *  - Width is 260px (wider than desktop 220px) because there's no icon-only mode.
 *
 * Accessibility:
 *  - Backdrop has aria-hidden="true" (decorative).
 *  - Drawer <aside> has aria-label for screen readers.
 *  - Close button has aria-label.
 *  - Focus trap is not implemented here (future enhancement) — the Escape key
 *    provides an exit path for keyboard users.
 */
export function MobileDrawer() {
  const { isMobileOpen, setMobileOpen } = useSidebarStore()
  const location = useLocation()

  // Auto-close when the user navigates to a new route
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, setMobileOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isMobileOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isMobileOpen, setMobileOpen])

  return (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.aside
            key="mobile-drawer"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              'fixed left-0 top-0 z-50 h-full w-[260px]',
              'flex flex-col border-r border-sidebar-border bg-sidebar',
              'md:hidden'
            )}
            aria-label="Mobile navigation"
          >
            {/* Close button — absolute positioned top-right */}
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className={cn(
                'absolute right-3 top-3.5 rounded-md p-1',
                'text-sidebar-foreground/50',
                'hover:bg-sidebar-accent hover:text-sidebar-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'transition-colors'
              )}
            >
              <X className="size-4" aria-hidden="true" />
            </button>

            {/* Reuse same sidebar content — always expanded (never icon-only on mobile) */}
            <SidebarContent
              isCollapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
