import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useResourcesStore } from '@/features/resources/store/resources.store'
import {
  useResourcesListQuery,
  useDeleteResourceMutation,
} from '@/features/resources/hooks/useResources'
import { ResourceCard } from '@/features/resources/components/ResourceCard'
import { ResourceTable } from '@/features/resources/components/ResourceTable'
import { ResourceListSkeleton } from '@/features/resources/components/ResourceListSkeleton'
import { ResourceFilters } from '@/features/resources/components/ResourceFilters'
import { SearchBar } from '@/features/resources/components/SearchBar'
import { CollectionCard } from '@/features/resources/components/CollectionCard'
import { CreateCollectionDialog } from '@/features/resources/components/CreateCollectionDialog'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Plus,
  Grid,
  List,
  SlidersHorizontal,
  Pin,
  Clock,
  Sparkles,
  Tag,
  AlertCircle,
} from '@/lib/icons'

// Icon registry for collection tags
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  BookOpen,
  Clock,
  Tag,
}

interface CustomCollection {
  id: string
  name: string
  icon: string
  count: number
  color: string
}

const DEFAULT_COLLECTIONS: CustomCollection[] = [
  { id: 'c1', name: 'DSA Prep', icon: 'Sparkles', count: 2, color: 'text-purple-400' },
  { id: 'c2', name: 'Calculus II', icon: 'BookOpen', count: 1, color: 'text-emerald-400' },
  { id: 'c3', name: 'Midterms past papers', icon: 'Clock', count: 1, color: 'text-amber-400' },
]

