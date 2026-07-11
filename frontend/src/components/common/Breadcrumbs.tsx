import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from '@/lib/icons'
import { ROUTE_LABELS } from '@/constants/app'
import { cn } from '@/lib/utils'

/**
 * Breadcrumbs — auto-generates navigation crumbs from `location.pathname`.
 *
 * Algorithm:
 *   1. Split pathname by "/"
 *   2. Filter empty strings
 *   3. Map each segment to a label using ROUTE_LABELS (falls back to capitalized segment)
 *   4. Build cumulative hrefs: /settings → /settings/profile → ...
 *   5. Render: Home > Settings > Profile  (last item is non-clickable, current page)
 *
 * Examples:
 *   /dashboard          → Home > Dashboard
 *   /settings/profile   → Home > Settings > Profile
 *   /settings/security  → Home > Settings > Security
 *   /library            → Home > Library
 *
 * Design decisions:
 *   - Home icon (not text) for the root — saves horizontal space, universally understood
 *   - Last crumb is non-interactive (aria-current="page") — standard breadcrumb UX
 *   - `<nav aria-label="Breadcrumb">` + `<ol>` for correct landmark semantics
 *   - Truncated with ellipsis on very small screens — never wraps to two lines
 *   - Hidden on /dashboard (home) to avoid redundant "Home > Dashboard" crumb
 */

interface Crumb {
  label: string
  href: string
  isCurrent: boolean
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function usecrumbs(): Crumb[] {
  const { pathname } = useLocation()

  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)

    if (segments.length === 0) return []

    const crumbs: Crumb[] = segments.map((segment, i) => {
      const href = '/' + segments.slice(0, i + 1).join('/')
      const label = ROUTE_LABELS[segment] ?? capitalize(segment.replace(/-/g, ' '))
      return { label, href, isCurrent: i === segments.length - 1 }
    })

    return crumbs
  }, [pathname])
}

interface BreadcrumbsProps {
  className?: string
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const crumbs = usecrumbs()
  const { pathname } = useLocation()

  // Don't render breadcrumbs on the dashboard home — it would just say "Dashboard"
  // which adds noise without providing navigation value.
  if (pathname === '/dashboard' || crumbs.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center', className)}
    >
      <ol
        className="flex items-center gap-1 text-xs text-muted-foreground overflow-hidden"
        aria-label="Breadcrumb navigation"
      >
        {/* Home root */}
        <li className="flex shrink-0 items-center">
          <Link
            to="/dashboard"
            aria-label="Go to Dashboard"
            className={cn(
              'flex items-center rounded p-0.5',
              'transition-colors hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <Home className="size-3.5" aria-hidden="true" />
          </Link>
        </li>

        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1 min-w-0">
            {/* Separator */}
            <ChevronRight className="size-3 shrink-0 text-muted-foreground/50" aria-hidden="true" />

            {crumb.isCurrent ? (
              // Current page — not a link, has aria-current
              <span
                aria-current="page"
                className="truncate font-medium text-foreground"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.href}
                className={cn(
                  'truncate rounded px-0.5',
                  'transition-colors hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
