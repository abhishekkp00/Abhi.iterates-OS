import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Search, X, LayoutDashboard, ShoppingBag,
  FolderOpen, Sparkles, Settings, User, ArrowRight,
  Bot, Upload, Plus, Calendar, BarChart3, ShieldAlert,
  CheckSquare, FileText
} from '@/lib/icons'
import { scaleVariants } from '@/lib/animations'
import { useResourcesListQuery } from '@/features/resources/hooks/useResources'
import { useStoreResourcesQuery, useMyPurchasesQuery } from '@/features/marketplace/hooks/useStore'
import { Badge } from '@/components/ui/badge'

interface NavItem {
  id: string
  label: string
  description?: string
  href?: string
  action?: () => void
  icon: any
  category: 'Pages' | 'Actions' | 'Resources' | 'Marketplace'
  badge?: string
}

interface CommandMenuProps {
  open: boolean
  onClose: () => void
}

const STATIC_PAGES: NavItem[] = [
  { id: 'page-dashboard', label: 'Dashboard', description: 'Overview of progress, tasks, & study activity', href: '/dashboard', icon: LayoutDashboard, category: 'Pages' },
  { id: 'page-resources', label: 'My Resources', description: 'Personal study documents, cheat sheets, & notes', href: '/resources', icon: FolderOpen, category: 'Pages' },
  { id: 'page-ai', label: 'AI Workspace & Assistant', description: 'Interactive AI chat, note generation, & assistance', href: '/ai', icon: Sparkles, category: 'Pages', badge: 'AI Powered' },
  { id: 'page-marketplace', label: 'Marketplace', description: 'Unlocked placement notes & store materials', href: '/marketplace', icon: ShoppingBag, category: 'Pages' },
  { id: 'page-tasks', label: 'Tasks & Planner', description: 'Manage study tasks, assignments, & deadlines', href: '/tasks', icon: CheckSquare, category: 'Pages' },
  { id: 'page-calendar', label: 'Study Calendar', description: 'Schedule exams, deadlines, & study sessions', href: '/calendar', icon: Calendar, category: 'Pages' },
  { id: 'page-analytics', label: 'Analytics & Insights', description: 'Track study performance, stats, & metrics', href: '/analytics', icon: BarChart3, category: 'Pages' },
  { id: 'page-admin-store', label: 'Admin Marketplace Management', description: 'Upload notes, set prices, & manage catalog', href: '/admin/marketplace', icon: ShieldAlert, category: 'Pages', badge: 'Admin' },
  { id: 'page-profile', label: 'User Profile', description: 'Manage your account details and preferences', href: '/profile', icon: User, category: 'Pages' },
  { id: 'page-settings', label: 'Settings', description: 'Application settings & configurations', href: '/settings', icon: Settings, category: 'Pages' },
]

const QUICK_ACTIONS: NavItem[] = [
  { id: 'action-ai', label: 'Ask AI Study Assistant', description: 'Open AI chat to explain concepts or summarize topics', href: '/ai', icon: Bot, category: 'Actions', badge: 'Quick AI' },
  { id: 'action-upload', label: 'Upload New Study Resource', description: 'Add PDF notes, cheat sheets, or past papers', href: '/resources/new', icon: Upload, category: 'Actions' },
  { id: 'action-task', label: 'Create New Task', description: 'Add a new item to your study task planner', href: '/tasks', icon: Plus, category: 'Actions' },
  { id: 'action-marketplace', label: 'Explore Placement Notes', description: 'Browse verified study resources & campus notes', href: '/marketplace', icon: ShoppingBag, category: 'Actions' },
]

