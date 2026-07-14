import { Badge } from '@/components/ui/badge'
import { X } from '@/lib/icons'

interface Collection {
  id: string
  name: string
  icon: string
  count: number
  color: string
}

interface CollectionCardProps {
  collection: Collection
  isActive: boolean
  onClick: () => void
  onDelete?: () => void
  IconComponent: React.ComponentType<{ className?: string }>
}

export function CollectionCard({
  collection,
  isActive,
  onClick,
  onDelete,
  IconComponent,
}: CollectionCardProps) {
  return (
    <div
      onClick={onClick}
      className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between group cursor-pointer ${
        isActive
          ? 'border-primary/25 bg-primary/10 text-primary'
          : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <div className="flex items-center gap-2 truncate">
        <IconComponent className={`size-4 shrink-0 ${collection.color}`} />
        <span className="truncate">{collection.name}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Badge variant="outline" className="text-[10px] font-bold py-0.5 px-1.5">
          {collection.count}
        </Badge>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted-foreground/10 text-muted-foreground hover:text-destructive rounded-md transition-all cursor-pointer"
            title="Delete collection"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
    </div>
  )
}
