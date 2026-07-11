import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth.store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { staggerChildVariants } from '@/lib/animations'

/**
 * ProfileSettings — displays read-only user profile data.
 *
 * Shows real data from the auth store (name, email, username, roles).
 * Form fields are read-only in this sprint — editing is a Day 9+ feature.
 * The "Save Changes" button is disabled and communicates future availability.
 *
 * Why read-only now?
 *   Profile editing requires a backend PATCH /users/{id} endpoint and
 *   file upload for avatars. That scope belongs to Day 9 (User Profile module).
 *   Showing real data now means zero placeholder lorem ipsum and proves
 *   the auth store integration is wired correctly end-to-end.
 */
export default function ProfileSettings() {
  const user = useAuthStore((s) => s.user)

  const fullName = user ? `${user.firstName} ${user.lastName}` : '—'

  return (
    <motion.div variants={staggerChildVariants} className="space-y-6">
      {/* Section header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Your public profile information. Editing will be available soon.
        </p>
      </div>

      {/* Avatar row */}
      <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
        <Avatar name={fullName} size="lg" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">{fullName}</p>
          <p className="text-xs text-muted-foreground">@{user?.username ?? '—'}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Avatar upload coming in the next sprint.
          </p>
        </div>
      </div>

      {/* Profile form (read-only) */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-medium text-foreground">Personal Information</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            value={user?.firstName ?? ''}
            readOnly
            aria-label="First name (read-only)"
          />
          <Input
            label="Last name"
            value={user?.lastName ?? ''}
            readOnly
            aria-label="Last name (read-only)"
          />
        </div>

        <Input
          label="Username"
          value={user?.username ?? ''}
          readOnly
          aria-label="Username (read-only)"
        />

        <Input
          label="Email address"
          type="email"
          value={user?.email ?? ''}
          readOnly
          aria-label="Email address (read-only)"
        />

        {/* Roles badge row */}
        {user?.roles && user.roles.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Account roles</p>
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
          </div>
        )}

        <div className="border-t border-border pt-4 flex items-center gap-3">
          <Button disabled size="sm" className="opacity-50">
            Save changes
          </Button>
          <p className="text-xs text-muted-foreground">Profile editing is coming soon.</p>
        </div>
      </div>
    </motion.div>
  )
}
