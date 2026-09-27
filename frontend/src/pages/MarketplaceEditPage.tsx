import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate, useBlocker } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, AlertCircle, Loader2 } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { ListingForm, type ListingFormValues } from '@/features/marketplace/components/ListingForm'
import {
  useMarketplaceListingQuery,
  useUpdateMarketplaceListingMutation,
} from '@/features/marketplace/hooks/useMarketplace'

export default function MarketplaceEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isDirty, setIsDirty] = useState(false)

  // Fetch listing details from backend
  const { data: listing, isLoading, isError } = useMarketplaceListingQuery(id)
  const updateMutation = useUpdateMarketplaceListingMutation()

  // SPA navigation blocker via React Router v6
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !updateMutation.isPending && currentLocation.pathname !== nextLocation.pathname
  )

  // Tab/browser close or reload prevention
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !updateMutation.isPending) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, updateMutation.isPending])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 max-w-3xl mx-auto">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">Loading listing details...</p>
      </div>
    )
  }

  if (isError || !listing || !id) {
    return (
      <div className="page-container max-w-3xl space-y-6 text-center py-16">
        <h2 className="text-lg font-bold text-foreground">Listing not found</h2>
        <p className="text-xs text-muted-foreground">The requested listing could not be found or you do not have permission to edit it.</p>
        <Link to="/marketplace">
          <Button size="sm">Back to Marketplace</Button>
        </Link>
      </div>
    )
  }

  const handleSubmit = async (values: ListingFormValues, files: File[]) => {
    const existingUrls = listing.images?.map((img) => img.imageUrl) || []
    const newUrls = files.map((_, i) => `https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop&v=${i}`)
    const imageUrls = [...existingUrls, ...newUrls]

    setIsDirty(false)
    await updateMutation.mutateAsync({
      id,
      data: {
        title: values.title,
        description: values.description || undefined,
        price: values.price,
        negotiable: values.negotiable,
        category: values.category,
        condition: values.condition,
        location: values.location || undefined,
        status: listing.status,
        tags: values.tags || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      },
    })

    navigate(`/marketplace/${id}`)
  }

  return (
    <div className="page-container max-w-3xl space-y-6">
      <Link to={`/marketplace/${id}`}>
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-3 cursor-pointer">
          <ArrowLeft className="size-4" />
          <span>Back to Details</span>
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Campus Listing</h1>
        <p className="text-sm text-muted-foreground mt-1">Modify details for your active campus listing.</p>
      </div>

      <ListingForm
        initialValues={listing}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        submitLabel="Save Changes"
        onDirtyStateChange={setIsDirty}
      />

      {/* Unsaved Changes Blocker Modal overlay */}
      <AnimatePresence>
        {blocker.state === 'blocked' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 m-4"
            >
              <div className="flex gap-3">
                <div className="rounded-full bg-destructive/10 p-2 text-destructive h-fit">
                  <AlertCircle className="size-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Discard Unsaved Changes?</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You have unsaved edits in your listing form. Navigating away will discard these changes permanently.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2.5 border-t border-border pt-4 text-xs font-semibold">
                <Button variant="outline" size="sm" onClick={() => blocker.reset()} className="cursor-pointer">
                  Keep Editing
                </Button>
                <Button variant="destructive" size="sm" onClick={() => blocker.proceed()} className="cursor-pointer">
                  Discard
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
