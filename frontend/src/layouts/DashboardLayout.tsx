import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/common/Sidebar'
import { MobileDrawer } from '@/components/common/MobileDrawer'
import { Navbar } from '@/components/common/Navbar'
import { pageVariants, pageTransition } from '@/lib/animations'

/**
 * DashboardLayout — visual application shell.
 *
 * Renders:
 *  - Desktop sidebar (hidden on mobile via `hidden md:flex`)
 *  - Mobile drawer (portal overlay, shown only on mobile)
 *  - Sticky top navbar (search, notifications, profile)
 *  - Animated content area (page transitions via Framer Motion)
 *
 * Layout structure:
 *   <div> (flex-row, h-screen, overflow-hidden)
 *     <Sidebar />          ← desktop only, flex-shrink-0
 *     <MobileDrawer />     ← mobile only, fixed overlay
 *     <div> (flex-col, flex-1, overflow-hidden, min-w-0)
 *       <Navbar />         ← sticky h-14, z-20
 *       <main>             ← flex-1, overflow-y-auto
 *         <AnimatePresence>
 *           <motion.div key={pathname}>
 *             <Outlet />
 *
 * Why `min-w-0` on the right column?
 *   Without it, flex children don't shrink below their intrinsic size,
 *   causing horizontal overflow when the sidebar is visible.
 *
 * Why `overflow-hidden` on root?
 *   Prevents double scrollbars — sidebar and navbar stay fixed,
 *   only <main> scrolls independently.
 */
export function DashboardLayout() {
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — hidden below md breakpoint */}
      <Sidebar />

      {/* Mobile drawer — portal overlay, only renders on mobile */}
      <MobileDrawer />

      {/* Right column: navbar + scrollable content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />

        <main
          id="main-content"
          tabIndex={-1}
          aria-label="Main content"
          className="flex-1 overflow-y-auto focus-visible:outline-none"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
