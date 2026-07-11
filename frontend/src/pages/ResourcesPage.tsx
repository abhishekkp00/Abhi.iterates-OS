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
import { staggerParentVariants, staggerChildVariants } from '@/lib/animations'
import type { Resource } from '@/types/resources'
import { SlidersHorizontal } from '@/lib/icons'

// ── Realistic Mock Data ──────────────────────────────────────────────────────
const MOCK_RESOURCES: Resource[] = [
  {
    id: 'res-1',
    title: 'Algorithms & Complexity Cheat Sheet',
    description: 'Quick reference guide covering Sorting, Big-O, Graph traversals (DFS/BFS), and dynamic programming paradigms.',
    category: 'CHEATSHEET',
    status: 'ACTIVE',
    priority: 'HIGH',
    deadline: '2026-07-20T23:59:59Z',
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-02T12:00:00Z',
    attachments: [
      { id: 'att-1', fileName: 'algorithms_ref.pdf', fileSize: 1024 * 1500, contentType: 'application/pdf', downloadUrl: '#' }
    ],
    userId: 'user-1'
  },
  {
    id: 'res-2',
    title: 'Introduction to Organic Chemistry - Lecture Slides',
    description: 'Detailed lecture material on covalent bonds, functional groups, and carbon chains reaction mechanisms.',
    category: 'LECTURE',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    deadline: '2026-07-28T18:00:00Z',
    createdAt: '2026-07-02T09:30:00Z',
    updatedAt: '2026-07-02T09:30:00Z',
    attachments: [
      { id: 'att-2', fileName: 'chem_lecture_3.pdf', fileSize: 1024 * 3400, contentType: 'application/pdf', downloadUrl: '#' },
      { id: 'att-3', fileName: 'reaction_formulas.docx', fileSize: 1024 * 450, contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', downloadUrl: '#' }
    ],
    userId: 'user-1'
  },
  {
    id: 'res-3',
    title: 'Operating Systems Midterm past paper - Fall 2025',
    description: 'Exam questions from past year covering process synchronization, semaphores, and virtual memory paging.',
    category: 'PAST_PAPER',
    status: 'ACTIVE',
    priority: 'HIGH',
    deadline: '2026-07-15T09:00:00Z',
    createdAt: '2026-07-03T14:00:00Z',
    updatedAt: '2026-07-03T15:30:00Z',
    attachments: [
      { id: 'att-4', fileName: 'os_midterm_2025.pdf', fileSize: 1024 * 850, contentType: 'application/pdf', downloadUrl: '#' }
    ],
    userId: 'user-1'
  },
  {
    id: 'res-4',
    title: 'Calculus II Paging/Sequences Outline',
    description: 'Comprehensive assignment guide focusing on Taylor series convergence and integration techniques.',
    category: 'OTHER',
    status: 'DRAFT',
    priority: 'LOW',
    createdAt: '2026-07-04T16:00:00Z',
    updatedAt: '2026-07-04T16:00:00Z',
    attachments: [],
    userId: 'user-1'
  },
  {
    id: 'res-5',
    title: 'Machine Learning Deep Foundations - Volume I',
    description: 'Open source PDF book on linear algebra bases, loss optimization, and neural architecture principles.',
    category: 'BOOK',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    deadline: '2026-08-05T12:00:00Z',
    createdAt: '2026-07-05T08:00:00Z',
    updatedAt: '2026-07-06T10:00:00Z',
    attachments: [
      { id: 'att-5', fileName: 'ml_foundations_vol1.pdf', fileSize: 1024 * 12400, contentType: 'application/pdf', downloadUrl: '#' }
    ],
    userId: 'user-1'
  },
  {
    id: 'res-6',
    title: 'Intellectual Property Law Case Files',
    description: 'Archived studies on fair use guidelines, software patenting laws, and copyright infringement rulings.',
    category: 'LECTURE',
    status: 'ARCHIVED',
    priority: 'LOW',
    createdAt: '2026-06-25T11:00:00Z',
    updatedAt: '2026-06-29T14:00:00Z',
    attachments: [
      { id: 'att-6', fileName: 'ip_law_cases.pdf', fileSize: 1024 * 5100, contentType: 'application/pdf', downloadUrl: '#' }
    ],
    userId: 'user-1'
  }
]

export default function ResourcesPage() {
  const navigate = useNavigate()
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES)

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

  // Simulate loading state transitions on first render or query changes
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategories, selectedPriorities, selectedStatuses, sortBy, sortOrder])

  function handleAddResource() {
    navigate('/resources/new')
  }

  function handleDeleteResource(id: string) {
    if (confirm('Are you sure you want to delete this resource?')) {
      setResources((prev) => prev.filter((r) => r.id !== id))
    }
  }

  // ── Apply Query & Filters ─────────────────────────────────────────────────
  const filteredResources = resources.filter((res) => {
    // Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const titleMatch = res.title.toLowerCase().includes(q)
      const descMatch = res.description?.toLowerCase().includes(q)
      if (!titleMatch && !descMatch) return false
    }

    // Categories filter
    if (selectedCategories.length > 0) {
      if (!selectedCategories.includes(res.category)) return false
    }

    // Priorities filter
    if (selectedPriorities.length > 0) {
      if (!selectedPriorities.includes(res.priority)) return false
    }

    // Statuses filter
    if (selectedStatuses.length > 0) {
      if (!selectedStatuses.includes(res.status)) return false
    }

    return true
  })

  // ── Apply Sorting ─────────────────────────────────────────────────────────
  const sortedResources = [...filteredResources].sort((a, b) => {
    let factor = sortOrder === 'asc' ? 1 : -1
    
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title) * factor
    }

    if (sortBy === 'deadline') {
      const aTime = a.deadline ? new Date(a.deadline).getTime() : Infinity
      const bTime = b.deadline ? new Date(b.deadline).getTime() : Infinity
      return (aTime - bTime) * factor
    }

    // Default: Sort by createdAt
    const aTime = new Date(a.createdAt).getTime()
    const bTime = new Date(b.createdAt).getTime()
    return (aTime - bTime) * factor
  })

  // ── Apply Pagination Slicing ──────────────────────────────────────────────
  const totalItems = sortedResources.length
  const paginatedResources = sortedResources.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  // Ensure current page doesn't overshoot boundaries if list shrinks
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [totalPages, page, setPage])

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
