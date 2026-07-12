import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Share2, MapPin, MessageCircle, Calendar, Pencil, Tag } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Listing } from '@/types/marketplace'

// Retrieve details matching ID from our MOCK_LISTINGS dataset
const MOCK_LISTINGS: Listing[] = [
  {
    id: 'l1',
    title: 'Introduction to Algorithms (CLRS) 4th Edition',
    description: 'Barely used for one semester. No highlights or markings. Perfect condition for CS courses. Covers divide-and-conquer, greedy algorithms, dynamic programming, and advanced data structures. Comes with solutions references if requested.',
    price: 45.00,
    negotiable: true,
    category: 'BOOKS',
    condition: 'LIKE_NEW',
    location: 'Hill Library',
    status: 'ACTIVE',
    seller: {
      id: 'u1',
      fullName: 'Alex River',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
      email: 'alex@campus.edu',
    },
    images: [
      { id: 'i1', imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop', isPrimary: true },
      { id: 'i1-2', imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop', isPrimary: false },
    ],
    isFavorited: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    updatedAt: new Date().toISOString(),
    tags: 'cs, algorithms, textbook',
  },
  {
    id: 'l2',
    title: 'iPad Pro 11" (M1, 128GB, Wi-Fi)',
    description: 'Space Gray. Comes with original box and USB-C charger. Minor scratches on the back but screen is pristine. Battery health is at 92%. Great for digital note-taking or video calls.',
    price: 520.00,
    negotiable: false,
    category: 'ELECTRONICS',
    condition: 'GOOD',
    location: 'West Quad',
    status: 'ACTIVE',
    seller: {
      id: 'u2',
      fullName: 'Emily Stone',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
      email: 'emily@campus.edu',
    },
    images: [
      { id: 'i2', imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600&auto=format&fit=crop', isPrimary: true },
      { id: 'i2-2', imageUrl: 'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?q=80&w=600&auto=format&fit=crop', isPrimary: false },
    ],
    isFavorited: true,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    updatedAt: new Date().toISOString(),
    tags: 'apple, ipad, tablet',
  },
  {
    id: 'l3',
    title: 'Private Room in Shared Apartment (Sublet)',
    description: 'Looking for a subletter for Fall 2026. 5 mins walk to campus. Gym and laundry included. Utilities around $40/mo. Shared kitchen with 2 quiet CS roommates.',
    price: 850.00,
    negotiable: true,
    category: 'HOUSING',
    condition: 'GOOD',
    location: 'North Campus',
    status: 'ACTIVE',
    seller: {
      id: 'u3',
      fullName: 'Marcus Vance',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
      email: 'marcus@campus.edu',
    },
    images: [
      { id: 'i3', imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600&auto=format&fit=crop', isPrimary: true },
    ],
    isFavorited: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: 'housing, sublet, room',
  },
]

export default function MarketplaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // Find current listing
  const listing = (MOCK_LISTINGS.find(item => item.id === id) || MOCK_LISTINGS[0]) as Listing
  
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(listing.isFavorited || false)

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
    toast.success(`Contacting ${listing.seller.fullName}... Chat placeholder activated!`)
  }

  // Get related items (same category, excluding current one)
  const relatedListings = MOCK_LISTINGS.filter(
    item => item.category === listing.category && item.id !== listing.id
  )

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
            {relatedListings.map(item => (
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
