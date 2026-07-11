import { useResourcesStore } from '../store/resources.store'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from '@/lib/icons'

interface ResourcePaginationProps {
  totalItems: number
}

export function ResourcePagination({ totalItems }: ResourcePaginationProps) {
  const { page, pageSize, setPage, setPageSize } = useResourcesStore()

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(totalItems, page * pageSize)

  // Generate page numbers to display, including ellipsis if necessary
  const pageNumbers: (number | string)[] = []
  const maxButtons = 5

  if (totalPages <= maxButtons) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i)
    }
  } else {
    // Always include page 1
    pageNumbers.push(1)

    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)

    if (start > 2) {
      pageNumbers.push('...')
    }

    for (let i = start; i <= end; i++) {
      pageNumbers.push(i)
    }

    if (end < totalPages - 1) {
      pageNumbers.push('...')
    }

    // Always include the last page
    pageNumbers.push(totalPages)
  }

  return (
    <div className="flex flex-col gap-4 items-center justify-between border-t border-border pt-4 sm:flex-row">
      {/* Items count summary */}
      <div className="text-xs text-muted-foreground">
        {totalItems > 0 ? (
          <span>
            Showing <span className="font-semibold text-foreground">{startItem}</span> to{' '}
            <span className="font-semibold text-foreground">{endItem}</span> of{' '}
            <span className="font-semibold text-foreground">{totalItems}</span> resources
          </span>
        ) : (
          <span>No resources to display</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded border border-border bg-card px-1.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Items per page"
          >
            {[12, 24, 48, 96].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          {/* Previous Page */}
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            aria-label="Previous Page"
          >
            <ChevronLeft className="size-3.5" />
          </Button>

          {/* Page numbers */}
          {pageNumbers.map((num, idx) => {
            if (num === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-xs font-medium text-muted-foreground select-none"
                >
                  ...
                </span>
              )
            }

            return (
              <Button
                key={`page-${num}`}
                variant={page === num ? 'default' : 'outline'}
                size="xs"
                className="min-w-[28px]"
                onClick={() => setPage(num as number)}
              >
                {num}
              </Button>
            )
          })}

          {/* Next Page */}
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            aria-label="Next Page"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
