interface ResourceListSkeletonProps {
  layout: 'grid' | 'table'
  count?: number
}

export function ResourceListSkeleton({ layout, count = 6 }: ResourceListSkeletonProps) {
  if (layout === 'table') {
    return (
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm animate-pulse">
        <table className="w-full border-collapse text-left text-sm" aria-hidden="true">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3"><div className="h-4 w-24 rounded bg-muted"></div></th>
              <th className="hidden sm:table-cell px-4 py-3"><div className="h-4 w-16 rounded bg-muted"></div></th>
              <th className="hidden md:table-cell px-4 py-3"><div className="h-4 w-16 rounded bg-muted"></div></th>
              <th className="hidden md:table-cell px-4 py-3"><div className="h-4 w-16 rounded bg-muted"></div></th>
              <th className="hidden lg:table-cell px-4 py-3"><div className="h-4 w-20 rounded bg-muted"></div></th>
              <th className="px-4 py-3 text-right"><div className="h-4 w-12 ml-auto rounded bg-muted"></div></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: count }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-40 rounded bg-muted"></div>
                    <div className="h-3 w-20 rounded bg-muted/70"></div>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-4 py-3">
                  <div className="h-4 w-20 rounded bg-muted/80"></div>
                </td>
                <td className="hidden md:table-cell px-4 py-3">
                  <div className="h-4.5 w-14 rounded-full bg-muted/80"></div>
                </td>
                <td className="hidden md:table-cell px-4 py-3">
                  <div className="h-4.5 w-14 rounded bg-muted/80"></div>
                </td>
                <td className="hidden lg:table-cell px-4 py-3">
                  <div className="h-4 w-20 rounded bg-muted/80"></div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <div className="size-6 rounded bg-muted"></div>
                    <div className="size-6 rounded bg-muted"></div>
                    <div className="size-6 rounded bg-muted"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Grid / Card skeleton
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse space-y-5"
          aria-hidden="true"
        >
          <div className="space-y-4">
            {/* Top row */}
            <div className="flex justify-between items-center">
              <div className="size-8 rounded-lg bg-muted"></div>
              <div className="flex gap-1.5">
                <div className="h-4.5 w-14 rounded bg-muted"></div>
                <div className="h-4.5 w-14 rounded bg-muted"></div>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <div className="h-4.5 w-3/4 rounded bg-muted"></div>
              <div className="space-y-1">
                <div className="h-3 w-full rounded bg-muted/70"></div>
                <div className="h-3 w-5/6 rounded bg-muted/70"></div>
              </div>
            </div>
          </div>

          {/* Footer separator line */}
          <div className="border-t border-border pt-4 flex justify-between items-center">
            <div className="h-3.5 w-14 rounded bg-muted"></div>
            <div className="h-3.5 w-18 rounded bg-muted"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
