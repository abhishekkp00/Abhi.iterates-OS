import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { User, Shield, Bell, Palette } from '@/lib/icons'
import { staggerParentVariants } from '@/lib/animations'

// ── Settings navigation config ───────────────────────────────────────────────
// Centralized here so adding a new settings section is a one-line change.
const SETTINGS_NAV = [
  {
    href: '/settings/profile',
    label: 'Profile',
    description: 'Name, avatar, bio',
    icon: User,
  },
  {
    href: '/settings/security',
    label: 'Security',
    description: 'Password, sessions',
    icon: Shield,
  },
  {
    href: '/settings/notifications',
    label: 'Notifications',
    description: 'Alerts & emails',
    icon: Bell,
  },
  {
    href: '/settings/appearance',
    label: 'Appearance',
    description: 'Theme, density',
    icon: Palette,
  },
] as const

/**
 * SettingsLayout — two-panel shell for all /settings/* routes.
 *
 * Layout:
 *   - Left panel: vertical nav list (desktop) / horizontal scroll tabs (mobile)
 *   - Right panel: <Outlet /> renders the active settings page
 *
 * Design decisions:
 *   - `sticky top-0` on the left nav keeps categories visible while scrolling long forms.
 *   - On mobile the nav scrolls horizontally (overflow-x-auto + flex-row) — avoids
 *     a separate hamburger and keeps the full nav accessible with one swipe.
 *   - `min-w-0` on the right panel prevents long form labels from overflowing.
 *   - `max-w-5xl` constrains the settings area to a comfortable reading width.
 */
export default function SettingsLayout() {
  return (
    <div className="page-container max-w-5xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, security, and preferences.
        </p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:gap-10">
        {/* ── Left: settings navigation ──────────────────────────────────── */}
        <nav
          className="shrink-0 md:w-52"
          aria-label="Settings categories"
        >
          {/* Mobile: horizontal scroll row */}
          {/* Desktop: vertical stack */}
          <ul className="flex flex-row gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-x-visible md:pb-0">
            {SETTINGS_NAV.map(({ href, label, icon: Icon }) => (
              <li key={href} className="shrink-0 md:shrink">
                <NavLink
                  to={href}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-md px-3 py-2',
                      'text-sm font-medium whitespace-nowrap',
                      'transition-colors duration-100',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground'
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Right: active settings page ────────────────────────────────── */}
        <motion.div
          className="min-w-0 flex-1"
          variants={staggerParentVariants}
          initial="initial"
          animate="animate"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  )
}
