import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAiAnalyticsQuery } from '@/features/analytics/hooks/useAnalytics'
import { DateRangeSelector } from '@/features/analytics/components/DateRangeSelector'
import {
  Sparkles,
  MessageSquare,
  Cpu,
  Loader2,
  AlertCircle,
  Activity,
  Info,
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
  BarChart,
  Bar,
} from 'recharts'

export default function AiAnalytics() {
  const [range, setRange] = useState<number>(7)
  const { data, isLoading, isError, refetch } = useAiAnalyticsQuery(range)

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Aggregating AI conversation metrics...</p>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-destructive">Failed to Load AI Analytics</h2>
          <p className="text-sm text-muted-foreground">Ensure your backend server is online and try again.</p>
        </div>
        <Button onClick={() => refetch()} size="sm">
          Retry
        </Button>
      </div>
    )
  }

  // Token cost estimate: $0.0035 per 1,000 tokens
  const estimatedCost = (data.totalTokens / 1000) * 0.0035

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
            <Sparkles className="size-6 text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight">AI Assistant Analytics</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Track message history, model queries, and estimated token consumption indicators.
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
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Chats</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{data.totalConversations}</h3>
              <p className="text-[10px] text-muted-foreground">Created conversation threads</p>
            </div>
            <div className="p-3 rounded-2xl bg-cyan-500/5">
              <MessageSquare className="size-5 text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User Queries</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{data.totalQueries}</h3>
              <p className="text-[10px] text-muted-foreground">Direct prompts submitted</p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/5">
              <Activity className="size-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tokens Spent</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
                {data.totalTokens.toLocaleString()}
              </h3>
              <p className="text-[10px] text-muted-foreground">Aggregated prompt/completion context</p>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/5">
              <Cpu className="size-5 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Est. Usage Cost</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
                ${estimatedCost.toFixed(4)}
              </h3>
              <p className="text-[10px] text-muted-foreground">Calculated at $0.0035/1k tokens</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/5">
              <Info className="size-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Token Usage Trend Area Chart */}
        <Card className="bg-card/60 backdrop-blur-md border border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Cpu className="size-4.5 text-cyan-400" />
              Token Usage Trend
            </CardTitle>
            <CardDescription className="text-xs">
              Daily token consumption profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 pr-4">
            {data.timeline.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground italic">
                No timeline points recorded. Query the AI companion to populate data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
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
                    dataKey="tokenCount"
                    name="Tokens Consumed"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTokens)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* User Queries volume Bar Chart */}
        <Card className="bg-card/60 backdrop-blur-md border border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="size-4.5 text-primary" />
              Prompt Activity
            </CardTitle>
            <CardDescription className="text-xs">
              Daily query prompt counts submitted to assistant.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 pr-4">
            {data.timeline.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground italic">
                No queries logged.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.timeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
                  <Bar dataKey="queryCount" name="Queries Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Average Thread Statistics summary card */}
        <Card className="lg:col-span-2 bg-card/60 backdrop-blur-md border border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Conversation Density Insights</CardTitle>
            <CardDescription className="text-xs">
              Overview details of average prompt length, chat context retention, and cost estimations.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs leading-relaxed text-muted-foreground space-y-4">
            <p>
              Your current conversation density shows an average of{' '}
              <strong className="text-foreground">{data.avgMessagesPerConversation.toFixed(1)}</strong> messages per thread.
              Longer threads keep the model grounded in user-specific contexts, but consume higher tokens.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-border/40 bg-muted/20 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Estimated Cost / Prompt</span>
                <p className="text-sm font-bold text-foreground">
                  ${((data.totalTokens > 0 && data.totalQueries > 0 ? (data.totalTokens / data.totalQueries) : 0) / 1000 * 0.0035).toFixed(6)}
                </p>
              </div>
              <div className="border border-border/40 bg-muted/20 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Tokens per Message</span>
                <p className="text-sm font-bold text-foreground">
                  {data.totalQueries > 0 ? Math.round(data.totalTokens / data.totalQueries) : 0} tokens
                </p>
              </div>
              <div className="border border-border/40 bg-muted/20 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Active Assistant status</span>
                <p className="text-sm font-bold text-emerald-400">ONLINE (Ready)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
