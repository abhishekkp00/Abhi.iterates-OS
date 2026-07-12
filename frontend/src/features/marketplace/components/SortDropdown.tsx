interface SortDropdownProps {
  sortBy: string
  onSortByChange: (val: string) => void
}

export function SortDropdown({ sortBy, onSortByChange }: SortDropdownProps) {
  return (
    <div className="relative shrink-0">
      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value)}
        className="flex h-10 w-[150px] sm:w-[170px] rounded-xl border border-input bg-card px-3 py-2 text-xs font-semibold shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground cursor-pointer appearance-none pr-8"
      >
        <option value="createdAt,desc">✨ Newest First</option>
        <option value="price,asc">📈 Price: Low to High</option>
        <option value="price,desc">📉 Price: High to Low</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
        <svg
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  )
}
