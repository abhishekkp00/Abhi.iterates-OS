import { motion } from 'framer-motion'
import { Pencil, Trash2, Calendar, Tag } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PriorityBadge } from './Badges'
import type { Task } from '@/types/productivity'

interface TaskCardProps {
  task: Task
  onToggleComplete: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

export function TaskCard({ task, onToggleComplete, onEdit, onDelete }: TaskCardProps) {
  const isCompleted = task.status === 'COMPLETED'
  const formattedDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <Card className="bg-card/50 border-border/40 hover:border-primary/30 transition-all duration-200 shadow-sm">
        <CardContent className="p-4 flex items-start gap-3">
          {/* Custom Checkbox */}
          <button
            onClick={() => onToggleComplete(task)}
            aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
            className="mt-1 shrink-0 flex items-center justify-center size-5 rounded border border-input hover:border-primary bg-background transition-colors focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
          >
            {isCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="size-3 rounded-sm bg-primary"
              />
            )}
          </button>

          {/* Task Info */}
          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm font-semibold truncate leading-none ${
                isCompleted ? 'text-muted-foreground line-through decoration-muted-foreground/50' : 'text-foreground'
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p
                className={`text-xs mt-1 line-clamp-2 ${
                  isCompleted ? 'text-muted-foreground/60' : 'text-muted-foreground'
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Badges and details */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px]">
              <PriorityBadge priority={task.priority} />
              
              <span className="inline-flex items-center gap-1 text-muted-foreground px-2 py-0.5 rounded-full border border-border/40 bg-muted/40">
                <Tag className="size-3" />
                {task.category}
              </span>

              {formattedDate && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Calendar className="size-3" />
                  {formattedDate}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Edit Task"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
              title="Delete Task"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
