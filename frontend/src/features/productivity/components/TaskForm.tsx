import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Task, TaskRequest, TaskPriority, TaskStatus } from '@/types/productivity'

interface TaskFormProps {
  task?: Task | null
  onSubmit: (data: TaskRequest) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function TaskForm({ task, onSubmit, onCancel, isSubmitting }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'TODO')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'MEDIUM')
  const [category, setCategory] = useState(task?.category || 'STUDY')
  const [dueDate, setDueDate] = useState(() => {
    if (!task?.dueDate) return ''
    // format as YYYY-MM-DD for native input
    return new Date(task.dueDate).toISOString().split('T')[0]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onSubmit({
      title,
      description: description || undefined,
      status,
      priority,
      category,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="task-title" className="text-xs font-semibold text-muted-foreground uppercase">
          Title
        </label>
        <input
          id="task-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Finish Math Homework"
          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="task-desc" className="text-xs font-semibold text-muted-foreground uppercase">
          Description
        </label>
        <textarea
          id="task-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details about this assignment..."
          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="task-priority" className="text-xs font-semibold text-muted-foreground uppercase">
            Priority
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="task-status" className="text-xs font-semibold text-muted-foreground uppercase">
            Status
          </label>
          <select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="task-category" className="text-xs font-semibold text-muted-foreground uppercase">
            Category
          </label>
          <input
            id="task-category"
            type="text"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. STUDY, PERSONAL, WORK"
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="task-duedate" className="text-xs font-semibold text-muted-foreground uppercase">
            Due Date
          </label>
          <input
            id="task-duedate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            onClick={(e) => e.currentTarget.showPicker?.()}
            onFocus={(e) => e.currentTarget.showPicker?.()}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer [color-scheme:dark]"
          />
        </div>
      </div>

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
