import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Settings, GraduationCap, Calendar, Mail } from '@/lib/icons'
import { staggerParentVariants, staggerChildVariants } from '@/lib/animations'

/**
 * ProfilePage (/profile) — the user's public profile card.
 *
 * Distinct from /settings/profile (which handles editing account data).
 * This page is what others would see if profiles were public in a future sprint.
 *
 * Currently shows:
 *   - Avatar with initials
 *   - Display name, username, email, roles
 *   - Empty stat cards (study hours, resources, streak) — placeholders for Day 9+
 *   - Link to settings for editing
 */
export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)

  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Guest User'

  // Stat card data — all zero until study tracking is built (Day 9+)
  const STATS = [
    { label: 'Study hours', value: '—', sublabel: 'this week' },
    { label: 'Resources', value: '—', sublabel: 'in library' },
    { label: 'Day streak', value: '—', sublabel: 'keep going!' },
  ]

  return (
    <div className="page-container max-w-3xl">
      <motion.div
        variants={staggerParentVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Profile card */}
        <motion.div
          variants={staggerChildVariants}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

          {/* Content below banner */}
          <div className="px-6 pb-6">
            {/* Avatar — overlaps banner */}
            <div className="-mt-10 mb-4 flex items-end justify-between">
              <Avatar
                name={fullName}
                size="xl"
                className="ring-4 ring-card"
              />
              <Link to="/settings/profile">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Settings className="size-3.5" aria-hidden="true" />
                  Edit profile
                </Button>
              </Link>
            </div>

            {/* Name & meta */}
            <div className="space-y-3">
              <div>
                <h1 className="text-xl font-bold text-foreground">{fullName}</h1>
                <p className="text-sm text-muted-foreground">@{user?.username ?? '—'}</p>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {user?.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3.5" aria-hidden="true" />
                    {user.email}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="size-3.5" aria-hidden="true" />
                  Student
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" aria-hidden="true" />
                  Joined recently
                </span>
              </div>

              {/* Role badges */}
              {user?.roles && user.roles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
                    >
                      {role.replace('ROLE_', '')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={staggerChildVariants}
          className="grid grid-cols-3 gap-4"
        >
          {STATS.map(({ label, value, sublabel }) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-card p-4 text-center"
            >
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
              <p className="text-[11px] text-muted-foreground">{sublabel}</p>
            </div>
          ))}
        </motion.div>

        {/* Activity placeholder */}
        <motion.div
          variants={staggerChildVariants}
          className="rounded-lg border border-border bg-card p-5"
        >
          <h2 className="text-sm font-semibold text-foreground mb-1">Recent activity</h2>
          <p className="text-xs text-muted-foreground">
            Your study activity will appear here once you start using the Library and AI Workspace.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Link to="/library">
              <Button size="sm" variant="outline">Browse Library</Button>
            </Link>
            <Link to="/ai">
              <Button size="sm" variant="outline">Open AI Workspace</Button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
