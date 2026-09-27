import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, ShoppingBag, FolderOpen, Loader2 } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { CategoryChips } from '@/features/marketplace/components/CategoryChips'
import { SearchToolbar } from '@/features/marketplace/components/SearchToolbar'
import { FilterDrawer } from '@/features/marketplace/components/FilterDrawer'
import { SortDropdown } from '@/features/marketplace/components/SortDropdown'
import { MarketplaceCard } from '@/features/marketplace/components/MarketplaceCard'
import { useMarketplaceListingsQuery } from '@/features/marketplace/hooks/useMarketplace'
import { staggerParentVariants, staggerChildVariants } from '@/lib/animations'
import type { ListingCategory, ListingCondition } from '@/types/marketplace'

export default function MarketplaceHomePage() {
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [selectedCondition, setSelectedCondition] = useState<ListingCondition | 'ALL'>('ALL')
  const [isNegotiable, setIsNegotiable] = useState(false)
  const [sortBy, setSortBy] = useState('createdAt,desc')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  // Fetch real listings from backend API
  const { data: pageData, isLoading, isError, refetch } = useMarketplaceListingsQuery({
    search: searchQuery.trim() || undefined,
    categories: selectedCategory === 'ALL' ? undefined : selectedCategory,
    conditions: selectedCondition === 'ALL' ? undefined : selectedCondition,
    statuses: 'ACTIVE',
    page: currentPage - 1,
    size: pageSize,
    sort: sortBy,
  })

  const rawListings = pageData?.content || []

  // Client-side price & negotiable filter refinements
  const filteredListings = rawListings.filter((item) => {
    const minVal = parseFloat(minPrice)
    const maxVal = parseFloat(maxPrice)
    const matchesMinPrice = isNaN(minVal) || item.price >= minVal
    const matchesMaxPrice = isNaN(maxVal) || item.price <= maxVal
    const matchesNegotiable = !isNegotiable || item.negotiable
    return matchesMinPrice && matchesMaxPrice && matchesNegotiable
  })

  const totalItems = pageData?.totalElements ?? filteredListings.length
  const totalPages = pageData?.totalPages ?? 1
  const startIndex = (currentPage - 1) * pageSize

  // Clear all filters helper
  const handleClearFilters = () => {
    setMinPrice('')
    setMaxPrice('')
    setSelectedCondition('ALL')
    setIsNegotiable(false)
    setSearchQuery('')
    setSelectedCategory('ALL')
    setCurrentPage(1)
  }

  // Count active filters (excluding search, category, and sorting)
  const activeFiltersCount = [
    minPrice !== '',
    maxPrice !== '',
    selectedCondition !== 'ALL',
    isNegotiable === true,
  ].filter(Boolean).length

  return (
    <div className="page-container max-w-6xl">
      <motion.div
        variants={staggerParentVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Header Hero Section */}
        <motion.div variants={staggerChildVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShoppingBag className="size-6 text-primary" />
              <span>Student Marketplace</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Buy, sell, and trade peer-to-peer with fellow students on campus.
            </p>
          </div>

          <div className="flex gap-2">
            <Link to="/my-listings">
              <Button variant="outline" size="sm" className="rounded-xl border-border cursor-pointer">
                <FolderOpen className="size-4 mr-1.5" />
                <span>My Listings</span>
              </Button>
            </Link>
            <Link to="/marketplace/new">
              <Button size="sm" className="rounded-xl gap-1.5 cursor-pointer">
                <Plus className="size-4" />
                <span>Publish Listing</span>
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Category Filter Chips */}
        <motion.div variants={staggerChildVariants}>
          <CategoryChips
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat)
              setCurrentPage(1)
            }}
          />
        </motion.div>

        {/* Search, Filter Toggle, Sort Row */}
        <motion.div variants={staggerChildVariants} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <SearchToolbar
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q)
              setCurrentPage(1)
            }}
            onToggleFilterDrawer={() => setIsFilterOpen(true)}
            activeFiltersCount={activeFiltersCount}
          >
            <SortDropdown sortBy={sortBy} onSortByChange={(s) => {
              setSortBy(s)
              setCurrentPage(1)
            }} />
          </SearchToolbar>
        </motion.div>

        {/* Listings Grid */}
        <motion.div variants={staggerChildVariants} className="pt-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Fetching active campus listings...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-destructive/40 rounded-xl p-12 text-center bg-destructive/5">
              <p className="text-sm font-bold text-foreground">Could not load marketplace listings</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3 text-xs">
                Retry Connection
              </Button>
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredListings.map((listing) => (
                  <MarketplaceCard key={listing.id} listing={listing} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-4 gap-4">
                  <p className="text-xs text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-foreground">
                      {Math.min(startIndex + pageSize, totalItems)}
                    </span>{' '}
                    of <span className="font-semibold text-foreground">{totalItems}</span> listings
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className="rounded-lg h-8 cursor-pointer"
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                      <Button
                        key={pNum}
                        variant={currentPage === pNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pNum)}
                        className="rounded-lg size-8 p-0 cursor-pointer"
                      >
                        {pNum}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      className="rounded-lg h-8 cursor-pointer"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl p-12 text-center bg-card">
              <div className="rounded-full bg-muted p-3 text-muted-foreground mb-4">
                <ShoppingBag className="size-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No listings found</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                We couldn't find any listings matching your search or filters. Try adjusting your parameters.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="mt-4 rounded-xl cursor-pointer"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Advanced Filter Drawer Flyout */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        minPrice={minPrice}
        onMinPriceChange={setMinPrice}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        selectedCondition={selectedCondition}
        onSelectCondition={setSelectedCondition}
        isNegotiable={isNegotiable}
        onNegotiableToggle={setIsNegotiable}
        onClearFilters={handleClearFilters}
      />
    </div>
  )
}
