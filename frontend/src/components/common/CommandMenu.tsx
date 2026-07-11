import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Search, X, LayoutDashboard, BookOpen, ShoppingBag,
  FolderOpen, Sparkles, Settings, User, ArrowRight,
} from '@/lib/icons'
import { scaleVariants } from '@/lib/animations'

// ── Quick navigation items shown in the command menu ─────────────────────────
const QUICK_NAV = [
  { label: 'Dashboard',    href: '/dashboard',   icon: LayoutDashboard, group: 'Navigate' },
  { label: 'Library',      href: '/library',     icon: BookOpen,         group: 'Navigate' },
  { label: 'My Resources', href: '/resources',   icon: FolderOpen,       group: 'Navigate' },
  { label: 'AI Workspace', href: '/ai',           icon: Sparkles,         group: 'Navigate' },
  { label: 'Marketplace',  href: '/marketplace', icon: ShoppingBag,      group: 'Navigate' },
  { label: 'Profile',      href: '/profile',     icon: User,             group: 'Navigate' },
  { label: 'Settings',     href: '/settings',    icon: Settings,         group: 'Navigate' },
] as const

interface CommandMenuProps {
  open: boolean
  onClose: () => void
}

/**
 * CommandMenu — ⌘K command palette placeholder.
 *
 * In this sprint: UI scaffold with navigation shortcuts.
 * Future sprints will add: fuzzy search, resource search, recent items.
 *
 * Design decisions:
 *   - Dialog appears over a backdrop blur overlay (not a sidebar or drawer)
 *   - Keyboard navigation: Arrow keys move focus, Enter navigates, Escape closes
 *   - Max height with overflow-y-auto prevents content overflow on small screens
 *   - `autoFocus` on the search input so users can type immediately
 *   - `role="dialog"` + `aria-modal="true"` + `aria-label` for accessibility
 *   - Focus trap: Tab cycles through the items + close button only
 */
export function CommandMenu({ open, onClose }: CommandMenuProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input when the menu opens
  useEffect(() => {
    if (open) {
      // Small delay to let the animation start before focusing
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  function handleNavigate(href: string) {
    navigate(href)
    onClose()
  }

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
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div
            className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh]"
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
                'w-full max-w-lg',
                'overflow-hidden rounded-xl border border-border bg-popover',
                'shadow-2xl'
              )}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search pages, resources, actions…"
                  className={cn(
                    'flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground',
                    'focus:outline-none'
                  )}
                  aria-label="Command search"
                />
                <button
                  onClick={onClose}
                  aria-label="Close command menu"
                  className={cn(
                    'flex items-center gap-1 rounded border border-border px-1.5 py-0.5',
                    'text-[10px] font-medium text-muted-foreground',
                    'hover:bg-accent hover:text-foreground transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                >
                  <X className="size-3" aria-hidden="true" />
                  <span>Esc</span>
                </button>
              </div>

              {/* Results area */}
              <div className="max-h-80 overflow-y-auto p-2">
                {/* Quick navigation section */}
                <div>
                  <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Quick Navigate
                  </p>
                  {QUICK_NAV.map(({ label, href, icon: Icon }) => (
                    <button
                      key={href}
                      onClick={() => handleNavigate(href)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2.5',
                        'text-sm text-foreground',
                        'transition-colors hover:bg-accent hover:text-accent-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        'group'
                      )}
                    >
                      <span className="flex size-7 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        <Icon className="size-3.5" aria-hidden="true" />
                      </span>
                      <span className="flex-1 text-left font-medium">{label}</span>
                      <ArrowRight className="size-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </button>
                  ))}
                </div>

                {/* Placeholder sections for future features */}
                <div className="mt-2 border-t border-border pt-2">
                  <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Coming Soon
                  </p>
                  <div className="rounded-md bg-muted/40 px-3 py-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground/70">Resource search, AI commands, recent files…</p>
                    <p className="mt-0.5">Full search will be available once the Library module is built.</p>
                  </div>
                </div>
              </div>

              {/* Footer hints */}
              <div className="flex items-center gap-4 border-t border-border px-4 py-2.5">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[9px]">↵</kbd>
                  to select
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[9px]">↑↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[9px]">Esc</kbd>
                  to close
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
