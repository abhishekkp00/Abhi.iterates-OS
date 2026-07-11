import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Shield, LogOut } from '@/lib/icons'
import { staggerChildVariants } from '@/lib/animations'
import { useAuth } from '@/features/auth/hooks/useAuth'

function SecurityCard({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/**
 * SecuritySettings — password management and session controls.
 * Password change requires a backend endpoint (Day 9+).
 * Sessions list and revocation require refresh token tracking (foundation exists).
 */
export default function SecuritySettings() {
  const { logout } = useAuth()

  return (
    <motion.div variants={staggerChildVariants} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Security</h2>
        <p className="text-sm text-muted-foreground">
          Manage your password and active sessions.
        </p>
      </div>

      {/* Password section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Password</h3>

        <SecurityCard
          title="Change password"
          description="Update your account password. You will be signed out of all devices."
          action={
            <Button size="sm" variant="outline" disabled className="opacity-50">
              Change password
            </Button>
          }
        />
        <p className="text-xs text-muted-foreground px-1">
          Password management is coming in the next sprint.
        </p>
      </div>

      {/* Sessions section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Active sessions</h3>

        <SecurityCard
          title="Current session"
          description="This browser — signed in now. Refresh token rotation is active."
          action={
            <div className="flex size-2 rounded-full bg-success animate-pulse" aria-label="Active session" />
          }
        />

        <SecurityCard
          title="Sign out of all sessions"
          description="Revokes all refresh tokens and signs you out everywhere."
          action={
            <Button
              size="sm"
              variant="destructive"
              onClick={() => logout()}
              className="gap-1.5"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              Sign out all
            </Button>
          }
        />
      </div>

      {/* Security info */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
        <Shield className="size-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-xs font-medium text-foreground">Refresh Token Rotation active</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every API call uses a short-lived access token (15 min). Refresh tokens
            rotate on every use — reuse of an old token triggers automatic session termination.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
