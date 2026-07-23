import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTasks } from '@/features/productivity/hooks/useTasks'
import { TaskList } from '@/features/productivity/components/TaskList'
import { TaskForm } from '@/features/productivity/components/TaskForm'
import type { Task, TaskRequest } from '@/types/productivity'

export default function TasksPage() {
  const { tasks, isLoadingTasks, createTask, updateTask, deleteTask } = useTasks()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const handleToggleComplete = async (task: Task) => {
    const updatedStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED'
    await updateTask({
      id: task.id,
      data: {
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: updatedStatus,
        category: task.category,
        dueDate: task.dueDate,
      },
    })
  }

  const handleCreateSubmit = async (data: TaskRequest) => {
    await createTask(data)
    setIsCreateOpen(false)
  }

  const handleEditSubmit = async (data: TaskRequest) => {
    if (!editingTask) return
    await updateTask({
      id: editingTask.id,
      data,
    })
    setEditingTask(null)
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks Manager</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Organize tasks, projects, assignments, and track your execution.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="size-4" />
          Add Task
        </button>
      </div>

      {/* Task List container */}
      <TaskList
        tasks={tasks}
        isLoading={isLoadingTasks}
        onToggleComplete={handleToggleComplete}
        onEdit={setEditingTask}
        onDelete={deleteTask}
        onAddNew={() => setIsCreateOpen(true)}
      />

      {/* Create Dialog Overlay */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border/80 rounded-lg shadow-xl w-full max-w-md overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                Create New Task
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-4">
              <TaskForm onSubmit={handleCreateSubmit} onCancel={() => setIsCreateOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog Overlay */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border/80 rounded-lg shadow-xl w-full max-w-md overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                Edit Task
              </h3>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-4">
              <TaskForm
                task={editingTask}
                onSubmit={handleEditSubmit}
                onCancel={() => setEditingTask(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
