import { motion } from 'framer-motion'
import { staggerChildVariants } from '@/lib/animations'

interface ToggleRowProps {
  title: string
  description: string
  defaultChecked?: boolean
  disabled?: boolean
}

function ToggleRow({ title, description, defaultChecked = false, disabled = true }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {/* Toggle — visual only, functionality is Day 9+ */}
      <button
        type="button"
        role="switch"
        aria-checked={defaultChecked}
        disabled={disabled}
        className={`
          relative inline-flex h-5 w-9 shrink-0 cursor-not-allowed items-center rounded-full
          border-2 border-transparent transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          disabled:opacity-40
          ${defaultChecked ? 'bg-primary' : 'bg-input'}
        `}
      >
        <span
          className={`
            pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-sm
            ring-0 transition-transform duration-200
            ${defaultChecked ? 'translate-x-4' : 'translate-x-0.5'}
          `}
        />
      </button>
    </div>
  )
}

/**
 * NotificationsSettings — notification preferences UI.
 * All toggles are visual-only (disabled) this sprint.
 * Email notification backend requires a mail service integration (Day 10+).
 */
export default function NotificationsSettings() {
  return (
    <motion.div variants={staggerChildVariants} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Control how and when you receive notifications. Coming in a future sprint.
        </p>
      </div>

      {/* In-app notifications */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-foreground mb-1">In-app</h3>
        <p className="text-xs text-muted-foreground mb-3">Notifications shown inside the app.</p>
        <div className="divide-y divide-border">
          <ToggleRow
            title="New resource shared with me"
            description="When someone shares a resource from their library."
            defaultChecked
          />
          <ToggleRow
            title="Purchase confirmation"
            description="When a Marketplace purchase is successful."
            defaultChecked
          />
          <ToggleRow
            title="AI workspace ready"
            description="When a large document finishes processing for AI chat."
            defaultChecked
          />
          <ToggleRow
            title="Study streak reminder"
            description="Daily reminder to keep your streak active."
          />
        </div>
      </div>

      {/* Email notifications */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-foreground mb-1">Email</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Sent to your registered email address.
        </p>
        <div className="divide-y divide-border">
          <ToggleRow
            title="Weekly study summary"
            description="A digest of your study hours and completed resources."
          />
          <ToggleRow
            title="New marketplace listing from followed creators"
            description="When a creator you follow publishes a new resource."
          />
          <ToggleRow
            title="Security alerts"
            description="Unusual login attempts or session changes."
            defaultChecked
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Notification settings will be saved and enforced once the backend mail service is integrated.
      </p>
    </motion.div>
  )
}
