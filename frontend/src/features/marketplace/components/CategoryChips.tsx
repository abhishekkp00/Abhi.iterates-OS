import type { ListingCategory } from '@/types/marketplace'
import { motion } from 'framer-motion'

interface CategoryChipsProps {
  selectedCategory: ListingCategory | 'ALL'
  onSelectCategory: (category: ListingCategory | 'ALL') => void
}

const CATEGORIES: { value: ListingCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '🎒 All Items' },
  { value: 'BOOKS', label: '📚 Books' },
  { value: 'ELECTRONICS', label: '💻 Electronics' },
  { value: 'HOUSING', label: '🏠 Housing' },
  { value: 'SERVICES', label: '🛠️ Services' },
  { value: 'CLOTHING', label: '👕 Clothing' },
  { value: 'OTHER', label: '✨ Other' },
]

export function CategoryChips({ selectedCategory, onSelectCategory }: CategoryChipsProps) {
  return (
    <div className="flex w-full items-center overflow-x-auto pb-2 scrollbar-none gap-2">
      {CATEGORIES.map((cat) => {
        const isActive = selectedCategory === cat.value
        return (
          <button
            key={cat.value}
            onClick={() => onSelectCategory(cat.value)}
            className={`relative shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
              isActive
                ? 'text-primary-foreground border-primary bg-primary shadow-sm'
                : 'text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground'
            }`}
            type="button"
          >
            {isActive && (
              <motion.span
                layoutId="activeCategoryBg"
                className="absolute inset-0 z-[-1] rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{cat.label}</span>
          </button>
        )
      })}
    </div>
  )
}
