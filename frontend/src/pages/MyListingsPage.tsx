import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, CheckCircle2, FolderOpen, ShoppingBag, Plus } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Listing } from '@/types/marketplace'

const INITIAL_MY_LISTINGS: Listing[] = [
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
    id: 'l6',
    title: 'Calculus: Early Transcendentals 8th Edition',
    description: 'Used textbook. Some highlighted sections but pages are in perfect readable condition.',
    price: 30.00,
    negotiable: true,
    category: 'BOOKS',
    condition: 'GOOD',
    location: 'West Quad',
    status: 'SOLD',
    seller: {
      id: 'u1',
      fullName: 'Alex River',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
      email: 'alex@campus.edu',
    },
    images: [
      { id: 'i6', imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop', isPrimary: true },
    ],
    isFavorited: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: 'math, calculus, textbook',
  },
]

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>(INITIAL_MY_LISTINGS)
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'SOLD' | 'ARCHIVED'>('ALL')

  const handleMarkAsSold = (id: string) => {
    setListings(prev =>
      prev.map(item => item.id === id ? { ...item, status: 'SOLD' as const } : item)
    )
    toast.success('Listing marked as sold!')
  }

  const handleArchive = (id: string) => {
    setListings(prev =>
      prev.map(item => item.id === id ? { ...item, status: 'ARCHIVED' as const } : item)
    )
    toast.success('Listing moved to archive.')
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this listing?')) {
      setListings(prev => prev.filter(item => item.id !== id))
      toast.success('Listing deleted successfully!')
    }
  }

  const filteredListings = listings.filter(item => {
    if (activeTab === 'ALL') return true
    return item.status === activeTab
  })

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-success/10 text-success border-success/20',
    SOLD: 'bg-muted text-muted-foreground border-border',
    ARCHIVED: 'bg-info/10 text-info border-info/20',
  }

  return (
    <div className="page-container max-w-4xl space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/marketplace">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-3 cursor-pointer">
              <ArrowLeft className="size-4" />
              <span>Back to Marketplace</span>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Listings</h1>
          <p className="text-sm text-muted-foreground">Manage and track items you have published for campus trading.</p>
        </div>

        <Link to="/marketplace/new">
          <Button size="sm" className="rounded-xl gap-1.5 cursor-pointer">
            <Plus className="size-4" />
            <span>Publish Listing</span>
          </Button>
        </Link>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-border gap-2">
        {(['ALL', 'ACTIVE', 'SOLD', 'ARCHIVED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Listings List */}
      {filteredListings.length > 0 ? (
        <div className="space-y-4">
          {filteredListings.map(listing => (
            <div
              key={listing.id}
              className="flex flex-col sm:flex-row gap-4 p-4 border border-border rounded-xl bg-card shadow-sm items-start sm:items-center"
            >
              {/* Product Thumbnail */}
              <div className="size-16 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
                <img
                  src={listing.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop'}
                  alt={listing.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Title & Price info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-foreground truncate">{listing.title}</h3>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusColors[listing.status]}`}>
                    {listing.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Price: <span className="font-semibold text-foreground">${listing.price.toFixed(2)}</span> • Location: {listing.location || 'Campus'}</p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                {listing.status === 'ACTIVE' && (
                  <>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleMarkAsSold(listing.id)}
                      className="rounded-lg gap-1 border-border cursor-pointer"
                    >
                      <CheckCircle2 className="size-3 text-success" />
                      <span>Sold</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleArchive(listing.id)}
                      className="rounded-lg gap-1 border-border cursor-pointer"
                    >
                      <FolderOpen className="size-3 text-info" />
                      <span>Archive</span>
                    </Button>
                  </>
                )}

                <Link to={`/marketplace/${listing.id}/edit`}>
                  <Button
                    variant="outline"
                    size="xs"
                    className="rounded-lg gap-1 border-border cursor-pointer"
                  >
                    <Pencil className="size-3" />
                    <span>Edit</span>
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleDelete(listing.id)}
                  className="rounded-lg gap-1 text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <Trash2 className="size-3" />
                  <span>Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl p-12 text-center bg-card">
          <div className="rounded-full bg-muted p-3 text-muted-foreground mb-4">
            <ShoppingBag className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No listings here</h3>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            You don't have any listings matching this status category.
          </p>
          {activeTab === 'ALL' && (
            <Link to="/marketplace/new">
              <Button size="sm" className="mt-4 rounded-xl cursor-pointer">
                Publish First Listing
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
