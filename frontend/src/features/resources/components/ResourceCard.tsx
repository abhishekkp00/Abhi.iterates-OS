import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Resource } from '@/types/resources'
import { FileText, File, Calendar, Paperclip, AlertTriangle } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface ResourceCardProps {
  resource: Resource
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LECTURE: FileText,
  BOOK: File,
  CHEATSHEET: FileText,
  PAST_PAPER: File,
  OTHER: File,
}

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: 'bg-destructive/10 text-destructive border-destructive/20',
  MEDIUM: 'bg-warning/10 text-warning border-warning/20',
  LOW: 'bg-info/10 text-info border-info/20',
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-success/15 text-success border-success/30',
  DRAFT: 'bg-muted text-muted-foreground border-border',
  ARCHIVED: 'bg-warning/10 text-warning border-warning/20',
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const Icon = CATEGORY_ICONS[resource.category] ?? File
  const hasDeadline = !!resource.deadline
  const isOverdue = hasDeadline && new Date(resource.deadline!) < new Date() && resource.status !== 'ARCHIVED'

  return (
    <motion.div
      layout
      className={cn(
        'group flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200',
        'hover:-translate-y-1 hover:border-primary/40 hover:shadow-md'
      )}
    >
      <div className="space-y-3">
        {/* Category Icon & Badges */}
        <div className="flex items-start justify-between">
          <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
            <Icon className="size-4" />
          </div>

          <div className="flex gap-1.5">
            {/* Status badge */}
            <span
              className={cn(
                'rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                STATUS_STYLES[resource.status]
              )}
            >
              {resource.status}
            </span>

            {/* Priority badge */}
            <span
              className={cn(
                'rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                PRIORITY_STYLES[resource.priority]
              )}
            >
              {resource.priority}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <Link
            to={`/resources/${resource.id}`}
            className="block text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {resource.title}
          </Link>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed h-8">
            {resource.description ?? 'No description provided.'}
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 border-t border-border pt-3.5 flex items-center justify-between text-[11px] text-muted-foreground">
        {/* Attachments counter */}
        <div className="flex items-center gap-1 font-medium">
          <Paperclip className="size-3.5" />
          <span>
            {resource.attachments.length} {resource.attachments.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {/* Deadline details */}
        {hasDeadline ? (
          <div
            className={cn(
              'flex items-center gap-1 font-medium',
              isOverdue ? 'text-destructive' : 'text-muted-foreground'
            )}
            title={isOverdue ? 'Deadline is overdue!' : 'Target completion deadline'}
          >
            {isOverdue ? <AlertTriangle className="size-3.5" /> : <Calendar className="size-3.5" />}
            <span>{new Date(resource.deadline!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        ) : (
          <span className="text-[10px] italic text-muted-foreground/60">No deadline</span>
        )}
      </div>
    </motion.div>
  )
}
