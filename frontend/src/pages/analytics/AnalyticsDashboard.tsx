import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAnalyticsQuery } from '@/features/analytics/hooks/useAnalytics'
import { DateRangeSelector } from '@/features/analytics/components/DateRangeSelector'
import { OverviewCards } from '@/features/analytics/components/OverviewCards'
import { InsightsPanel } from '@/features/analytics/components/InsightsPanel'
import {
  Activity,
  Loader2,
  AlertCircle,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
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
} from 'recharts'

export default function AnalyticsDashboard() {
  const [range, setRange] = useState<number>(7)
  const [chartMetric, setChartMetric] = useState<'tasks' | 'study' | 'tokens' | 'listings'>('tasks')
  
  const { data, isLoading, isError, refetch } = useAnalyticsQuery(range)

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Aggregating workspace analytics...</p>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-destructive">Failed to Load Analytics</h2>
          <p className="text-sm text-muted-foreground">Ensure your backend server is online and try again.</p>
        </div>
        <Button onClick={() => refetch()} size="sm">
          Retry
        </Button>
      </div>
    )
  }

  const metricConfigs = {
    tasks: {
      dataKey: 'completedTasks',
      label: 'Tasks Completed',
      color: '#3b82f6',
      fill: 'url(#colorTasks)',
      icon: <CheckCircle2 className="size-4" />,
    },
    study: {
      dataKey: 'studyMinutes',
      label: 'Study Minutes',
      color: '#a855f7',
      fill: 'url(#colorStudy)',
      icon: <Clock className="size-4" />,
    },
    tokens: {
      dataKey: 'aiTokens',
      label: 'AI Tokens Used',
      color: '#22d3ee',
      fill: 'url(#colorTokens)',
      icon: <Sparkles className="size-4" />,
    },
    listings: {
      dataKey: 'activeListings',
      label: 'Marketplace listings',
      color: '#10b981',
      fill: 'url(#colorListings)',
      icon: <ShoppingBag className="size-4" />,
    },
  }

  const activeMetric = metricConfigs[chartMetric]

  // Formatter for dates in charts (e.g. "Jun 24")
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
            <LayoutDashboard className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Track study milestones, plan completed tasks, and monitor active agent usage.
          </p>
        </div>
        <div className="self-start sm:self-center">
          <DateRangeSelector value={range} onChange={setRange} />
        </div>
      </div>

      {/* Aggregate Overview Metrics */}
      <OverviewCards
        completedTasks={data.completedTasks}
        taskCompletionRate={data.taskCompletionRate}
        totalStudyHours={data.totalStudyHours}
        totalAiTokens={data.totalAiTokens}
        activeListings={data.activeListings}
      />

      {/* Main Charts & Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend Area Chart */}
        <Card className="lg:col-span-2 bg-card/60 backdrop-blur-md border border-border/60">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="size-4.5 text-primary" />
                Performance Trends
              </CardTitle>
              <CardDescription className="text-xs">
                Visualizing daily performance indicators.
              </CardDescription>
            </div>

            {/* Metric Switcher Toggles */}
            <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 border border-border/50 p-1 rounded-xl">
              {(Object.keys(metricConfigs) as Array<keyof typeof metricConfigs>).map((key) => (
                <button
                  key={key}
                  onClick={() => setChartMetric(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    chartMetric === key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {metricConfigs[key].icon}
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-80 w-full pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey={activeMetric.dataKey}
                  name={activeMetric.label}
                  stroke={activeMetric.color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={activeMetric.fill}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Actionable Insights panel */}
        <div className="lg:col-span-1">
          <InsightsPanel insights={data.insights} />
        </div>
      </div>
    </motion.div>
  )
}