export function CommandMenu({ open, onClose }: CommandMenuProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Live queries for resources and marketplace items
  const { data: resourcesData } = useResourcesListQuery({
    search: query.trim() || undefined,
    size: 5,
  })

  const { data: storeData } = useStoreResourcesQuery({
    search: query.trim() || undefined,
    size: 5,
  })

  const { data: myPurchases = [] } = useMyPurchasesQuery()

  // Reset input and selection index when dialog opens
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Filter static pages & actions based on query
  const filteredPages = useMemo(() => {
    if (!query.trim()) return STATIC_PAGES
    const q = query.toLowerCase()
    return STATIC_PAGES.filter(
      (item) => item.label.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
    )
  }, [query])

  const filteredActions = useMemo(() => {
    if (!query.trim()) return QUICK_ACTIONS
    const q = query.toLowerCase()
    return QUICK_ACTIONS.filter(
      (item) => item.label.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
    )
  }, [query])

  // Map API resources to NavItems
  const resourceItems: NavItem[] = useMemo(() => {
    const list = resourcesData?.content || []
    return list.map((res) => ({
      id: `resource-${res.id}`,
      label: res.title,
      description: res.description || `${res.category} study material`,
      href: `/resources/study/${res.id}`,
      icon: FileText,
      category: 'Resources' as const,
      badge: res.category,
    }))
  }, [resourcesData])

  // Map API marketplace items to NavItems
  const storeItems: NavItem[] = useMemo(() => {
    const list = storeData?.content || []
    const purchasedIds = new Set(myPurchases.map((p) => p.id))
    return list.map((item: any) => {
      const isPurchased = purchasedIds.has(item.id)
      return {
        id: `store-${item.id}`,
        label: item.title,
        description: item.description || `Marketplace resource by ${item.authorName || 'Campus'}`,
        href: isPurchased
          ? `/resources/study/${item.id}?file=${encodeURIComponent(item.fileName || 'note.pdf')}&url=${encodeURIComponent(item.fileUrl || '')}`
          : '/marketplace',
        icon: ShoppingBag,
        category: 'Marketplace' as const,
        badge: isPurchased ? 'Unlocked' : item.isFree ? 'Free' : `₹${item.price}`,
      }
    })
  }, [storeData, myPurchases])

  // Flatten all matching items for index-based keyboard navigation
  const flatItems = useMemo(() => {
    return [...filteredPages, ...filteredActions, ...resourceItems, ...storeItems]
  }, [filteredPages, filteredActions, resourceItems, storeItems])

  // Keep selected index within bounds when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Execute selected item action/navigation
  const executeItem = (item: NavItem) => {
    if (item.action) {
      item.action()
    } else if (item.href) {
      navigate(item.href)
    }
    onClose()
  }

  // Keyboard navigation listener (ArrowUp, ArrowDown, Enter, Escape)
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (flatItems.length > 0 ? (prev + 1) % flatItems.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (flatItems.length > 0 ? (prev - 1 + flatItems.length) % flatItems.length : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (flatItems[selectedIndex]) {
          executeItem(flatItems[selectedIndex])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, flatItems, selectedIndex, onClose])

  let currentIndexTracker = 0

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cmd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div
            className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
            role="presentation"
          >
            <motion.div
              key="cmd-dialog"
              variants={scaleVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-label="Command menu"
              className={cn(
                'w-full max-w-xl',
                'overflow-hidden rounded-xl border border-border/80 bg-popover/95',
                'shadow-2xl backdrop-blur-xl'
              )}
            >
              {/* Search Header */}
              <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5 bg-muted/20">
                <Search className="size-4 shrink-0 text-primary animate-pulse" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search pages, study notes, AI commands, marketplace..."
                  className={cn(
                    'flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/70',
                    'focus:outline-none'
                  )}
                  aria-label="Global search input"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="text-xs text-muted-foreground hover:text-foreground mr-1"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={onClose}
                  aria-label="Close search modal"
                  className={cn(
                    'flex items-center gap-1 rounded border border-border/60 px-1.5 py-0.5',
                    'text-[10px] font-medium text-muted-foreground',
                    'hover:bg-accent hover:text-foreground transition-colors'
                  )}
                >
                  <X className="size-3" aria-hidden="true" />
                  <span>Esc</span>
                </button>
              </div>

              {/* Results List */}
              <div ref={listRef} className="max-h-[360px] overflow-y-auto p-2 space-y-3">
                {flatItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Search className="size-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-semibold text-foreground">No matching results found</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Try searching for page names, study subjects, notes, or AI actions.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Render Category: Pages */}
                    {filteredPages.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center justify-between">
                          <span>Pages & Navigation</span>
                          <span className="text-[9px] font-normal">{filteredPages.length}</span>
                        </p>
                        <div className="space-y-0.5 mt-1">
                          {filteredPages.map((item) => {
                            const index = currentIndexTracker++
                            const isSelected = selectedIndex === index
                            const Icon = item.icon
                            return (
                              <button
                                key={item.id}
                                onClick={() => executeItem(item)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={cn(
                                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all',
                                  isSelected
                                    ? 'bg-primary/10 text-primary border border-primary/20 font-medium'
                                    : 'text-foreground hover:bg-accent/60'
                                )}
                              >
                                <span className={cn(
                                  'flex size-7 items-center justify-center rounded-md border shrink-0',
                                  isSelected ? 'border-primary/40 bg-primary/20 text-primary' : 'border-border bg-muted/50 text-muted-foreground'
                                )}>
                                  <Icon className="size-3.5" />
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs truncate">{item.label}</span>
                                    {item.badge && (
                                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                                        {item.badge}
                                      </Badge>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.description}</p>
                                  )}
                                </div>
                                <ArrowRight className={cn("size-3.5 shrink-0 transition-opacity", isSelected ? "opacity-100 text-primary" : "opacity-0")} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Render Category: Quick Actions */}
                    {filteredActions.length > 0 && (
                      <div className="pt-1">
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center justify-between">
                          <span>Quick Actions & AI</span>
                          <span className="text-[9px] font-normal">{filteredActions.length}</span>
                        </p>
                        <div className="space-y-0.5 mt-1">
                          {filteredActions.map((item) => {
                            const index = currentIndexTracker++
                            const isSelected = selectedIndex === index
                            const Icon = item.icon
                            return (
                              <button
                                key={item.id}
                                onClick={() => executeItem(item)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={cn(
                                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all',
                                  isSelected
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium'
                                    : 'text-foreground hover:bg-accent/60'
                                )}
                              >
                                <span className={cn(
                                  'flex size-7 items-center justify-center rounded-md border shrink-0',
                                  isSelected ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400' : 'border-border bg-muted/50 text-muted-foreground'
                                )}>
                                  <Icon className="size-3.5" />
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs truncate">{item.label}</span>
                                    {item.badge && (
                                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                                        {item.badge}
                                      </Badge>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.description}</p>
                                  )}
                                </div>
                                <ArrowRight className={cn("size-3.5 shrink-0 transition-opacity", isSelected ? "opacity-100 text-emerald-400" : "opacity-0")} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Render Category: My Resources */}
                    {resourceItems.length > 0 && (
                      <div className="pt-1">
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center justify-between">
                          <span>My Study Resources</span>
                          <span className="text-[9px] font-normal">{resourceItems.length}</span>
                        </p>
                        <div className="space-y-0.5 mt-1">
                          {resourceItems.map((item) => {
                            const index = currentIndexTracker++
                            const isSelected = selectedIndex === index
                            const Icon = item.icon
                            return (
                              <button
                                key={item.id}
                                onClick={() => executeItem(item)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={cn(
                                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all',
                                  isSelected
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium'
                                    : 'text-foreground hover:bg-accent/60'
                                )}
                              >
                                <span className={cn(
                                  'flex size-7 items-center justify-center rounded-md border shrink-0',
                                  isSelected ? 'border-blue-500/40 bg-blue-500/20 text-blue-400' : 'border-border bg-muted/50 text-muted-foreground'
                                )}>
                                  <Icon className="size-3.5" />
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs truncate">{item.label}</span>
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-blue-500/30 text-blue-400 bg-blue-500/10">
                                      {item.badge}
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.description}</p>
                                </div>
                                <ArrowRight className={cn("size-3.5 shrink-0 transition-opacity", isSelected ? "opacity-100 text-blue-400" : "opacity-0")} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Render Category: Marketplace */}
                    {storeItems.length > 0 && (
                      <div className="pt-1">
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center justify-between">
                          <span>Marketplace & Placement Notes</span>
                          <span className="text-[9px] font-normal">{storeItems.length}</span>
                        </p>
                        <div className="space-y-0.5 mt-1">
                          {storeItems.map((item) => {
                            const index = currentIndexTracker++
                            const isSelected = selectedIndex === index
                            const Icon = item.icon
                            return (
                              <button
                                key={item.id}
                                onClick={() => executeItem(item)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={cn(
                                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all',
                                  isSelected
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium'
                                    : 'text-foreground hover:bg-accent/60'
                                )}
                              >
                                <span className={cn(
                                  'flex size-7 items-center justify-center rounded-md border shrink-0',
                                  isSelected ? 'border-amber-500/40 bg-amber-500/20 text-amber-400' : 'border-border bg-muted/50 text-muted-foreground'
                                )}>
                                  <Icon className="size-3.5" />
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs truncate">{item.label}</span>
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-400 bg-amber-500/10">
                                      {item.badge}
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.description}</p>
                                </div>
                                <ArrowRight className={cn("size-3.5 shrink-0 transition-opacity", isSelected ? "opacity-100 text-amber-400" : "opacity-0")} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer Keyboard Hints */}
              <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 bg-muted/20 text-xs">
                <div className="flex items-center gap-4 text-muted-foreground text-[10px]">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[9px]">↵</kbd>
                    to select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[9px]">↑↓</kbd>
                    to navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[9px]">Esc</kbd>
                    to close
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground/70 font-medium">
                  {flatItems.length} {flatItems.length === 1 ? 'item' : 'items'} available
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
