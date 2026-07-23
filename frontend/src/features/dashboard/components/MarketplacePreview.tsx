import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, ArrowRight, DollarSign } from '@/lib/icons'

// Sample marketplace items
const PREVIEW_LISTINGS = [
  {
    id: 'l1',
    title: 'Introduction to Algorithms (CLRS)',
    price: 45.0,
    category: 'BOOKS',
    condition: 'LIKE_NEW',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'l2',
    title: 'iPad Pro 11" (M1, 128GB)',
    price: 520.0,
    category: 'ELECTRONICS',
    condition: 'GOOD',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'l3',
    title: 'Private Room Sublet (North Campus)',
    price: 850.0,
    category: 'HOUSING',
    condition: 'GOOD',
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=300&auto=format&fit=crop',
  },
]

export function MarketplacePreview() {
  const navigate = useNavigate()

  return (
    <Card className="border border-border/60 bg-card/45 backdrop-blur-sm flex flex-col justify-between min-h-[300px]">
      <div>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-4.5 text-primary" />
            <CardTitle className="text-base font-bold tracking-tight">Marketplace Activity</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PREVIEW_LISTINGS.map((listing) => (
              <div
                key={listing.id}
                onClick={() => navigate(`/marketplace`)}
                className="group cursor-pointer overflow-hidden rounded-xl border border-border/40 hover:border-border/80 bg-background/30 hover:bg-background/60 transition-all duration-150 flex flex-col"
              >
                {/* Cover Image */}
                <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative">
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <Badge className="absolute top-2 right-2 text-[9px] font-extrabold uppercase bg-background/95 hover:bg-background/95 text-foreground border border-border/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                    {listing.condition.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Info */}
                <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                    {listing.title}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-extrabold text-foreground flex items-center">
                      <DollarSign className="size-3" />
                      {listing.price.toFixed(2)}
                    </span>
                    <Badge variant="secondary" className="text-[9px] font-semibold tracking-wider text-muted-foreground bg-muted/40 py-0 px-1.5 border-none">
                      {listing.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-2 border-t border-border/40 mt-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs font-bold text-muted-foreground hover:text-foreground justify-between group"
          onClick={() => navigate('/marketplace')}
        >
          <span>Open Campus Marketplace</span>
          <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  )
}
