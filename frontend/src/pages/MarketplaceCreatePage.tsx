import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ListingForm, type ListingFormValues } from '@/features/marketplace/components/ListingForm'

export default function MarketplaceCreatePage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (values: ListingFormValues, files: File[]) => {
    setIsSubmitting(true)
    try {
      // Log parameters to satisfy tsc compiler unused warnings
      console.log('Publishing Listing Metadata:', values, 'photos count:', files.length)
      
      // Simulate file upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      toast.success('Your listing was published successfully!')
      navigate('/marketplace')
    } catch (err) {
      toast.error('Failed to publish listing.')
    } finally {
      setIsSubmitting(false)
    }
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

      <ListingForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  )
}
