import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Share2, MapPin, MessageCircle, Calendar, Pencil, Tag, Loader2 } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useMarketplaceListingQuery, useMarketplaceListingsQuery } from '@/features/marketplace/hooks/useMarketplace'

export default function MarketplaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)

  // Fetch target listing from backend API
  const { data: listing, isLoading, isError } = useMarketplaceListingQuery(id)

  // Fetch related items in same category
  const { data: relatedPage } = useMarketplaceListingsQuery({
    categories: listing?.category,
    size: 4,
  })

  const relatedListings = (relatedPage?.content || []).filter((item) => item.id !== listing?.id)

  const handleFavoriteClick = () => {
    setIsFavorited(!isFavorited)
    if (!isFavorited) {
      toast.success('Listing added to saved items!')
    } else {
      toast.success('Listing removed from saved items.')
    }
  }

  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Listing URL copied to clipboard!')
  }

  const handleContactSeller = () => {
    if (!listing?.seller) return
    toast.success(`Contact email: ${listing.seller.email}`)
    window.location.href = `mailto:${listing.seller.email}?subject=${encodeURIComponent(`Inquiry regarding "${listing.title}" on Campus Marketplace`)}`
  }

  const conditionLabels: Record<string, string> = {
    NEW: 'Brand New',
    LIKE_NEW: 'Like New',
    GOOD: 'Good',
    FAIR: 'Fair',
    POOR: 'Poor',
  }

  const categoryLabels: Record<string, string> = {
    BOOKS: 'Books & Textbooks',
    ELECTRONICS: 'Electronics & Devices',
    HOUSING: 'Student Housing',
    SERVICES: 'Tutoring & Services',
    CLOTHING: 'Clothing & Apparel',
    OTHER: 'Other Items',
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 max-w-5xl mx-auto">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">Loading listing details...</p>
      </div>
    )
  }

  if (isError || !listing) {
    return (
      <div className="page-container max-w-3xl space-y-6 text-center py-16">
        <h2 className="text-lg font-bold text-foreground">Listing not found</h2>
        <p className="text-xs text-muted-foreground">The requested listing may have been removed or is no longer available.</p>
        <Link to="/marketplace">
          <Button size="sm">Back to Marketplace</Button>
        </Link>
      </div>
    )
  }

  const formattedDate = new Date(listing.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="page-container max-w-5xl space-y-8">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/marketplace">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-3 cursor-pointer">
            <ArrowLeft className="size-4" />
            <span>Back to Marketplace</span>
          </Button>
        </Link>

        <div className="flex gap-2">
          <Link to={`/marketplace/${listing.id}/edit`}>
            <Button variant="outline" size="sm" className="rounded-xl border-border cursor-pointer">
              <Pencil className="size-4 mr-1.5" />
              <span>Edit Listing</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareClick}
            className="rounded-xl border-border cursor-pointer"
          >
            <Share2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Details Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Images Carousel */}
        <div className="md:col-span-7 space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted/30">
            <img
              src={listing.images[activeImageIndex]?.imageUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop'}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Thumbnail list if multiple images exist */}
          {listing.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {listing.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-video w-20 overflow-hidden rounded-lg border-2 bg-muted/30 shrink-0 cursor-pointer ${
                    activeImageIndex === idx ? 'border-primary' : 'border-border/60 hover:border-border'
                  }`}
                >
                  <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Listing info */}
        <div className="md:col-span-5 space-y-6">
          <div className="space-y-3">
            {/* Category chips & date */}
            <div className="flex items-center justify-between gap-2">
              <span className="rounded bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase">
                {categoryLabels[listing.category] || listing.category}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3" />
                <span>{formattedDate}</span>
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight">
              {listing.title}
            </h1>

            {/* Price display panel */}
            <div className="flex items-baseline justify-between p-4 rounded-xl border border-border bg-card shadow-sm">
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Price</p>
                <p className="text-2xl font-extrabold text-foreground">${listing.price.toFixed(2)}</p>
              </div>
              {listing.negotiable && (
                <span className="rounded bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success border border-success/20">
                  Open to Offers
                </span>
              )}
            </div>
          </div>

          {/* Condition & location details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border border-border rounded-xl bg-muted/20">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Condition</p>
              <p className="text-xs font-semibold text-foreground mt-1">{conditionLabels[listing.condition]}</p>
            </div>
            <div className="p-3 border border-border rounded-xl bg-muted/20">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Location</p>
              <p className="text-xs font-semibold text-foreground mt-1 flex items-center gap-1">
                <MapPin className="size-3 text-muted-foreground shrink-0" />
                <span className="truncate">{listing.location || 'Campus'}</span>
              </p>
            </div>
          </div>

          {/* Product description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Description</h3>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {listing.description || 'No detailed description was provided for this campus listing.'}
            </p>
          </div>

          {/* Tags */}
          {listing.tags && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {listing.tags.split(',').map((tag) => (
                  <span
                    key={tag.trim()}
                    className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border"
                  >
                    <Tag className="size-2.5" />
                    <span>{tag.trim()}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Seller Profile Card & Action Widgets */}
          <div className="p-4 border border-border rounded-xl bg-card shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              {listing.seller.avatarUrl ? (
                <img
                  src={listing.seller.avatarUrl}
                  alt={listing.seller.fullName}
                  className="size-10 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm uppercase">
                  {listing.seller.fullName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{listing.seller.fullName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{listing.seller.email}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleContactSeller}
                className="flex-1 h-9 rounded-lg text-xs gap-1.5 cursor-pointer"
              >
                <MessageCircle className="size-4" />
                <span>Contact Seller</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleFavoriteClick}
                className={`h-9 rounded-lg border-border cursor-pointer ${
                  isFavorited ? 'text-destructive border-destructive/20 bg-destructive/5' : ''
                }`}
              >
                <Heart className={`size-4 ${isFavorited ? 'fill-destructive' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Listings Section */}
      {relatedListings.length > 0 && (
        <div className="border-t border-border pt-8 space-y-5">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Related Listings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {relatedListings.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  navigate(`/marketplace/${item.id}`)
                  setActiveImageIndex(0)
                }}
                className="group border border-border rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-md cursor-pointer transition-all"
              >
                <div className="aspect-video w-full overflow-hidden bg-muted/30">
                  <img
                    src={item.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop'}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-3.5 space-y-1">
                  <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs font-extrabold text-foreground">${item.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
