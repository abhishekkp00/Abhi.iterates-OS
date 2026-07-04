import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/theme.store'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor, Bell, Search, ChevronDown } from '@/lib/icons'
import type { Theme } from '@/types'

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
          {/* Unread badge — placeholder */}
          <span
            className="absolute right-1 top-1 size-1.5 rounded-full bg-primary"
            aria-hidden="true"
          />
        </Button>

        {/* Profile */}
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
          <Avatar name="Abhishek" size="xs" />
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
      </div>
    </header>
  )
}
