import * as React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from '@/lib/icons'

// ── Skeleton ──────────────────────────────────────────────────
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular'
}

function Skeleton({ className, variant = 'rectangular', ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden bg-muted',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:animate-shimmer',
        'before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        variant === 'text' && 'h-4 rounded-sm w-full',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-md',
        className
      )}
      {...props}
    />
  )
}

// ── Spinner ───────────────────────────────────────────────────
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

function Spinner({ size = 'md', className, label = 'Loading…' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn('inline-flex', className)}>
      <Loader2
        className={cn(
          'animate-spin text-muted-foreground',
          size === 'sm' && 'size-4',
          size === 'md' && 'size-5',
          size === 'lg' && 'size-7'
        )}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}

// ── Loading State (full page) ─────────────────────────────────
function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
      <Spinner size="lg" label={label} />
      <p className="text-sm">{label}</p>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex h-64 flex-col items-center justify-center gap-3 text-center', className)}>
      {icon && (
        <div className="flex size-14 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Error State ───────────────────────────────────────────────
interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex h-64 flex-col items-center justify-center gap-4 text-center', className)}>
      <div className="flex size-14 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive">
        <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-primary hover:underline underline-offset-4"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export { Skeleton, Spinner, LoadingState, EmptyState, ErrorState }
