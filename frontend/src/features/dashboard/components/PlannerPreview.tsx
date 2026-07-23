import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTasks } from '@/features/productivity/hooks/useTasks'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertCircle, ArrowRight, Loader2 } from '@/lib/icons'

export function PlannerPreview() {
  const navigate = useNavigate()
  const { tasks, isLoadingTasks, updateTask } = useTasks()

  // Filter tasks to show top 4 active tasks (not completed), sorted by priority: HIGH -> MEDIUM -> LOW
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

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    }
  }

  return (
    <Card className="border border-border/60 bg-card/45 backdrop-blur-sm flex flex-col justify-between min-h-[300px]">
      <div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="flex items-center gap-2">
            <Calendar className="size-4.5 text-primary" />
            <CardTitle className="text-base font-bold tracking-tight">Today's Agenda</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase">
            {tasks.filter((t: any) => t.status !== 'COMPLETED').length} Pending
          </Badge>
        </CardHeader>

        <CardContent className="pt-2">
          {isLoadingTasks ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs font-semibold">Retrieving planner...</span>
            </div>
          ) : activeTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3 border border-dashed border-border/40 rounded-xl bg-muted/10">
              <div className="p-3 rounded-full bg-muted border border-border/30">
                <AlertCircle className="size-5 text-muted-foreground" />
              </div>
              <div className="space-y-1 px-4">
                <p className="text-sm font-bold text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground font-medium max-w-[240px]">
                  No pending tasks for today. Click below to add tasks or check your calendar.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeTasks.map((task: any) => {
                const isCompleted = task.status === 'COMPLETED'
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/40 hover:border-border/80 bg-background/30 hover:bg-background/60 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Button-based Checkbox */}
                      <button
                        onClick={() => handleToggleComplete(task)}
                        aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                        className="shrink-0 flex items-center justify-center size-5 rounded border border-input hover:border-primary bg-background transition-colors focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
                      >
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="size-3 rounded-sm bg-primary"
                          />
                        )}
                      </button>
                      
                      <div className="space-y-0.5 truncate">
                        <span
                          onClick={() => handleToggleComplete(task)}
                          className="text-sm font-semibold text-foreground tracking-tight cursor-pointer group-hover:text-primary transition-colors block truncate"
                        >
                          {task.title}
                        </span>
                        {task.dueDate && (
                          <p className="text-[10px] text-muted-foreground font-medium">
                            Due: {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>

                    <Badge variant="outline" className={`text-[9px] font-bold py-0 px-2 rounded-lg border ${priorityColor(task.priority)}`}>
                      {task.priority}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="pt-2 border-t border-border/40">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs font-bold text-muted-foreground hover:text-foreground justify-between group"
          onClick={() => navigate('/planner')}
        >
          <span>Open Planner Workspace</span>
          <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  )
}
