import { useState } from 'react'
import { Trash2, Calendar as CalendarIcon, Clock, MapPin, Tag } from 'lucide-react'
import { useTasks } from '@/features/productivity/hooks/useTasks'
import { useCalendar } from '@/features/productivity/hooks/useCalendar'
import { QuickAddDialog } from '@/features/productivity/components/QuickAddDialog'
import { Card, CardContent } from '@/components/ui/card'

export default function CalendarDayPage() {
  const { tasks, createTask } = useTasks()
  const { events, createEvent, deleteEvent } = useCalendar()
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  const today = new Date()
  const formattedDate = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // Filter events for today
  const todayEvents = events.filter((e) => {
    const start = new Date(e.startTime)
    return (
      start.getDate() === today.getDate() &&
      start.getMonth() === today.getMonth() &&
      start.getFullYear() === today.getFullYear()
    )
  })

  // Filter tasks due today
  const todayTasks = tasks.filter((t) => {
    if (!t.dueDate) return false
    const due = new Date(t.dueDate)
    return (
      due.getDate() === today.getDate() &&
      due.getMonth() === today.getMonth() &&
      due.getFullYear() === today.getFullYear()
    )
  })

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
      {/* Timeline of events (Left 2 columns) */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase flex items-center gap-1.5">
            <Clock className="size-4 text-indigo-500" />
            Today's Timeline
          </h2>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>

        {todayEvents.length === 0 ? (
          <Card className="bg-card/50 border-border/40">
            <CardContent className="p-8 text-center flex flex-col items-center justify-center">
              <CalendarIcon className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs font-semibold text-muted-foreground">No events scheduled for today.</p>
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="text-xs text-primary hover:underline mt-1 font-semibold"
              >
                Add an event
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayEvents.map((event) => (
              <Card key={event.id} className="bg-card/50 border-border/40 hover:border-indigo-500/30 transition-all group relative">
                <CardContent className="p-4 flex gap-4 items-center">
                  <div className="text-sm font-bold text-indigo-500 shrink-0 border-r border-border/30 pr-4 select-none">
                    {formatTime(event.startTime)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">{event.title}</h3>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{event.description}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                      {event.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all shrink-0"
                    title="Delete Event"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Tasks due today (Right 1 column) */}
      <div className="lg:col-span-1 space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase flex items-center gap-1.5">
          <CalendarIcon className="size-4 text-emerald-500" />
          Deadlines Today
        </h2>

        {todayTasks.length === 0 ? (
          <Card className="bg-card/50 border-border/40">
            <CardContent className="p-8 text-center">
              <p className="text-xs text-muted-foreground/60 italic">No tasks due today.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <Card key={task.id} className="bg-card/50 border-border/40 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <span
                    className={`size-2 rounded-full shrink-0 ${
                      task.status === 'COMPLETED'
                        ? 'bg-emerald-500'
                        : task.priority === 'HIGH'
                        ? 'bg-red-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-semibold truncate ${
                        task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-muted-foreground">
                      <Tag className="size-2.5" />
                      <span className="uppercase">{task.category}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Dialog */}
      <QuickAddDialog
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAddTask={createTask}
        onAddEvent={createEvent}
      />
    </div>
  )
}
