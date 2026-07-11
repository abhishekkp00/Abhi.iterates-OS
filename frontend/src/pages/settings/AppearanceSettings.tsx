import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme.store'
import { cn } from '@/lib/utils'
import { Sun, Moon, Monitor } from '@/lib/icons'
import { staggerChildVariants } from '@/lib/animations'
import type { Theme } from '@/types'

const THEME_OPTIONS: { value: Theme; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'Clean white interface — best for bright environments.',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes — ideal for long study sessions.',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Automatically matches your OS preference.',
    icon: Monitor,
  },
]

/**
 * AppearanceSettings — theme selector and future density/font controls.
 *
 * The theme toggle is FULLY FUNCTIONAL (uses useThemeStore which persists to localStorage).
 * This is the most interactive settings page in this sprint — demonstrates the
 * theme system works end-to-end without any backend dependency.
 */
export default function AppearanceSettings() {
  const { theme, setTheme } = useThemeStore()

  return (
    <motion.div variants={staggerChildVariants} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Customize how AbhiIterates.OS looks and feels.
        </p>
      </div>

      {/* Theme selector — fully functional */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-foreground">Theme</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select your preferred color scheme. Your choice is saved automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {THEME_OPTIONS.map(({ value, label, description, icon: Icon }) => {
            const isSelected = theme === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                aria-pressed={isSelected}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-lg border p-4 text-left',
                  'transition-all duration-150',
                  'hover:border-primary/50 hover:bg-accent',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-background'
                )}
              >
                <div
                  className={cn(
                    'flex size-8 items-center justify-center rounded-md',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <p className={cn('text-sm font-medium', isSelected ? 'text-primary' : 'text-foreground')}>
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">{description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Future: Density */}
      <div className="rounded-lg border border-border bg-card p-5 opacity-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Interface density</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compact or comfortable spacing between elements.
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Coming soon
          </span>
        </div>
      </div>

      {/* Future: Font size */}
      <div className="rounded-lg border border-border bg-card p-5 opacity-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Font size</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adjust the base font size for reading comfort.
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Coming soon
          </span>
        </div>
      </div>
    </motion.div>
  )
}
