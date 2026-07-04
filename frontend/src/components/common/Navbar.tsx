import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/theme.store'
import { useAuthStore } from '@/store/auth.store'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor, Bell, Search, ChevronDown, LogOut, Settings } from '@/lib/icons'
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

export function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)
  const { logout } = useAuth()

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Guest User'
  const initials = user ? `${user.firstName} ${user.lastName}` : 'Guest'

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4',
        'sticky top-0 z-20'
      )}
    >
      {/* Global search placeholder */}
      <button
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
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="size-4" />
          <span
            className="absolute right-1 top-1 size-1.5 rounded-full bg-primary"
            aria-hidden="true"
          />
        </Button>

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
                <Link to="/settings" onClick={() => setProfileOpen(false)}>
                  <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Settings className="size-3.5 text-muted-foreground" />
                    <span>Settings</span>
                  </button>
                </Link>

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
