import { useState } from 'react'
import { motion } from 'framer-motion'
import { useProductivityAnalyticsQuery } from '@/features/analytics/hooks/useAnalytics'
import { DateRangeSelector } from '@/features/analytics/components/DateRangeSelector'
import {
  ListTodo,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Activity,
  Zap,
} from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

export default function ProductivityAnalytics() {
  const [range, setRange] = useState<number>(7)
  const { data, isLoading, isError, refetch } = useProductivityAnalyticsQuery(range)

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Aggregating task statistics...</p>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-destructive">Failed to Load Productivity Analytics</h2>
          <p className="text-sm text-muted-foreground">Ensure your backend server is online and try again.</p>
        </div>
        <Button onClick={() => refetch()} size="sm">
          Retry
        </Button>
      </div>
    )
  }

  const completionRate = data.totalTasks > 0 ? (data.completedTasks / data.totalTasks) * 100 : 0

  // Status breakdown data for the Pie Chart
  const statusData = [
    { name: 'To-Do', value: data.todoTasks, color: '#f59e0b' },
    { name: 'In Progress', value: data.inProgressTasks, color: '#3b82f6' },
    { name: 'Completed', value: data.completedTasks, color: '#10b981' },
  ].filter((item) => item.value > 0)

  // Priority distribution progress bar data
  const priorities = [
    {
      label: 'High Priority',
      completed: data.highPriorityCompleted,
      total: data.highPriorityTotal,
      color: 'bg-red-500',
      textColor: 'text-red-500',
    },
    {
      label: 'Medium Priority',
      completed: data.mediumPriorityCompleted,
      total: data.mediumPriorityTotal,
      color: 'bg-amber-500',
      textColor: 'text-amber-500',
    },
    {
      label: 'Low Priority',
      completed: data.lowPriorityCompleted,
      total: data.lowPriorityTotal,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
    },
  ]

  const formatDateLabel = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-6 max-w-7xl space-y-8"
    >
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ListTodo className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Productivity Metrics</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Analyze your task backlog, priority distribution, and completion trends.
          </p>
        </div>
        <div className="self-start sm:self-center">
          <DateRangeSelector value={range} onChange={setRange} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/60 backdrop-blur-md border border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Backlog</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{data.totalTasks}</h3>
              <p className="text-[10px] text-muted-foreground">Tasks in current plan</p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/5">
              <ListTodo className="size-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed Tasks</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{data.completedTasks}</h3>
              <p className="text-[10px] text-muted-foreground">Successfully closed</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/5">
              <CheckCircle2 className="size-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completion Rate</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
                {Math.round(completionRate)}%
              </h3>
              <p className="text-[10px] text-muted-foreground">Ratio of finished items</p>
            </div>
            <div className="p-3 rounded-2xl bg-cyan-500/5">
              <Activity className="size-5 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active In Progress</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{data.inProgressTasks}</h3>
              <p className="text-[10px] text-muted-foreground">Under active development</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/5">
              <Clock className="size-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend line chart of completions vs creations */}
        <Card className="lg:col-span-2 bg-card/60 backdrop-blur-md border border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="size-4.5 text-primary" />
              Task Completion Timeline
            </CardTitle>
            <CardDescription className="text-xs">
              Daily comparison of tasks completed vs tasks created.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 pr-4">
            {data.timeline.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground italic">
                No timeline points recorded. Create or update tasks to view trends.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="completedCount"
                    name="Completed Tasks"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                  />
                  <Area
                    type="monotone"
                    dataKey="createdCount"
                    name="Created Tasks"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorCreated)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card className="lg:col-span-1 bg-card/60 backdrop-blur-md border border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="size-4.5 text-primary" />
              Status Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Current state distribution of your task list.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-80">
            {statusData.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No task breakdown data.</p>
            ) : (
              <>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          borderRadius: '12px',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend list */}
                <div className="flex justify-center gap-4 text-[10px] font-semibold mt-2">
                  {statusData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Priority distribution breakdown progress bars */}
        <Card className="lg:col-span-3 bg-card/60 backdrop-blur-md border border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Priority Distribution Completion</CardTitle>
            <CardDescription className="text-xs">
              Analyzing completion rates grouped by task urgency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {priorities.map((p, idx) => {
              const pct = p.total > 0 ? (p.completed / p.total) * 100 : 0
              return (
                <div key={idx} className="space-y-1.5 p-3 rounded-xl border border-border/40 bg-muted/20">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-foreground">{p.label}</span>
                    <span className={p.textColor}>
                      {p.completed} / {p.total} ({Math.round(pct)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/30">
                    <div
                      className={`h-full ${p.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
