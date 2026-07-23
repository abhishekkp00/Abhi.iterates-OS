import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Task, CalendarEvent } from '@/types/productivity'

interface CalendarGridProps {
  tasks: Task[]
  events: CalendarEvent[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
}

export function CalendarGrid({ tasks, events, selectedDate, onSelectDate }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // First day of the month
  const firstDayOfMonth = new Date(year, month, 1)
  const startDayOfWeek = firstDayOfMonth.getDay() // 0 = Sun, 6 = Sat

  // Days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Days list
  const days: (Date | null)[] = []
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i))
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

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

  const getTasksForDay = (date: Date) => {
    return tasks.filter((t) => {
      if (!t.dueDate) return false
      const due = new Date(t.dueDate)
      return (
        due.getDate() === date.getDate() &&
        due.getMonth() === date.getMonth() &&
        due.getFullYear() === date.getFullYear()
      )
    })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-card/50 border border-border/40 rounded-lg p-4 shadow-sm flex flex-col h-full">
      {/* Month Header Navigation */}
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-foreground">
          {monthNames[month]} {year}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 text-center pb-2 border-b border-border/30">
        {weekDays.map((day) => (
          <div key={day} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 pt-2 flex-1 auto-rows-fr min-h-[280px]">
        {days.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="p-1 bg-muted/10 rounded" />
          }

          const dayEvents = getEventsForDay(date)
          const dayTasks = getTasksForDay(date)
          const isCurrentToday = isToday(date)
          const isCurrentSelected = isSelected(date)

          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelectDate(date)}
              className={`p-1.5 rounded flex flex-col items-start gap-1 justify-between transition-all focus:outline-none hover:bg-muted/40 relative text-left ${
                isCurrentSelected
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-background/20 border border-transparent'
              }`}
            >
              {/* Day Number */}
              <span
                className={`text-xs font-semibold size-5 flex items-center justify-center rounded-full ${
                  isCurrentToday
                    ? 'bg-primary text-primary-foreground font-bold'
                    : isCurrentSelected
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {date.getDate()}
              </span>

              {/* Event / Task Dots */}
              <div className="flex flex-wrap gap-1 max-w-full overflow-hidden">
                {dayEvents.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    className="size-1.5 rounded-full bg-indigo-500"
                    title={`Event: ${e.title}`}
                  />
                ))}
                {dayTasks.slice(0, 3).map((t) => (
                  <span
                    key={t.id}
                    className={`size-1.5 rounded-full ${t.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-red-500'}`}
                    title={`Task: ${t.title}`}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
