import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import type { Task, TaskRequest } from '@/types/productivity'

const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category cannot exceed 50 characters'),
  dueDate: z.string().optional(),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

interface TaskFormProps {
  task?: Task | null
  onSubmit: (data: TaskRequest) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function TaskForm({ task, onSubmit, onCancel, isSubmitting }: TaskFormProps) {
  const initialDueDate = task?.dueDate
    ? new Date(task.dueDate).toISOString().split('T')[0]
    : ''

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'TODO',
      priority: task?.priority || 'MEDIUM',
      category: task?.category || 'STUDY',
      dueDate: initialDueDate,
    },
  })

  const handleFormSubmit = (data: TaskFormValues) => {
    onSubmit({
      title: data.title,
      description: data.description || undefined,
      status: data.status,
      priority: data.priority,
      category: data.category,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
      {/* Title */}
      <div className="space-y-1">
        <label htmlFor="task-title" className="text-xs font-semibold text-muted-foreground uppercase">
          Title <span className="text-rose-400">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          {...register('title')}
          placeholder="e.g. Finish Math Homework"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'task-title-error' : undefined}
          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {errors.title && (
          <p id="task-title-error" className="text-xs text-rose-400 font-medium mt-0.5">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label htmlFor="task-desc" className="text-xs font-semibold text-muted-foreground uppercase">
          Description
        </label>
        <textarea
          id="task-desc"
          rows={3}
          {...register('description')}
          placeholder="Add details about this assignment..."
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'task-desc-error' : undefined}
          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        {errors.description && (
          <p id="task-desc-error" className="text-xs text-rose-400 font-medium mt-0.5">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Priority & Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="task-priority" className="text-xs font-semibold text-muted-foreground uppercase">
            Priority <span className="text-rose-400">*</span>
          </label>
          <select
            id="task-priority"
            {...register('priority')}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          {errors.priority && (
            <p className="text-xs text-rose-400 font-medium mt-0.5">{errors.priority.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="task-status" className="text-xs font-semibold text-muted-foreground uppercase">
            Status <span className="text-rose-400">*</span>
          </label>
          <select
            id="task-status"
            {...register('status')}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          {errors.status && (
            <p className="text-xs text-rose-400 font-medium mt-0.5">{errors.status.message}</p>
          )}
        </div>
      </div>

      {/* Category & Due Date */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="task-category" className="text-xs font-semibold text-muted-foreground uppercase">
            Category <span className="text-rose-400">*</span>
          </label>
          <input
            id="task-category"
            type="text"
            {...register('category')}
            placeholder="e.g. STUDY, PERSONAL, WORK"
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? 'task-category-error' : undefined}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.category && (
            <p id="task-category-error" className="text-xs text-rose-400 font-medium mt-0.5">
              {errors.category.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="task-duedate" className="text-xs font-semibold text-muted-foreground uppercase">
            Due Date
          </label>
          <input
            id="task-duedate"
            type="date"
            {...register('dueDate')}
            onClick={(e) => e.currentTarget.showPicker?.()}
            onFocus={(e) => e.currentTarget.showPicker?.()}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  )
}
