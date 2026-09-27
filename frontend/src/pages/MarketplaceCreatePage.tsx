import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { ListingForm, type ListingFormValues } from '@/features/marketplace/components/ListingForm'
import { useCreateMarketplaceListingMutation } from '@/features/marketplace/hooks/useMarketplace'

export default function MarketplaceCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateMarketplaceListingMutation()

  const handleSubmit = async (values: ListingFormValues, files: File[]) => {
    // Generate simple placeholder image URLs if files uploaded
    const imageUrls = files.length > 0
      ? files.map((_, i) => `https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop&v=${i}`)
      : undefined

    await createMutation.mutateAsync({
      title: values.title,
      description: values.description || undefined,
      price: values.price,
      negotiable: values.negotiable,
      category: values.category,
      condition: values.condition,
      location: values.location || undefined,
      status: 'ACTIVE',
      tags: values.tags || undefined,
      imageUrls,
    })

    navigate('/marketplace')
  }

  return (
    <div className="page-container max-w-3xl space-y-6">
      <Link to="/marketplace">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-3 cursor-pointer">
          <ArrowLeft className="size-4" />
          <span>Back to Marketplace</span>
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Publish New Listing</h1>
        <p className="text-sm text-muted-foreground mt-1">List an item or service for peer-to-peer campus trading.</p>
      </div>

      <ListingForm onSubmit={handleSubmit} isSubmitting={createMutation.isPending} />
    </div>
  )
}
