import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Heart, ShoppingBag } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MarketplaceCard } from '@/features/marketplace/components/MarketplaceCard'
import type { Listing } from '@/types/marketplace'

// Retrieve initial listings that are favorited
const INITIAL_FAVORITES: Listing[] = [
  {
    id: 'l2',
    title: 'iPad Pro 11" (M1, 128GB, Wi-Fi)',
    description: 'Space Gray. Comes with original box and USB-C charger. Minor scratches on the back but screen is pristine.',
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
    ],
    isFavorited: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: 'apple, ipad, tablet',
  },
]

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Listing[]>(INITIAL_FAVORITES)

  const handleFavoriteToggle = (id: string, isFavorited: boolean) => {
    if (!isFavorited) {
      setFavorites(prev => prev.filter(item => item.id !== id))
      toast.success('Listing removed from saved items.')
    }
  }

  return (
    <div className="page-container max-w-6xl space-y-6">
      {/* Header section */}
      <div className="space-y-1">
        <Link to="/marketplace">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-3 cursor-pointer">
            <ArrowLeft className="size-4" />
            <span>Back to Marketplace</span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Heart className="size-6 text-destructive fill-destructive" />
          <span>Saved Listings</span>
        </h1>
        <p className="text-sm text-muted-foreground">Keep track of items you are interested in buying.</p>
      </div>

      {/* Favorites Grid */}
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {favorites.map(listing => (
            <MarketplaceCard
              key={listing.id}
              listing={listing}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl p-12 text-center bg-card">
          <div className="rounded-full bg-muted p-3 text-muted-foreground mb-4">
            <ShoppingBag className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No saved listings yet</h3>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            Tap the heart icon on any marketplace item card to save it here for quick access.
          </p>
          <Link to="/marketplace">
            <Button size="sm" className="mt-4 rounded-xl cursor-pointer">
              Browse Marketplace
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
