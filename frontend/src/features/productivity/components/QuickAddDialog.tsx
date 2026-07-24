import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskForm } from './TaskForm'
import type { TaskRequest, CalendarEventRequest } from '@/types/productivity'

interface QuickAddDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddTask: (data: TaskRequest) => Promise<any>
  onAddEvent: (data: CalendarEventRequest) => Promise<any>
}

export function QuickAddDialog({ isOpen, onClose, onAddTask, onAddEvent }: QuickAddDialogProps) {
  const [activeTab, setActiveTab] = useState<'TASK' | 'EVENT'>('TASK')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDesc, setEventDesc] = useState('')
  const [eventStart, setEventStart] = useState('')
  const [eventEnd, setEventEnd] = useState('')
  const [eventLoc, setEventLoc] = useState('')
  const [eventColor, setEventColor] = useState('indigo')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventTitle.trim() || !eventStart || !eventEnd) return

    try {
      setIsSubmitting(true)
      await onAddEvent({
        title: eventTitle,
        description: eventDesc || undefined,
        startTime: new Date(eventStart).toISOString(),
        endTime: new Date(eventEnd).toISOString(),
        location: eventLoc || undefined,
        color: eventColor,
      })
      // Reset
      setEventTitle('')
      setEventDesc('')
      setEventStart('')
      setEventEnd('')
      setEventLoc('')
      onClose()
    } catch (_err) {
      // toast is triggered inside the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTaskSubmit = async (data: TaskRequest) => {
    try {
      setIsSubmitting(true)
      await onAddTask(data)
      onClose()
    } catch (_err) {
      // toast is triggered inside the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border/80 rounded-lg shadow-xl w-full max-w-md overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
            Quick Add
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-border/30">
          <button
            onClick={() => setActiveTab('TASK')}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'TASK'
                ? 'border-primary text-foreground bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Add Task
          </button>
          <button
            onClick={() => setActiveTab('EVENT')}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'EVENT'
                ? 'border-indigo-500 text-foreground bg-indigo-500/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Add Event
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto max-h-[75vh]">
          {activeTab === 'TASK' ? (
            <TaskForm onSubmit={handleTaskSubmit} onCancel={onClose} isSubmitting={isSubmitting} />
          ) : (
            <form onSubmit={handleEventSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="event-title" className="text-xs font-semibold text-muted-foreground uppercase">
                  Event Title
                </label>
                <input
                  id="event-title"
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Physics 101 Lecture"
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="event-desc" className="text-xs font-semibold text-muted-foreground uppercase">
                  Description
                </label>
                <textarea
                  id="event-desc"
                  rows={2}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Add details..."
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="event-start" className="text-xs font-semibold text-muted-foreground uppercase">
                    Start Time
                  </label>
                  <input
                    id="event-start"
                    type="datetime-local"
                    required
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    onFocus={(e) => e.currentTarget.showPicker?.()}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer [color-scheme:dark]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="event-end" className="text-xs font-semibold text-muted-foreground uppercase">
                    End Time
                  </label>
                  <input
                    id="event-end"
                    type="datetime-local"
                    required
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    onFocus={(e) => e.currentTarget.showPicker?.()}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="event-location" className="text-xs font-semibold text-muted-foreground uppercase">
                    Location
                  </label>
                  <input
                    id="event-location"
                    type="text"
                    value={eventLoc}
                    onChange={(e) => setEventLoc(e.target.value)}
                    placeholder="e.g. Hall B / Zoom"
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="event-color" className="text-xs font-semibold text-muted-foreground uppercase">
                    Theme Color
                  </label>
                  <select
                    id="event-color"
                    value={eventColor}
                    onChange={(e) => setEventColor(e.target.value)}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="indigo">Blue / Indigo</option>
                    <option value="red">Red / Alert</option>
                    <option value="emerald">Green / Success</option>
                    <option value="amber">Amber / Warning</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {isSubmitting ? 'Saving...' : 'Create Event'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
