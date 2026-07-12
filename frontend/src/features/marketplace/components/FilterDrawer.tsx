import { AnimatePresence, motion } from 'framer-motion'
import { X } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ListingCondition } from '@/types/marketplace'

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  minPrice: string
  onMinPriceChange: (val: string) => void
  maxPrice: string
  onMaxPriceChange: (val: string) => void
  selectedCondition: ListingCondition | 'ALL'
  onSelectCondition: (cond: ListingCondition | 'ALL') => void
  isNegotiable: boolean
  onNegotiableToggle: (val: boolean) => void
  onClearFilters: () => void
}

const CONDITIONS: { value: ListingCondition | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Any Condition' },
  { value: 'NEW', label: 'Brand New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
]

export function FilterDrawer({
  isOpen,
  onClose,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  selectedCondition,
  onSelectCondition,
  isNegotiable,
  onNegotiableToggle,
  onClearFilters,
}: FilterDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black"
          />

          {/* Drawer flyout */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-sm flex-col bg-card border-l border-border p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Advanced Filters</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Narrow down product listings</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {/* Price range */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Price Range ($)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => onMinPriceChange(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                    min="0"
                  />
                  <span className="text-muted-foreground text-xs">—</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => onMaxPriceChange(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                    min="0"
                  />
                </div>
              </div>

              {/* Condition */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Condition</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CONDITIONS.map((cond) => {
                    const isActive = selectedCondition === cond.value
                    return (
                      <button
                        key={cond.value}
                        type="button"
                        onClick={() => onSelectCondition(cond.value)}
                        className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {cond.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Negotiable toggle */}
              <div className="flex items-center justify-between rounded-xl border border-border p-3.5 bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground">Negotiable Price</p>
                  <p className="text-[10px] text-muted-foreground">Only show listings open to offers</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNegotiableToggle(!isNegotiable)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isNegotiable ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isNegotiable ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer action buttons */}
            <div className="border-t border-border pt-4 flex gap-3 text-xs font-semibold">
              <Button
                variant="ghost"
                onClick={() => {
                  onClearFilters()
                  onClose()
                }}
                className="flex-1 h-10 rounded-xl cursor-pointer"
              >
                Clear All
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 h-10 rounded-xl cursor-pointer"
              >
                Apply Filters
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
