import { useState } from 'react'
import { motion } from 'framer-motion'
import { useResourceAnalyticsQuery } from '@/features/analytics/hooks/useAnalytics'
import { DateRangeSelector } from '@/features/analytics/components/DateRangeSelector'
import {
  FolderOpen,
  BookOpen,
  FileText,
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
} from 'recharts'

export default function ResourceAnalytics() {
  const [range, setRange] = useState<number>(7)
  const { data, isLoading, isError, refetch } = useResourceAnalyticsQuery(range)

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Aggregating resource metrics...</p>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-destructive">Failed to Load Resource Analytics</h2>
          <p className="text-sm text-muted-foreground">Ensure your backend server is online and try again.</p>
        </div>
        <Button onClick={() => refetch()} size="sm">
          Retry
        </Button>
      </div>
    )
  }

  // Category distribution data for the Pie Chart
  const categoryData = [
    { name: 'Lecture Notes', value: data.totalLectureNotes, color: '#10b981' },
    { name: 'Books', value: data.totalBooks, color: '#3b82f6' },
    { name: 'Cheatsheets', value: data.totalCheatsheets, color: '#ec4899' },
    { name: 'Past Papers', value: data.totalPastPapers, color: '#f59e0b' },
    { name: 'Others', value: data.totalOthers, color: '#6b7280' },
  ].filter((item) => item.value > 0)

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
            <FolderOpen className="size-6 text-emerald-500" />
            <h1 className="text-2xl font-bold tracking-tight">Resource Metrics</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor study library uploads, document counts, and academic categories distribution.
          </p>
        </div>
        <div className="self-start sm:self-center">
          <DateRangeSelector value={range} onChange={setRange} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/60 backdrop-blur-md border border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Resources</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{data.totalResources}</h3>
              <p className="text-[10px] text-muted-foreground">Academic files registered</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/5">
              <FolderOpen className="size-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lecture Notes</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{data.totalLectureNotes}</h3>
              <p className="text-[10px] text-muted-foreground">Class handouts & notes</p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/5">
              <FileText className="size-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Textbooks</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{data.totalBooks}</h3>
              <p className="text-[10px] text-muted-foreground">Referenced standard books</p>
            </div>
            <div className="p-3 rounded-2xl bg-pink-500/5">
              <BookOpen className="size-5 text-pink-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cheatsheets & Exams</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
                {data.totalCheatsheets + data.totalPastPapers}
              </h3>
              <p className="text-[10px] text-muted-foreground">Exam prep cheatsheets/papers</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/5">
              <Zap className="size-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload trend Area Chart */}
        <Card className="lg:col-span-2 bg-card/60 backdrop-blur-md border border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="size-4.5 text-primary" />
              Resource Uploads Timeline
            </CardTitle>
            <CardDescription className="text-xs">
              Daily frequency of new study materials uploaded.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 pr-4">
            {data.timeline.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground italic">
                No uploads recorded in this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
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
                  />
                  <Area
                    type="monotone"
                    dataKey="createdCount"
                    name="Resources Uploaded"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUploads)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category distribution Pie Chart */}
        <Card className="lg:col-span-1 bg-card/60 backdrop-blur-md border border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="size-4.5 text-primary" />
              Category Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              File type distribution of library resources.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-80">
            {categoryData.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No category breakdown data.</p>
            ) : (
              <>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
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
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[10px] font-semibold mt-2 px-2">
                  {categoryData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1">
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
      </div>
    </motion.div>
  )
}
