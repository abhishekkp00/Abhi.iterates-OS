import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMarketplaceAnalyticsQuery } from '@/features/analytics/hooks/useAnalytics'
import { DateRangeSelector } from '@/features/analytics/components/DateRangeSelector'
import {
  ShoppingBag,
  Tag,
  DollarSign,
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

export default function MarketplaceAnalytics() {
  const [range, setRange] = useState<number>(7)
  const { data, isLoading, isError, refetch } = useMarketplaceAnalyticsQuery(range)

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Aggregating trade statistics...</p>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-destructive">Failed to Load Marketplace Analytics</h2>
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
    { name: 'Books', value: data.totalBooks, color: '#f59e0b' },
    { name: 'Electronics', value: data.totalElectronics, color: '#3b82f6' },
    { name: 'Housing', value: data.totalHousing, color: '#10b981' },
    { name: 'Services', value: data.totalServices, color: '#8b5cf6' },
    { name: 'Clothing', value: data.totalClothing, color: '#ec4899' },
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
            <ShoppingBag className="size-6 text-amber-500" />
            <h1 className="text-2xl font-bold tracking-tight">Marketplace Metrics</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Analyze campus listings volume, sold goods ratio, and generated trade revenue.
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
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Listed</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{data.totalListings}</h3>
              <p className="text-[10px] text-muted-foreground">Lifetime items posted</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/5">
              <ShoppingBag className="size-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Offers</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{data.activeListings}</h3>
              <p className="text-[10px] text-muted-foreground">Currently live on market</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/5">
              <Tag className="size-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items Sold</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{data.soldListings}</h3>
              <p className="text-[10px] text-muted-foreground">Deals successfully completed</p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/5">
              <Zap className="size-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue Earned</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
                ${data.totalRevenue.toFixed(2)}
              </h3>
              <p className="text-[10px] text-muted-foreground">Value of sold transactions</p>
            </div>
            <div className="p-3 rounded-2xl bg-cyan-500/5">
              <DollarSign className="size-5 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trade Activity Area Chart */}
        <Card className="lg:col-span-2 bg-card/60 backdrop-blur-md border border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="size-4.5 text-primary" />
              Listing & Sales Timeline
            </CardTitle>
            <CardDescription className="text-xs">
              Daily comparison of new listings created vs deals closed.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 pr-4">
            {data.timeline.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground italic">
                No transaction records. List items to populate metrics.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
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
                  <Area
                    type="monotone"
                    dataKey="createdCount"
                    name="Listings Posted"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCreated)"
                  />
                  <Area
                    type="monotone"
                    dataKey="soldCount"
                    name="Items Sold"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    fillOpacity={1}
                    fill="url(#colorSold)"
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
              Item distribution listed for trade.
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
