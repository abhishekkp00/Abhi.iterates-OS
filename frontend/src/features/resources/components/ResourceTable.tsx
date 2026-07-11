import { Link } from 'react-router-dom'
import type { Resource } from '@/types/resources'
import { FileText, File, Eye, Pencil, Trash2, Calendar, Paperclip } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface ResourceTableProps {
  resources: Resource[]
  onDeleteClick: (id: string) => void
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

export function ResourceTable({ resources, onDeleteClick }: ResourceTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full border-collapse text-left text-sm" aria-label="Resources table">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="px-4 py-3">Resource</th>
            <th scope="col" className="hidden sm:table-cell px-4 py-3">Category</th>
            <th scope="col" className="hidden md:table-cell px-4 py-3">Priority</th>
            <th scope="col" className="hidden md:table-cell px-4 py-3">Status</th>
            <th scope="col" className="hidden lg:table-cell px-4 py-3">Deadline</th>
            <th scope="col" className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {resources.map((res) => {
            const Icon = CATEGORY_ICONS[res.category] ?? File
            const hasDeadline = !!res.deadline

            return (
              <tr
                key={res.id}
                className="transition-colors hover:bg-muted/30 group"
              >
                {/* Title & Attachment details */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <Link
                      to={`/resources/${res.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {res.title}
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Paperclip className="size-3" />
                        {res.attachments.length} {res.attachments.length === 1 ? 'file' : 'files'}
                      </span>
                      {res.description && (
                        <span className="hidden sm:inline truncate max-w-[200px] border-l border-border pl-2">
                          {res.description}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Category column */}
                <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Icon className="size-3.5 text-muted-foreground" />
                    <span>{res.category.replace('_', ' ')}</span>
                  </div>
                </td>

                {/* Priority Column */}
                <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                  <span
                    className={cn(
                      'inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                      PRIORITY_STYLES[res.priority]
                    )}
                  >
                    {res.priority}
                  </span>
                </td>

                {/* Status Column */}
                <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                  <span
                    className={cn(
                      'inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                      STATUS_STYLES[res.status]
                    )}
                  >
                    {res.status}
                  </span>
                </td>

                {/* Deadline Column */}
                <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                  {hasDeadline ? (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      <span>{new Date(res.deadline!).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <span className="italic text-muted-foreground/60">No deadline</span>
                  )}
                </td>

                {/* Action Buttons */}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      to={`/resources/${res.id}`}
                      title="View Details"
                      aria-label={`View details for ${res.title}`}
                    >
                      <button className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                        <Eye className="size-4" />
                      </button>
                    </Link>
                    <Link
                      to={`/resources/${res.id}/edit`}
                      title="Edit Resource"
                      aria-label={`Edit ${res.title}`}
                    >
                      <button className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                        <Pencil className="size-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() => onDeleteClick(res.id)}
                      title="Delete Resource"
                      aria-label={`Delete ${res.title}`}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
