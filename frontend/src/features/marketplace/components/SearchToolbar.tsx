import { Search, SlidersHorizontal } from '@/lib/icons'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onToggleFilterDrawer: () => void
  activeFiltersCount: number
  children?: React.ReactNode
}

export function SearchToolbar({
  searchQuery,
  onSearchChange,
  onToggleFilterDrawer,
  activeFiltersCount,
  children,
}: SearchToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full items-stretch sm:items-center">
      {/* Search Input Box */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search textbooks, devices, bikes, services..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 rounded-xl"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onToggleFilterDrawer}
          className="gap-2 h-10 rounded-xl px-4 border-border shrink-0 cursor-pointer"
        >
          <SlidersHorizontal className="size-4" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="rounded-full bg-primary text-primary-foreground size-5 flex items-center justify-center text-[10px] font-extrabold">
              {activeFiltersCount}
            </span>
          )}
        </Button>
        {children}
      </div>
    </div>
  )
}
