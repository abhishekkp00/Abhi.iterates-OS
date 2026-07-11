import type { Resource } from '@/types/resources'
import { Plus, RefreshCw, Calendar, Clock } from '@/lib/icons'

interface ResourceActivityTimelineProps {
  resource: Resource
}

export function ResourceActivityTimeline({ resource }: ResourceActivityTimelineProps) {
  const timelineEvents = [
    {
      id: 'created',
      title: 'Resource Created',
      description: `Added by student user`,
      date: new Date(resource.createdAt),
      icon: Plus,
      iconColor: 'text-primary bg-primary/10 border-primary/20',
    },
    {
      id: 'updated',
      title: 'Last Modified',
      description: 'Metadata or details updated',
      date: new Date(resource.updatedAt),
      icon: RefreshCw,
      iconColor: 'text-info bg-info/10 border-info/20',
    },
  ]

  if (resource.deadline) {
    timelineEvents.push({
      id: 'deadline',
      title: 'Completion Target',
      description: 'Target study milestone deadline',
      date: new Date(resource.deadline),
      icon: Calendar,
      iconColor: 'text-warning bg-warning/10 border-warning/20',
    })
  }

  // Sort timeline events chronologically
  const sortedEvents = [...timelineEvents].sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-1.5 border-b border-border pb-3">
        <Clock className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Activity Timeline</h3>
      </div>

      <div className="relative pl-6 border-l border-border space-y-6 ml-2.5">
        {sortedEvents.map((evt) => {
          const Icon = evt.icon
          return (
            <div key={evt.id} className="relative group">
              {/* Timeline marker icon */}
              <div
                className={`absolute -left-[35px] top-0.5 rounded-full border p-1 size-6 flex items-center justify-center transition-transform group-hover:scale-110 duration-200 ${evt.iconColor}`}
              >
                <Icon className="size-3" />
              </div>

              {/* Event Content */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground leading-none">
                  {evt.title}
                </p>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  {evt.description}
                </p>
                <p className="text-[10px] text-muted-foreground/60 font-medium">
                  {evt.date.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
