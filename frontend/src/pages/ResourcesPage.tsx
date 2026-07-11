import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ResourceToolbar } from '@/features/resources/components/ResourceToolbar'
import { ResourceFilters } from '@/features/resources/components/ResourceFilters'
import { ResourcePagination } from '@/features/resources/components/ResourcePagination'
import { staggerParentVariants, staggerChildVariants } from '@/lib/animations'

/**
 * ResourcesPage — main portal layout for the Resource Management Module.
 *
 * Implements Step 1:
 *   - Page header with total item counter
 *   - Unified search, layout, and sorting toolbar
 *   - Collapsible slide-down filters panel
 *   - Responsive empty/content states placeholder
 *   - Pagination controls
 *
 * UX Decisions:
 *   - Page layout uses `page-container max-w-7xl` to prevent layout stretching on ultra-wide screens.
 *   - Staggered animations load the header, then toolbar, filters, and cards sequentially.
 *   - Zustand filters state integrates with the toolbar to ensure sync.
 */
export default function ResourcesPage() {
  const navigate = useNavigate()
  const [showFilters, setShowFilters] = useState(false)

  // Temporary mock total count — will represent real database counts from TanStack Query in Step 5/6
  const mockTotalItems = 28

  function handleAddResource() {
    navigate('/resources/new')
  }

  return (
    <div className="page-container max-w-7xl">
      <motion.div
        variants={staggerParentVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* ── Page Header ───────────────────────────────────────────────────── */}
        <motion.div
          variants={staggerChildVariants}
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                My Resources
              </h1>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {mockTotalItems} Total
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Store, organize, and search your study materials.
            </p>
          </div>
        </motion.div>

        {/* ── Toolbar (Search, Sort, Layout, Filter Trigger) ───────────────── */}
        <motion.div variants={staggerChildVariants}>
          <ResourceToolbar
            onAddClick={handleAddResource}
            onToggleFilters={() => setShowFilters((f) => !f)}
            showFilters={showFilters}
            totalItems={mockTotalItems}
          />
        </motion.div>

        {/* ── Collapsible Advanced Filter Panel ──────────────────────────────── */}
        <ResourceFilters show={showFilters} />

        {/* ── Resources Content Grid/List Placeholder ───────────────────────── */}
        <motion.div
          variants={staggerChildVariants}
          className="rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-sm"
        >
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center">
            <div className="rounded-full bg-muted p-3">
              <svg
                className="size-6 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-sm font-semibold text-foreground">
              Resources List Placeholder
            </h2>
            <p className="mt-2 text-xs text-muted-foreground leading-normal">
              Grid and Table list layouts will be fully built in Step 3. Currently, the Toolbar, Filters panel, and Pagination controls are functional.
            </p>
          </div>
        </motion.div>

        {/* ── Pagination Footer ────────────────────────────────────────────── */}
        <motion.div variants={staggerChildVariants}>
          <ResourcePagination totalItems={mockTotalItems} />
        </motion.div>
      </motion.div>
    </div>
  )
}
