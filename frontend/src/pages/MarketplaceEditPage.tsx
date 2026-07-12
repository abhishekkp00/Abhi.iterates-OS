import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate, useBlocker } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, AlertCircle } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ListingForm, type ListingFormValues } from '@/features/marketplace/components/ListingForm'
import type { Listing } from '@/types/marketplace'

// Reference matching mock listings to pre-populate form
const MOCK_LISTINGS: Listing[] = [
  {
    id: 'l1',
    title: 'Introduction to Algorithms (CLRS) 4th Edition',
    description: 'Barely used for one semester. No highlights or markings. Perfect condition for CS courses.',
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
    ],
    isFavorited: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: 'cs, algorithms, textbook',
  },
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

export default function MarketplaceEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Find listing or fallback
  const listing = MOCK_LISTINGS.find(item => item.id === id)

  // SPA navigation blocker via React Router v6
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !isSubmitting && currentLocation.pathname !== nextLocation.pathname
  )

  // Tab/browser close or reload prevention
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitting) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, isSubmitting])
  
  if (!listing) {
    return (
      <div className="page-container max-w-3xl space-y-6 text-center">
        <h2 className="text-lg font-bold text-foreground">Listing not found</h2>
        <Link to="/marketplace">
          <Button size="sm">Back to Marketplace</Button>
        </Link>
      </div>
    )
  }

  const handleSubmit = async (values: ListingFormValues, files: File[]) => {
    setIsSubmitting(true)
    try {
      console.log('Updating Listing ID:', id, 'Metadata:', values, 'new photos count:', files.length)
      // Simulate file upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      setIsDirty(false) // Reset dirty state to bypass navigation block on success
      toast.success('Your listing was updated successfully!')
      navigate(`/marketplace/${id}`)
    } catch (err) {
      toast.error('Failed to save listing changes.')
    } finally {
      setIsSubmitting(false)
    }
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
        isSubmitting={isSubmitting}
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
