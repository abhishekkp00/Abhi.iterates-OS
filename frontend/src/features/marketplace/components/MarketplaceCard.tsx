import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, MapPin } from '@/lib/icons'
import type { Listing } from '@/types/marketplace'
import { useState } from 'react'

interface MarketplaceCardProps {
  listing: Listing
  onFavoriteToggle?: (id: string, isFavorited: boolean) => void
}

export function MarketplaceCard({ listing, onFavoriteToggle }: MarketplaceCardProps) {
  const [isFavorite, setIsFavorite] = useState(listing.isFavorited || false)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const nextState = !isFavorite
    setIsFavorite(nextState)
    onFavoriteToggle?.(listing.id, nextState)
  }

  // Helper for category label styling
  const categoryColors: Record<string, string> = {
    BOOKS: 'bg-primary/10 text-primary border-primary/20',
    ELECTRONICS: 'bg-info/10 text-info border-info/20',
    HOUSING: 'bg-success/10 text-success border-success/20',
    SERVICES: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    CLOTHING: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    OTHER: 'bg-muted text-muted-foreground border-border',
  }

  const conditionLabels: Record<string, string> = {
    NEW: 'New',
    LIKE_NEW: 'Like New',
    GOOD: 'Good',
    FAIR: 'Fair',
    POOR: 'Poor',
  }

  const primaryImage = listing.images.find(img => img.isPrimary) || listing.images[0]
  const imageSrc = primaryImage ? primaryImage.imageUrl : 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop'

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all"
    >
      {/* Favorite Button Overlay */}
      <button
        onClick={handleFavoriteClick}
        className="absolute right-3 top-3 z-10 rounded-full bg-background/80 backdrop-blur-md p-1.5 text-muted-foreground hover:text-destructive hover:scale-110 transition-all border border-border/50 shadow-sm cursor-pointer"
        type="button"
      >
        <Heart className={`size-4 transition-colors ${isFavorite ? 'fill-destructive text-destructive' : ''}`} />
      </button>

      {/* Image Preview Container */}
      <Link to={`/marketplace/${listing.id}`} className="relative aspect-video w-full overflow-hidden bg-muted/30">
        <img
          src={imageSrc}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Category Badge overlay */}
        <span className={`absolute bottom-2 left-2 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide backdrop-blur-md uppercase ${categoryColors[listing.category] || categoryColors.OTHER}`}>
          {listing.category}
        </span>
      </Link>

      {/* Info Section */}
      <div className="flex flex-1 flex-col p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/marketplace/${listing.id}`} className="hover:underline flex-1">
            <h3 className="text-sm font-bold leading-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {listing.title}
            </h3>
          </Link>
          <span className="text-sm font-extrabold text-foreground shrink-0">
            ${listing.price.toFixed(2)}
          </span>
        </div>

        {/* Condition & Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {listing.description || 'No description provided.'}
        </p>

        {/* Details & Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1 items-center">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border">
            Condition: {conditionLabels[listing.condition]}
          </span>
          {listing.negotiable && (
            <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success border border-success/20">
              Negotiable
            </span>
          )}
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between border-t border-border/60 pt-2.5 mt-auto text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="size-3" />
            <span className="truncate max-w-[100px]">{listing.location || 'Campus'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {listing.seller.avatarUrl ? (
              <img
                src={listing.seller.avatarUrl}
                alt={listing.seller.fullName}
                className="size-4.5 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="size-4.5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[8px] uppercase">
                {listing.seller.fullName.charAt(0)}
              </div>
            )}
            <span className="truncate max-w-[80px] font-medium text-foreground">{listing.seller.fullName}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
