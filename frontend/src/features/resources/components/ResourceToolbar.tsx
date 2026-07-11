import { useResourcesStore } from '../store/resources.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter, SlidersHorizontal, Grid, List, Plus, ChevronDown } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface ResourceToolbarProps {
  onAddClick: () => void
  onToggleFilters: () => void
  showFilters: boolean
  totalItems: number
}

export function ResourceToolbar({
  onAddClick,
  onToggleFilters,
  showFilters,
  totalItems,
}: ResourceToolbarProps) {
  const {
    searchQuery,
    setSearchQuery,
    viewLayout,
    setViewLayout,
    sortBy,
    sortOrder,
    setSort,
  } = useResourcesStore()

  const sortOptions = [
    { label: 'Newest First', field: 'createdAt', order: 'desc' },
    { label: 'Oldest First', field: 'createdAt', order: 'asc' },
    { label: 'Alphabetical (A-Z)', field: 'title', order: 'asc' },
    { label: 'Alphabetical (Z-A)', field: 'title', order: 'desc' },
    { label: 'Nearest Deadline', field: 'deadline', order: 'asc' },
  ] as const

  const currentOption = sortOptions.find(
    (opt) => opt.field === sortBy && opt.order === sortOrder
  ) ?? sortOptions[0]

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      {/* Search box & Filters Toggle */}
      <div className="flex flex-1 items-center gap-2 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources by title or tags..."
            className="pl-9 pr-4"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          className="gap-2"
          onClick={onToggleFilters}
        >
          <Filter className="size-4" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>

      {/* Sorting, View Toggle, and Create Button */}
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        {/* Sort Select Dropdown */}
        <div className="relative group flex items-center">
          <Button variant="outline" className="gap-2 text-xs">
            <SlidersHorizontal className="size-3.5" />
            <span>Sort: {currentOption.label}</span>
            <ChevronDown className="size-3" />
          </Button>
          <div className="absolute right-0 top-full z-50 mt-1 hidden w-48 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg group-hover:block group-focus-within:block">
            {sortOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setSort(opt.field, opt.order)}
                className={cn(
                  'flex w-full items-center rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground',
                  sortBy === opt.field && sortOrder === opt.order && 'bg-accent/80 font-medium'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* View mode toggle (Grid / List) */}
        <div className="flex rounded-md border border-input p-0.5 bg-muted/40">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setViewLayout('grid')}
            className={cn(viewLayout === 'grid' && 'bg-background shadow-sm')}
            aria-label="Grid View"
          >
            <Grid className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setViewLayout('table')}
            className={cn(viewLayout === 'table' && 'bg-background shadow-sm')}
            aria-label="Table/List View"
          >
            <List className="size-3.5" />
          </Button>
        </div>

        {/* Total counts badge & Add Button */}
        <span className="text-xs text-muted-foreground mr-1 hidden lg:inline">
          {totalItems} items
        </span>

        <Button onClick={onAddClick} className="gap-1.5 ml-auto sm:ml-0">
          <Plus className="size-4" />
          <span>Add Resource</span>
        </Button>
      </div>
    </div>
  )
}
