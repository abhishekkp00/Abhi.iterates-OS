import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/theme.store'
import { useAuthStore } from '@/store/auth.store'
import { useSidebarStore } from '@/store/sidebar.store'
import { useNotificationStore } from '@/store/notification.store'
import { NotificationDrawer } from '@/components/common/NotificationDrawer'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor, Bell, Search, ChevronDown, LogOut, Settings, Menu, User, Plus, FilePlus, ShoppingBag, Sparkles, ShieldCheck } from '@/lib/icons'
import type { Theme } from '@/types'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { scaleVariants } from '@/lib/animations'

const THEME_CYCLE: Theme[] = ['light', 'dark', 'system']

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()
  const Icon = THEME_ICONS[theme]

  function cycleTheme() {
    const idx = THEME_CYCLE.indexOf(theme)
    setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]!)
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={cycleTheme}
      aria-label={`Switch theme (current: ${theme})`}
      title={`Current: ${theme} — click to cycle`}
    >
      <Icon className="size-4" />
    </Button>
  )
}

export function Navbar({ onOpenCmd }: { onOpenCmd?: () => void }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)

  const user = useAuthStore((s) => s.user)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const { setMobileOpen } = useSidebarStore()
  const { logout } = useAuth()

  const isAdmin = user?.roles?.some((r) =>
    ['ROLE_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'SUPER_ADMIN'].includes(r)
  )

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setProfileOpen(false)
      }
      if (actionsRef.current && !actionsRef.current.contains(target)) {
        setActionsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Listen for global Cmd+K or Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenCmd?.()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onOpenCmd])

  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Guest User'
  const initials = user ? `${user.firstName} ${user.lastName}` : 'Guest'

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4',
        'sticky top-0 z-20'
      )}
    >
      {/* Mobile hamburger — only visible below md breakpoint */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden shrink-0"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="size-4" aria-hidden="true" />
      </Button>
      {/* Global search placeholder */}
      <button
        onClick={onOpenCmd}
        className={cn(
          'flex flex-1 max-w-sm items-center gap-2 rounded-md border border-input',
          'bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground',
          'transition-colors hover:border-ring/50 hover:bg-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'cursor-text'
        )}
        aria-label="Open global search"
        role="searchbox"
        aria-haspopup="dialog"
      >
        <Search className="size-3.5 shrink-0" />
        <span>Search anything…</span>
        <kbd className="ml-auto rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1.5">
        
        {/* Quick Actions Dropdown */}
        <div className="relative" ref={actionsRef}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setActionsOpen((p) => !p)}
            aria-expanded={actionsOpen}
            aria-haspopup="true"
            aria-label="Quick Actions"
            title="Quick Actions"
          >
            <Plus className="size-4" />
          </Button>

          <AnimatePresence>
            {actionsOpen && (
              <motion.div
                variants={scaleVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute right-0 mt-1.5 w-48 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg z-50 origin-top-right"
              >
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Actions
                </div>
                <Link to="/library" onClick={() => setActionsOpen(false)}>
                  <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors">
                    <FilePlus className="size-3.5 text-muted-foreground" />
                    <span>Upload PDF</span>
                  </button>
                </Link>
                <Link to="/marketplace" onClick={() => setActionsOpen(false)}>
                  <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors">
                    <ShoppingBag className="size-3.5 text-muted-foreground" />
                    <span>Browse Marketplace</span>
                  </button>
                </Link>
                <Link to="/ai" onClick={() => setActionsOpen(false)}>
                  <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Sparkles className="size-3.5 text-muted-foreground" />
                    <span>New AI Chat</span>
                  </button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ThemeToggle />

        {/* Notifications Drawer Toggle */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            aria-haspopup="true"
            aria-label="Notifications"
            className="relative"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground animate-pulse">
                {unreadCount}
              </span>
            )}
          </Button>

          <NotificationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen((p) => !p)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            aria-label="Open profile menu"
            className={cn(
              'flex items-center gap-1.5 rounded-md px-1.5 py-1',
              'transition-colors hover:bg-accent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <Avatar name={initials} size="xs" />
            <ChevronDown className="size-3 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                variants={scaleVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute right-0 mt-1.5 w-56 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg z-50 origin-top-right"
              >
                {/* Header */}
                <div className="px-2 py-1.5 border-b border-border mb-1">
                  <p className="text-xs font-semibold truncate text-foreground">{fullName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>

                {/* Items */}
                <Link to="/profile" onClick={() => setProfileOpen(false)}>
                  <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors">
                    <User className="size-3.5 text-muted-foreground" />
                    <span>View profile</span>
                  </button>
                </Link>

                <Link to="/settings" onClick={() => setProfileOpen(false)}>
                  <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Settings className="size-3.5 text-muted-foreground" />
                    <span>Settings</span>
                  </button>
                </Link>

                {isAdmin && (
                  <Link to="/admin" onClick={() => setProfileOpen(false)}>
                    <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left text-amber-500 hover:bg-amber-500/10 transition-colors font-medium">
                      <ShieldCheck className="size-3.5" />
                      <span>Admin Portal</span>
                      <span className="ml-auto rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-bold text-amber-500 uppercase">
                        Admin
                      </span>
                    </button>
                  </Link>
                )}

                <button
                  onClick={() => {
                    setProfileOpen(false)
                    window.dispatchEvent(new Event('open-onboarding-tour'))
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left text-primary hover:bg-primary/10 transition-colors font-medium"
                >
                  <Sparkles className="size-3.5" />
                  <span>Take Feature Tour</span>
                </button>

                <div className="border-t border-border my-1" />

                {/* Logout */}
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    logout()
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left text-destructive hover:bg-destructive/10 transition-colors font-medium"
                >
                  <LogOut className="size-3.5" />
                  <span>Log out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
