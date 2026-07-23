import React from 'react'
import { Calendar } from '@/lib/icons'

interface DateRangeSelectorProps {
  value: number
  onChange: (value: number) => void
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ value, onChange }) => {
  const options = [
    { label: 'Last 7 Days', value: 7 },
    { label: 'Last 30 Days', value: 30 },
    { label: 'Last 90 Days', value: 90 },
  ]

  return (
    <div className="flex items-center gap-2 bg-background border border-border/80 rounded-xl px-3 py-1.5 shadow-sm hover:border-border/100 transition-colors">
      <Calendar className="size-4 text-muted-foreground" />
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer pr-1"
        aria-label="Select Date Range"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-card text-foreground">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
