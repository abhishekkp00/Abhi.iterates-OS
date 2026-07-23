import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import type { PlannerSummary } from '@/types/productivity'

interface ProgressCardProps {
  summary?: PlannerSummary
  isLoading?: boolean
}

export function ProgressCard({ summary, isLoading }: ProgressCardProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Card key={idx} className="bg-card/50 border-border/40">
            <CardContent className="p-4 h-24" />
          </Card>
        ))}
      </div>
    )
  }

  const rate = Math.round(summary.completionRate)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Task Completion Rate */}
      <Card className="bg-card/50 border-border/40 relative overflow-hidden shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="size-6" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">{rate}%</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Completion Rate</p>
          </div>
          <div 
            className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-500" 
            style={{ width: `${rate}%` }}
          />
        </CardContent>
      </Card>

      {/* Active Tasks Count */}
      <Card className="bg-card/50 border-border/40 shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Clock className="size-6" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">{summary.pendingTasks}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pending Tasks</p>
          </div>
        </CardContent>
      </Card>

      {/* High Priority Warning */}
      <Card className="bg-card/50 border-border/40 relative overflow-hidden shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className={`p-3 rounded-lg ${summary.highPriorityPendingCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-muted-foreground'}`}>
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">{summary.highPriorityPendingCount}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">High Priority Pending</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
