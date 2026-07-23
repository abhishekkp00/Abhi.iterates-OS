import { useState } from 'react'
import { useTasks } from '@/features/productivity/hooks/useTasks'
import { useCalendar } from '@/features/productivity/hooks/useCalendar'
import { CalendarGrid } from '@/features/productivity/components/CalendarGrid'
import { AgendaList } from '@/features/productivity/components/AgendaList'
import { QuickAddDialog } from '@/features/productivity/components/QuickAddDialog'

export default function CalendarMonthPage() {
  const { tasks, createTask } = useTasks()
  const { events, createEvent, deleteEvent } = useCalendar()
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
      {/* Left 2 Columns: Calendar Month Grid */}
      <div className="lg:col-span-2 flex flex-col h-full min-h-[400px]">
        <CalendarGrid
          tasks={tasks}
          events={events}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* Right 1 Column: Selected Date's Agenda */}
      <div className="lg:col-span-1 flex flex-col h-full min-h-[400px]">
        <AgendaList
          selectedDate={selectedDate}
          tasks={tasks}
          events={events}
          onAddEvent={() => setIsQuickAddOpen(true)}
          onDeleteEvent={deleteEvent}
        />
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
