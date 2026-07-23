import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTasks } from '@/features/productivity/hooks/useTasks'
import { useCalendar } from '@/features/productivity/hooks/useCalendar'
import { ProgressCard } from '@/features/productivity/components/ProgressCard'
import { CalendarGrid } from '@/features/productivity/components/CalendarGrid'
import { AgendaList } from '@/features/productivity/components/AgendaList'
import { QuickAddDialog } from '@/features/productivity/components/QuickAddDialog'

export default function PlannerPage() {
  const { tasks, summary, isLoadingSummary, createTask } = useTasks()
  const { events, createEvent, deleteEvent } = useCalendar()
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Productivity Planner</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track your tasks, assignments, schedules, and lectures.
          </p>
        </div>
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="size-4" />
          Quick Add
        </button>
      </div>

      {/* Progress & Quick Stats Card */}
      <ProgressCard summary={summary} isLoading={isLoadingSummary} />

      {/* Dashboard Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Calendar Month View */}
        <div className="lg:col-span-2 flex flex-col h-full min-h-[400px]">
          <CalendarGrid
            tasks={tasks}
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* Right 1 Column: Today's / Selected Date's Agenda List */}
        <div className="lg:col-span-1 flex flex-col h-full min-h-[400px]">
          <AgendaList
            selectedDate={selectedDate}
            tasks={tasks}
            events={events}
            onAddEvent={() => setIsQuickAddOpen(true)}
            onDeleteEvent={deleteEvent}
          />
        </div>
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
