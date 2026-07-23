import { Plus, Trash2, MapPin } from 'lucide-react'
import type { Task, CalendarEvent } from '@/types/productivity'

interface AgendaListProps {
  selectedDate: Date
  tasks: Task[]
  events: CalendarEvent[]
  onAddEvent: () => void
  onDeleteEvent: (id: string) => void
}

export function AgendaList({ selectedDate, tasks, events, onAddEvent, onDeleteEvent }: AgendaListProps) {
  const formattedDate = selectedDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  // Filter events on selectedDate
  const dayEvents = events.filter((e) => {
    const start = new Date(e.startTime)
    return (
      start.getDate() === selectedDate.getDate() &&
      start.getMonth() === selectedDate.getMonth() &&
      start.getFullYear() === selectedDate.getFullYear()
    )
  })

  // Filter tasks due on selectedDate
  const dayTasks = tasks.filter((t) => {
    if (!t.dueDate) return false
    const due = new Date(t.dueDate)
    return (
      due.getDate() === selectedDate.getDate() &&
      due.getMonth() === selectedDate.getMonth() &&
      due.getFullYear() === selectedDate.getFullYear()
    )
  })

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-card/50 border border-border/40 rounded-lg p-4 shadow-sm flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
            Schedule
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{formattedDate}</p>
        </div>
        <button
          onClick={onAddEvent}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold uppercase tracking-wider transition-colors"
        >
          <Plus className="size-3" />
          Add Event
        </button>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[200px]">
        {/* Events Section */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 border-b border-border/20 pb-1">
            Events ({dayEvents.length})
          </h3>
          {dayEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 italic py-2">No scheduled lectures or events.</p>
          ) : (
            dayEvents.map((event) => (
              <div
                key={event.id}
                className="group flex gap-3 p-2.5 rounded-md border border-border/30 bg-background/30 hover:border-indigo-500/30 transition-all"
              >
                <div className="text-xs font-semibold text-indigo-500 shrink-0 select-none">
                  {formatTime(event.startTime)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate">{event.title}</h4>
                  {event.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{event.description}</p>
                  )}
                  {event.location && (
                    <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground mt-1 bg-muted/40 px-1 rounded">
                      <MapPin className="size-2.5" />
                      {event.location}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onDeleteEvent(event.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all self-start"
                  title="Delete Event"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Tasks Section */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 border-b border-border/20 pb-1">
            Tasks Due ({dayTasks.length})
          </h3>
          {dayTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 italic py-2">No tasks due today.</p>
          ) : (
            dayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2.5 p-2 rounded-md border border-border/30 bg-background/20"
              >
                <span
                  className={`size-2 rounded-full ${
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
                  <span className="text-[9px] text-muted-foreground uppercase">{task.category}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
