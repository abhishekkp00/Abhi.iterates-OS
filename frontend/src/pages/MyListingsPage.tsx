import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, CheckCircle2, FolderOpen, ShoppingBag, Plus, Loader2 } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import {
  useMyMarketplaceListingsQuery,
  useChangeMarketplaceListingStatusMutation,
  useDeleteMarketplaceListingMutation,
} from '@/features/marketplace/hooks/useMarketplace'
import type { ListingStatus } from '@/types/marketplace'

export default function MyListingsPage() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'SOLD' | 'ARCHIVED'>('ALL')
  const currentPage = 1

  const { data: pageData, isLoading, isError, refetch } = useMyMarketplaceListingsQuery({
    page: currentPage - 1,
    size: 20,
    sort: 'createdAt,desc',
  })

  const changeStatusMutation = useChangeMarketplaceListingStatusMutation()
  const deleteMutation = useDeleteMarketplaceListingMutation()

  const rawListings = pageData?.content || []

  const handleMarkAsSold = (id: string) => {
    changeStatusMutation.mutate({ id, status: 'SOLD' })
  }

  const handleArchive = (id: string) => {
    changeStatusMutation.mutate({ id, status: 'ARCHIVED' })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this listing?')) {
      deleteMutation.mutate(id)
    }
  }

  const filteredListings = rawListings.filter((item) => {
    if (activeTab === 'ALL') return true
    return item.status === activeTab
  })

  const statusColors: Record<ListingStatus, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    SOLD: 'bg-muted text-muted-foreground border-border',
    ARCHIVED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    DRAFT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
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
        {(['ALL', 'ACTIVE', 'SOLD', 'ARCHIVED'] as const).map((tab) => (
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
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium">Fetching your active listings...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-destructive/40 rounded-xl p-12 text-center bg-destructive/5">
          <p className="text-sm font-bold text-foreground">Could not load your listings</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3 text-xs">
            Retry Connection
          </Button>
        </div>
      ) : filteredListings.length > 0 ? (
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-col sm:flex-row gap-4 p-4 border border-border rounded-xl bg-card shadow-sm items-start sm:items-center"
            >
              {/* Product Thumbnail */}
              <div className="size-16 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
                <img
                  src={listing.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop'}
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
                      disabled={changeStatusMutation.isPending}
                      onClick={() => handleMarkAsSold(listing.id)}
                      className="rounded-lg gap-1 border-border cursor-pointer"
                    >
                      <CheckCircle2 className="size-3 text-emerald-400" />
                      <span>Sold</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      disabled={changeStatusMutation.isPending}
                      onClick={() => handleArchive(listing.id)}
                      className="rounded-lg gap-1 border-border cursor-pointer"
                    >
                      <FolderOpen className="size-3 text-blue-400" />
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
                  disabled={deleteMutation.isPending}
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
