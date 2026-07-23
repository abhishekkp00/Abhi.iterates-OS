import { Badge } from '@/components/ui/badge'
import type { TaskPriority, TaskStatus } from '@/types/productivity'

interface PriorityBadgeProps {
  priority: TaskPriority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const styles = {
    HIGH: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20',
    LOW: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20',
  }

  return (
    <Badge variant="outline" className={styles[priority]}>
      {priority}
    </Badge>
  )
}

interface StatusBadgeProps {
  status: TaskStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    TODO: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    IN_PROGRESS: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 line-through',
  }

  const labels = {
    TODO: 'Todo',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
  }

  return (
    <Badge variant="outline" className={styles[status]}>
      {labels[status]}
    </Badge>
  )
}
