import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTasks } from '@/features/productivity/hooks/useTasks'
import { Button } from '@/components/ui/button'
import { Calendar, AlertCircle, ArrowRight, Loader2, Check } from '@/lib/icons'

export function PlannerPreview() {
  const navigate = useNavigate()
  const { tasks, isLoadingTasks, updateTask } = useTasks()

  const activeTasks = tasks
    .filter((task: any) => task.status !== 'COMPLETED')
    .sort((a: any, b: any) => {
      const priorityWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 }
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0)
    })
    .slice(0, 4)

  const handleToggleComplete = async (task: any) => {
    try {
      await updateTask({
        id: task.id,
        data: {
          title: task.title,
          description: task.description || '',
          status: 'COMPLETED',
          priority: task.priority,
          category: task.category || 'General',
          dueDate: task.dueDate || null,
        },
      })
    } catch (_e) {
      // Handled by mutation hook toast
    }
  }

  const priorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'badge-rose'
      case 'MEDIUM':
        return 'badge-amber'
      default:
        return 'badge-indigo'
    }
  }

  return (
    <div className="clean-card flex flex-col justify-between min-h-[300px]">
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="size-4.5 text-indigo-400" />
            <h2 className="font-display text-base font-bold text-white tracking-tight">Today's Agenda</h2>
          </div>
          <span className="badge-indigo">
            {tasks.filter((t: any) => t.status !== 'COMPLETED').length} Pending
          </span>
        </div>

        <div>
          {isLoadingTasks ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2 font-medium text-xs">
              <Loader2 className="size-5 animate-spin text-indigo-400" />
              <span>Retrieving planner...</span>
            </div>
          ) : activeTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3 border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
              <div className="p-2.5 rounded-full bg-slate-800 border border-slate-700">
                <AlertCircle className="size-5 text-indigo-400" />
              </div>
              <div className="space-y-1 px-4 text-xs">
                <p className="font-bold text-white">All caught up!</p>
                <p className="text-slate-400 font-medium max-w-[240px]">
                  No pending agenda items. Click below to add tasks or check your planner.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTasks.map((task: any) => {
                const isCompleted = task.status === 'COMPLETED'
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 hover:border-indigo-500/30 bg-slate-900/50 hover:bg-slate-900 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleComplete(task)}
                        aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                        className="shrink-0 flex items-center justify-center size-5 rounded-md border border-slate-700 bg-slate-950 hover:border-indigo-500 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400"
                      >
                        {isCompleted && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Check className="size-3 text-indigo-400" />
                          </motion.div>
                        )}
                      </button>

                      <div className="space-y-0.5 truncate">
                        <span
                          onClick={() => handleToggleComplete(task)}
                          className="text-xs font-semibold text-slate-200 tracking-tight cursor-pointer group-hover:text-indigo-400 transition-colors block truncate"
                        >
                          {task.title}
                        </span>
                        {task.dueDate && (
                          <p className="text-[10px] text-slate-500 font-medium">
                            Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className={priorityBadgeStyle(task.priority)}>
                      {task.priority}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 mt-4 border-t border-slate-800">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs font-bold text-slate-400 hover:text-indigo-400 justify-between group hover:bg-transparent"
          onClick={() => navigate('/planner')}
        >
          <span>Open Planner Workspace</span>
          <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  )
}
