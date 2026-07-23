import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/common/Sidebar'
import { MobileDrawer } from '@/components/common/MobileDrawer'
import { Navbar } from '@/components/common/Navbar'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { CommandMenu } from '@/components/common/CommandMenu'
import { OnboardingModal } from '@/components/common/OnboardingModal'
import { pageVariants, pageTransition } from '@/lib/animations'

export function DashboardLayout() {
  const location = useLocation()
  const [cmdOpen, setCmdOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — hidden below md breakpoint */}
      <Sidebar />

      {/* Mobile drawer — portal overlay, only renders on mobile */}
      <MobileDrawer />

      {/* Feature onboarding tour modal for new users */}
      <OnboardingModal />

      {/* ⌘K Command palette — rendered at layout level so it overlays everything */}
      <CommandMenu open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* Right column: navbar + breadcrumbs + scrollable content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top navbar — receives callback to open command palette */}
        {!location.pathname.includes('/resources/study/') && <Navbar onOpenCmd={() => setCmdOpen(true)} />}

        {/* Breadcrumbs — auto-generated, hidden on /dashboard */}
        {!location.pathname.includes('/resources/study/') && (
          <div className="border-b border-border bg-background px-4 py-2 md:px-6">
            <Breadcrumbs />
          </div>
        )}

        {/* Scrollable content area */}
        <main
          id="main-content"
          tabIndex={-1}
          aria-label="Main content"
          className={`flex-1 ${location.pathname.includes('/resources/study/') ? 'overflow-hidden' : 'overflow-y-auto'} focus-visible:outline-none`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className={location.pathname.includes('/resources/study/') ? "h-full w-full" : "min-h-full"}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
