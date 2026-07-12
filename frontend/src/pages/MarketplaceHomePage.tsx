import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, ShoppingBag, FolderOpen } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { CategoryChips } from '@/features/marketplace/components/CategoryChips'
import { SearchToolbar } from '@/features/marketplace/components/SearchToolbar'
import { FilterDrawer } from '@/features/marketplace/components/FilterDrawer'
import { SortDropdown } from '@/features/marketplace/components/SortDropdown'
import { MarketplaceCard } from '@/features/marketplace/components/MarketplaceCard'
import { staggerParentVariants, staggerChildVariants } from '@/lib/animations'
import type { Listing, ListingCategory, ListingCondition } from '@/types/marketplace'

// Mock listings for high-fidelity premium landing experience
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
  {
    id: 'l3',
    title: 'Private Room in Shared Apartment (Sublet)',
    description: 'Looking for a subletter for Fall 2026. 5 mins walk to campus. Gym and laundry included. Utilities around $40/mo.',
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
  {
    id: 'l4',
    title: 'Organic Chemistry Tutoring & Exam Prep',
    description: 'A-grade student offering personalized prep sessions. Focus on mechanisms, synthesis, and key test strategies.',
    price: 25.00,
    negotiable: true,
    category: 'SERVICES',
    condition: 'NEW',
    location: 'Science Building',
    status: 'ACTIVE',
    seller: {
      id: 'u4',
      fullName: 'Sofia Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop',
      email: 'sofia@campus.edu',
    },
    images: [
      { id: 'i4', imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop', isPrimary: true },
    ],
    isFavorited: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: 'tutor, chemistry, exam',
  },
  {
    id: 'l5',
    title: 'North Face Winter Jacket (Medium)',
    description: 'Black puffer. Super warm, great for campus winters. Fits true to size. No tears or stains.',
    price: 95.00,
    negotiable: true,
    category: 'CLOTHING',
    condition: 'GOOD',
    location: 'Student Union',
    status: 'ACTIVE',
    seller: {
      id: 'u2',
      fullName: 'Emily Stone',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
      email: 'emily@campus.edu',
    },
    images: [
      { id: 'i5', imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop', isPrimary: true },
    ],
    isFavorited: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: 'clothing, jacket, winter',
  },
]

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
  const [isInfiniteLoading, setIsInfiniteLoading] = useState(false)
  const [pageSize, setPageSize] = useState(4)

  // Local state listings initialized with mock data
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS)

  // Handle toggling favorite status locally
  const handleFavoriteToggle = (id: string, isFavorited: boolean) => {
    setListings(prev =>
      prev.map(item => item.id === id ? { ...item, isFavorited } : item)
    )
  }

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

  // Filter listings based on search, category, price range, condition, and negotiable status
  const sortedAndFiltered = listings
    .filter((item) => {
      // Search matches title, tags, or description
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.tags && item.tags.toLowerCase().includes(searchQuery.toLowerCase()))

      // Category match
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory

      // Price match
      const minVal = parseFloat(minPrice)
      const maxVal = parseFloat(maxPrice)
      const matchesMinPrice = isNaN(minVal) || item.price >= minVal
      const matchesMaxPrice = isNaN(maxVal) || item.price <= maxVal

      // Condition match
      const matchesCondition = selectedCondition === 'ALL' || item.condition === selectedCondition

      // Negotiable match
      const matchesNegotiable = !isNegotiable || item.negotiable

      return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesCondition && matchesNegotiable
    })
    .sort((a, b) => {
      if (sortBy === 'price,asc') {
        return a.price - b.price
      } else if (sortBy === 'price,desc') {
        return b.price - a.price
      } else {
        // Default newest first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  // Paginated subset computation
  const totalItems = sortedAndFiltered.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginatedListings = sortedAndFiltered.slice(startIndex, startIndex + pageSize)

  // Simulate loading more listings for infinite scroll demo
  const handleLoadMore = () => {
    if (currentPage >= totalPages) return
    setIsInfiniteLoading(true)
    setTimeout(() => {
      setPageSize(prev => prev + 2)
      setIsInfiniteLoading(false)
    }, 800)
  }

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
          {paginatedListings.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {paginatedListings.map((listing) => (
                  <MarketplaceCard
                    key={listing.id}
                    listing={listing}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
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
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="rounded-lg h-8 cursor-pointer"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
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
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="rounded-lg h-8 cursor-pointer"
                  >
                    Next
                  </Button>
                </div>
              </div>

              {/* Infinite Scroll Load More Placeholder */}
              {currentPage < totalPages && (
                <div className="flex flex-col items-center justify-center pt-4 border-t border-border/40">
                  {isInfiniteLoading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span>Loading next listings...</span>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLoadMore}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      💡 Load More (Simulated Infinite Scroll)
                    </Button>
                  )}
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
