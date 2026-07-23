import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { TaskCard } from './TaskCard'
import { TaskSkeleton } from './TaskSkeleton'
import type { Task } from '@/types/productivity'

interface TaskListProps {
  tasks: Task[]
  isLoading: boolean
  onToggleComplete: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onAddNew: () => void
}

export function TaskList({ tasks, isLoading, onToggleComplete, onEdit, onDelete, onAddNew }: TaskListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'COMPLETED'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          t.description?.toLowerCase().includes(search.toLowerCase()) ||
                          t.category.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  return (
    <div className="space-y-4">
      {/* Actions & Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-input rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 w-full sm:w-auto items-center justify-end">
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-background border border-input rounded-md px-2 py-1.5 text-xs focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e: any) => setPriorityFilter(e.target.value)}
            className="bg-background border border-input rounded-md px-2 py-1.5 text-xs focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-3.5" />
            Add Task
          </button>
        </div>
      </div>

      {/* Task List Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => <TaskSkeleton key={idx} />)
        ) : filteredTasks.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed rounded-lg border-border/60 text-center">
            <p className="text-sm font-medium text-muted-foreground">No tasks found</p>
            <button
              onClick={onAddNew}
              className="text-xs text-primary hover:underline mt-1 font-semibold"
            >
              Create your first task
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}
