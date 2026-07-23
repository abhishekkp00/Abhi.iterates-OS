import { useState } from 'react'
import { Plus, Trash2, MapPin } from 'lucide-react'
import { useTasks } from '@/features/productivity/hooks/useTasks'
import { useCalendar } from '@/features/productivity/hooks/useCalendar'
import { QuickAddDialog } from '@/features/productivity/components/QuickAddDialog'
import { Card, CardContent } from '@/components/ui/card'

export default function CalendarWeekPage() {
  const { createTask } = useTasks()
  const { events, createEvent, deleteEvent } = useCalendar()
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  // Calculate current week days (Sunday to Saturday)
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday

  const weekDays = Array.from({ length: 7 }).map((_, idx) => {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + idx)
    return day
  })

  const getEventsForDay = (date: Date) => {
    return events.filter((e) => {
      const start = new Date(e.startTime)
      return (
        start.getDate() === date.getDate() &&
        start.getMonth() === date.getMonth() &&
        start.getFullYear() === date.getFullYear()
      )
    })
  }

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 flex-1 overflow-x-auto min-h-[400px]">
        {weekDays.map((date) => {
          const dayEvents = getEventsForDay(date)
          const isCurrentToday = isToday(date)
          const dayName = date.toLocaleDateString(undefined, { weekday: 'short' })
          const dayNum = date.getDate()

          return (
            <Card
              key={date.toISOString()}
              className={`bg-card/50 border flex flex-col min-h-[300px] md:min-h-0 ${
                isCurrentToday ? 'border-primary/40 bg-primary/[0.02]' : 'border-border/40'
              }`}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-border/30 flex items-center justify-between shrink-0">
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isCurrentToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {dayName}
                  </h3>
                  <p className="text-lg font-extrabold tracking-tight mt-0.5">{dayNum}</p>
                </div>
                <button
                  onClick={() => setIsQuickAddOpen(true)}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                  title="Add Event"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              {/* Column Events List */}
              <CardContent className="p-2 flex-1 overflow-y-auto space-y-2">
                {dayEvents.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/50 italic text-center py-4">No events</p>
                ) : (
                  dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="group p-2 rounded border border-border/30 bg-background/30 hover:border-indigo-500/30 transition-all flex flex-col gap-1 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-indigo-400">
                          {formatTime(event.startTime)}
                        </span>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all absolute top-1 right-1"
                        >
                          <Trash2 className="size-2.5" />
                        </button>
                      </div>
                      <h4 className="text-[11px] font-bold text-foreground line-clamp-1">{event.title}</h4>
                      {event.location && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] text-muted-foreground mt-0.5 truncate">
                          <MapPin className="size-2" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
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
