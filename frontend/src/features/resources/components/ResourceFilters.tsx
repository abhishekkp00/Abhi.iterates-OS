import { motion, AnimatePresence } from 'framer-motion'
import { useResourcesStore } from '../store/resources.store'
import type { ResourceCategory, ResourceStatus, ResourcePriority } from '@/types/resources'
import { cn } from '@/lib/utils'

interface ResourceFiltersProps {
  show: boolean
}

const CATEGORIES: { value: ResourceCategory; label: string }[] = [
  { value: 'LECTURE', label: 'Lecture Slides' },
  { value: 'BOOK', label: 'Textbooks' },
  { value: 'CHEATSHEET', label: 'Cheat Sheets' },
  { value: 'PAST_PAPER', label: 'Past Papers' },
  { value: 'OTHER', label: 'Other Documents' },
]

const PRIORITIES: { value: ResourcePriority; label: string; color: string }[] = [
  { value: 'HIGH', label: 'High Priority', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  { value: 'MEDIUM', label: 'Medium Priority', color: 'bg-warning/10 text-warning border-warning/20' },
  { value: 'LOW', label: 'Low Priority', color: 'bg-info/10 text-info border-info/20' },
]

const STATUSES: { value: ResourceStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
]

export function ResourceFilters({ show }: ResourceFiltersProps) {
  const {
    selectedCategories,
    toggleCategory,
    selectedPriorities,
    togglePriority,
    selectedStatuses,
    toggleStatus,
    resetFilters,
  } = useResourcesStore()

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedPriorities.length > 0 ||
    selectedStatuses.length > 0

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="mt-3 rounded-lg border border-border bg-card p-4 shadow-inner space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-semibold text-foreground">Filter Resources</h3>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Category Filter */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </p>
                <div className="flex flex-col gap-1.5">
                  {CATEGORIES.map((cat) => {
                    const isChecked = selectedCategories.includes(cat.value)
                    return (
                      <label
                        key={cat.value}
                        className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCategory(cat.value)}
                          className="rounded border-input text-primary focus:ring-primary size-3.5"
                        />
                        <span>{cat.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Priority
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map((pri) => {
                    const isChecked = selectedPriorities.includes(pri.value)
                    return (
                      <button
                        key={pri.value}
                        onClick={() => togglePriority(pri.value)}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-150',
                          isChecked
                            ? pri.color + ' ring-1 ring-primary'
                            : 'border-border bg-background text-muted-foreground hover:bg-accent'
                        )}
                      >
                        {pri.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((stat) => {
                    const isChecked = selectedStatuses.includes(stat.value)
                    return (
                      <button
                        key={stat.value}
                        onClick={() => toggleStatus(stat.value)}
                        className={cn(
                          'rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150',
                          isChecked
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:bg-accent'
                        )}
                      >
                        {stat.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
