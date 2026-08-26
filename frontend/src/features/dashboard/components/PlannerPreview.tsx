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
        return 'border-red-500/40 bg-red-500/10 text-red-400'
      case 'MEDIUM':
        return 'border-amber-500/40 bg-amber-500/10 text-amber-400'
      default:
        return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
    }
  }

  return (
    <div className="retro-card flex flex-col justify-between min-h-[300px]">
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 font-mono text-2xs uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-amber-400" />
            <span className="font-display text-sm font-bold text-white tracking-tight lowercase first-letter:uppercase">Today's Agenda</span>
          </div>
          <span className="font-mono text-2xs px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold">
            [{tasks.filter((t: any) => t.status !== 'COMPLETED').length} PENDING]
          </span>
        </div>

        <div>
          {isLoadingTasks ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2 font-mono text-xs">
              <Loader2 className="size-6 animate-spin text-amber-400" />
              <span>[RETRIEVING AGENDA...]</span>
            </div>
          ) : activeTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3 border border-dashed border-slate-800 rounded-lg bg-slate-900/40">
              <div className="p-2.5 rounded border border-slate-700 bg-slate-800">
                <AlertCircle className="size-5 text-amber-400" />
              </div>
              <div className="space-y-1 px-4 font-mono text-xs">
                <p className="font-bold text-white uppercase tracking-wider">[ALL TASKS CLEARED]</p>
                <p className="text-slate-400 text-2xs">
                  No pending agenda items. Create tasks in the planner workspace.
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
                    className="flex items-center justify-between p-3 rounded border border-slate-800 hover:border-amber-500/40 bg-slate-900/60 hover:bg-slate-900 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleComplete(task)}
                        aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                        className="shrink-0 flex items-center justify-center size-5 rounded border border-amber-500/40 bg-slate-950 hover:border-amber-400 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400"
                      >
                        {isCompleted && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Check className="size-3 text-amber-400" />
                          </motion.div>
                        )}
                      </button>

                      <div className="space-y-0.5 truncate">
                        <span
                          onClick={() => handleToggleComplete(task)}
                          className="font-mono text-xs font-semibold text-slate-200 tracking-tight cursor-pointer group-hover:text-amber-400 transition-colors block truncate"
                        >
                          {task.title}
                        </span>
                        {task.dueDate && (
                          <p className="font-mono text-2xs text-slate-500">
                            DUE: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className={`font-mono text-2xs font-bold py-0.5 px-2 rounded border uppercase tracking-wider ${priorityBadgeStyle(task.priority)}`}>
                      [{task.priority}]
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
          className="w-full font-mono text-xs font-bold text-slate-400 hover:text-amber-400 justify-between group hover:bg-transparent"
          onClick={() => navigate('/planner')}
        >
          <span>&gt; OPEN_PLANNER_WORKSPACE</span>
          <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  )
}