export default function LibraryPage() {
  const navigate = useNavigate()
  const [showFilters, setShowFilters] = useState(false)
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Custom Collections state loaded from local storage
  const [collections, setCollections] = useState<CustomCollection[]>(() => {
    const saved = localStorage.getItem('abhi-os-custom-collections')
    return saved ? JSON.parse(saved) : DEFAULT_COLLECTIONS
  })

  // Save custom collections to local storage
  useEffect(() => {
    localStorage.setItem('abhi-os-custom-collections', JSON.stringify(collections))
  }, [collections])

  // Grab resources state store parameters
  const {
    searchQuery,
    selectedCategories,
    toggleCategory,
    selectedPriorities,
    selectedStatuses,
    viewLayout,
    setViewLayout,
    sortBy,
    sortOrder,
    setSort,
    page,
    pageSize,
    resetFilters,
  } = useResourcesStore()

  // Dynamic Query params
  const queryParams = {
    page,
    size: pageSize,
    search: searchQuery || undefined,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    priorities: selectedPriorities.length > 0 ? selectedPriorities : undefined,
    statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
  }

  // Load resources using React Query
  const { data: resourcesData, isLoading } = useResourcesListQuery(queryParams)
  const allResources = resourcesData?.content || []

  // Delete mutation
  const deleteMutation = useDeleteResourceMutation()

  // Client-side filtering when a collection is selected
  const filteredResources = allResources.filter((res) => {
    if (!activeCollection) return true
    const activeCol = collections.find((c) => c.id === activeCollection)
    if (!activeCol) return true

    const keyword = activeCol.name.toLowerCase()
    const titleMatch = res.title.toLowerCase().includes(keyword)
    const descMatch = res.description?.toLowerCase().includes(keyword)
    const tagMatch = res.tags?.toLowerCase().includes(keyword)
    const categoryMatch = res.category.toLowerCase().includes(keyword.split(' ')[0] || 'nevermatch')

    return titleMatch || descMatch || tagMatch || categoryMatch
  })

  // Client-side sorting logic
  const sortedResources = [...filteredResources].sort((a, b) => {
    const factor = sortOrder === 'asc' ? 1 : -1
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title) * factor
    }
    if (sortBy === 'deadline') {
      const aTime = a.deadline ? new Date(a.deadline).getTime() : Infinity
      const bTime = b.deadline ? new Date(b.deadline).getTime() : Infinity
      return (aTime - bTime) * factor
    }
    const aTime = new Date(a.createdAt).getTime()
    const bTime = new Date(b.createdAt).getTime()
    return (aTime - bTime) * factor
  })

  const handleUploadClick = () => {
    navigate('/resources/new')
  }

  const handleCategoryChipClick = (category: string) => {
    if (category === 'ALL') {
      resetFilters()
    } else {
      toggleCategory(category as any)
    }
  }

  const handleCreateCollection = (name: string, icon: string, color: string) => {
    const newCol: CustomCollection = {
      id: `custom-${Date.now()}`,
      name,
      icon,
      count: 0,
      color,
    }
    setCollections((prev) => [...prev, newCol])
  }

  const handleDeleteCollection = (id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id))
    if (activeCollection === id) {
      setActiveCollection(null)
    }
  }

  const handleDeleteResource = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this study resource? This operation is permanent.')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  return (
    <div className="page-container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Welcome Banner */}
      <Card className="border border-border/60 bg-gradient-to-r from-card/80 to-purple-950/15 backdrop-blur-md">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <BookOpen className="size-8 text-primary" />
              <span>Library Workspace</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              Your central repository for managing study sheets, textbooks, and exam papers. Keep files organized inside custom collections.
            </p>
          </div>
          <Button
            onClick={handleUploadClick}
            size="lg"
            className="rounded-xl gap-2 font-bold cursor-pointer bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg shadow-primary/20"
          >
            <Plus className="size-5" />
            <span>Upload Resource</span>
          </Button>
        </CardContent>
      </Card>

      {/* Library Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Pinned Collections Sidebar */}
        <div className="space-y-5">
          <Card className="border border-border/60 bg-card/45 backdrop-blur-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Pin className="size-3.5" />
                <span>Collections</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 rounded-md p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => setIsCreateOpen(true)}
                title="Create Collection"
              >
                <Plus className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              <button
                onClick={() => setActiveCollection(null)}
                className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                  !activeCollection
                    ? 'border-primary/20 bg-primary/10 text-primary'
                    : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>All Documents</span>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {allResources.length}
                </Badge>
              </button>

              {collections.map((c) => {
                const IconComponent = ICON_MAP[c.icon] || Tag
                const isActive = activeCollection === c.id
                return (
                  <CollectionCard
                    key={c.id}
                    collection={c}
                    isActive={isActive}
                    onClick={() => setActiveCollection(c.id)}
                    onDelete={() => handleDeleteCollection(c.id)}
                    IconComponent={IconComponent}
                  />
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Search, Toolbar, View grid */}
        <div className="lg:col-span-3 space-y-4">
          {/* Toolbar row */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <SearchBar />

            {/* Layout & Filter actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Sorting Selector */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSort(field as any, order as any)
                }}
                className="h-10 px-3 text-xs font-bold rounded-xl border border-border/80 bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-muted-foreground hover:text-foreground transition-all"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="deadline-asc">Deadline (Soonest)</option>
                <option value="deadline-desc">Deadline (Latest)</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-10 rounded-xl border-border/80 gap-1.5 cursor-pointer font-bold ${
                  showFilters ? 'bg-muted' : 'bg-background'
                }`}
              >
                <SlidersHorizontal className="size-4" />
                <span>Filters</span>
                {(selectedCategories.length > 0 || selectedPriorities.length > 0 || selectedStatuses.length > 0) && (
                  <span className="size-2 rounded-full bg-primary" />
                )}
              </Button>

              <div className="flex items-center rounded-xl border border-border/80 bg-background/50 p-1">
                <Button
                  variant={viewLayout === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="size-8 rounded-lg cursor-pointer"
                  onClick={() => setViewLayout('grid')}
                >
                  <Grid className="size-4" />
                </Button>
                <Button
                  variant={viewLayout === 'table' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="size-8 rounded-lg cursor-pointer"
                  onClick={() => setViewLayout('table')}
                >
                  <List className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced filters */}
          <ResourceFilters show={showFilters} />

          {/* Category Chip Selector */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant={selectedCategories.length === 0 ? 'default' : 'outline'}
              size="xs"
              className="rounded-full px-3.5 py-1 text-[11px] font-semibold tracking-wide cursor-pointer"
              onClick={() => handleCategoryChipClick('ALL')}
            >
              All Files
            </Button>
            {['LECTURE', 'BOOK', 'CHEATSHEET', 'PAST_PAPER', 'OTHER'].map((cat) => {
              const isActive = selectedCategories.includes(cat as any)
              return (
                <Button
                  key={cat}
                  variant={isActive ? 'default' : 'outline'}
                  size="xs"
                  className="rounded-full px-3.5 py-1 text-[11px] font-semibold tracking-wide cursor-pointer uppercase"
                  onClick={() => handleCategoryChipClick(cat)}
                >
                  {cat.replace('_', ' ')}
                </Button>
              )
            })}
          </div>

          {/* Resource Grid / Table Content */}
          <div className="min-h-[300px] pt-2">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ResourceListSkeleton layout={viewLayout} count={viewLayout === 'grid' ? 6 : 5} />
                </motion.div>
              ) : sortedResources.length > 0 ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {viewLayout === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sortedResources.map((res) => (
                        <ResourceCard key={res.id} resource={res} />
                      ))}
                    </div>
                  ) : (
                    <ResourceTable resources={sortedResources} onDeleteClick={handleDeleteResource} />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center"
                >
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <AlertCircle className="size-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">No resources found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">
                    Try refining your search terms or clearing categories filter to find your study files.
                  </p>
                  <div className="mt-5 flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetFilters} className="rounded-xl cursor-pointer">
                      Reset Filters
                    </Button>
                    <Button size="sm" onClick={handleUploadClick} className="rounded-xl cursor-pointer">
                      Add Document
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Creation Modal Dialog */}
      <CreateCollectionDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateCollection}
      />
    </div>
  )
}
