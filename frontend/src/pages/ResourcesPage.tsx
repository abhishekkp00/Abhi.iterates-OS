import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ResourceToolbar } from '@/features/resources/components/ResourceToolbar'
import { ResourceFilters } from '@/features/resources/components/ResourceFilters'
import { ResourcePagination } from '@/features/resources/components/ResourcePagination'
import { ResourceCard } from '@/features/resources/components/ResourceCard'
import { ResourceTable } from '@/features/resources/components/ResourceTable'
import { ResourceListSkeleton } from '@/features/resources/components/ResourceListSkeleton'
import { useResourcesStore } from '@/features/resources/store/resources.store'
import { useResourcesListQuery, useDeleteResourceMutation } from '@/features/resources/hooks/useResources'
import { useMyPurchasesQuery } from '@/features/marketplace/hooks/useStore'
import { staggerParentVariants, staggerChildVariants } from '@/lib/animations'
import { BookOpen, Download, Sparkles, Bot, SlidersHorizontal } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ResourcesPage() {
  const navigate = useNavigate()
  const [showFilters, setShowFilters] = useState(false)

  const { data: myPurchases = [] } = useMyPurchasesQuery()

  // Grab ZUSTAND filter properties
  const {
    searchQuery,
    selectedCategories,
    selectedPriorities,
    selectedStatuses,
    sortBy,
    sortOrder,
    viewLayout,
    page,
    setPage,
    pageSize,
    resetFilters,
  } = useResourcesStore()

  // Query resources from Backend API
  const { data: resourcesPage, isLoading: loading } = useResourcesListQuery({
    page,
    size: pageSize,
    search: searchQuery.trim() || undefined,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    priorities: selectedPriorities.length > 0 ? selectedPriorities : undefined,
    statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    sort: `${sortBy},${sortOrder}`,
  })

  const deleteMutation = useDeleteResourceMutation()

  const paginatedResources = resourcesPage?.content || []
  const totalItems = resourcesPage?.totalElements || 0
  const totalPages = Math.max(1, resourcesPage?.totalPages || 1)

  // Ensure current page doesn't overshoot boundaries if list shrinks
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [totalPages, page, setPage])

  function handleAddResource() {
    navigate('/resources/new')
  }

  function handleOpenStudyRoom(item: any) {
    const fileName = item.fileName || `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
    const url = item.fileUrl || ''
    navigate(`/resources/study/${item.id}?file=${encodeURIComponent(fileName)}&url=${encodeURIComponent(url)}`)
  }

  function handleDeleteResource(id: string) {
    if (confirm('Are you sure you want to delete this study resource?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="page-container max-w-7xl">
      <motion.div
        variants={staggerParentVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Page Header */}
        <motion.div
          variants={staggerChildVariants}
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                My Resources
              </h1>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {totalItems} visible
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Store, organize, and search your study materials.
            </p>
          </div>
        </motion.div>

        {/* Purchased Marketplace Notes Section */}
        {myPurchases.length > 0 && (
          <motion.div variants={staggerChildVariants} className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-400" />
                Unlocked Marketplace & Placement Notes ({myPurchases.length})
              </h2>
              <span className="text-xs text-muted-foreground">Interactive AI Study Room Available</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPurchases.map((item) => (
                <Card key={item.id} className="bg-card/70 border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                  <CardHeader className="p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        {item.category}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] bg-indigo-500/10 text-indigo-400">
                        <Bot className="size-3 mr-1" />
                        AI Chat Ready
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground pt-1 line-clamp-1">{item.title}</CardTitle>
                  </CardHeader>

                  <CardContent className="px-4 py-1 space-y-1 text-xs text-muted-foreground">
                    <p className="line-clamp-2">{item.description}</p>
                  </CardContent>

                  <CardFooter className="p-4 pt-3 flex gap-2 border-t border-border/40">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenStudyRoom(item)}
                      className="flex-1 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      <BookOpen className="size-3.5" />
                      Open Study Room & AI Notes
                    </Button>
                    <a href={item.fileUrl} target="_blank" rel="noreferrer" download>
                      <Button variant="outline" size="sm" className="text-xs gap-1.5">
                        <Download className="size-3.5" />
                        Download
                      </Button>
                    </a>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Toolbar */}
        <motion.div variants={staggerChildVariants}>
          <ResourceToolbar
            onAddClick={handleAddResource}
            onToggleFilters={() => setShowFilters((f) => !f)}
            showFilters={showFilters}
            totalItems={totalItems}
          />
        </motion.div>

        {/* Collapsible advanced filters */}
        <ResourceFilters show={showFilters} />

        {/* Main List Layouts */}
        <motion.div variants={staggerChildVariants} className="min-h-[300px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <ResourceListSkeleton layout={viewLayout} count={viewLayout === 'grid' ? 6 : 5} />
              </motion.div>
            ) : paginatedResources.length > 0 ? (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {viewLayout === 'grid' ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedResources.map((res) => (
                      <ResourceCard key={res.id} resource={res} />
                    ))}
                  </div>
                ) : (
                  <ResourceTable
                    resources={paginatedResources}
                    onDeleteClick={handleDeleteResource}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-16 text-center shadow-sm"
              >
                <div className="rounded-full bg-muted p-4">
                  <SlidersHorizontal className="size-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">No resources match your filters</h3>
                <p className="mt-2 text-xs text-muted-foreground max-w-sm leading-normal">
                  Try clearing your search text or toggling different status and priority filters to locate your resources.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={resetFilters}
                    className="rounded-md border border-input bg-background px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-accent transition-colors"
                  >
                    Clear all filters
                  </button>
                  <button
                    onClick={handleAddResource}
                    className="rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-colors"
                  >
                    Add new resource
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Pagination Controls */}
        <motion.div variants={staggerChildVariants}>
          <ResourcePagination totalItems={totalItems} />
        </motion.div>
      </motion.div>
    </div>
  )
}
