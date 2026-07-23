import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { CheckSquare, Flame, Sparkles, Clock, TrendingUp, TrendingDown } from '@/lib/icons'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend: {
    value: number
    label: string
    isPositive: boolean
  }
  color: string
  sparklineData: number[]
}

function StatCard({ title, value, icon: Icon, trend, color, sparklineData }: StatCardProps) {
  // Generate SVG path for sparkline
  const sparklinePath = (() => {
    if (sparklineData.length === 0) return ''
    const width = 100
    const height = 30
    const min = Math.min(...sparklineData)
    const max = Math.max(...sparklineData)
    const range = max - min || 1
    
    return sparklineData
      .map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * width
        const y = height - ((val - min) / range) * height
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')
  })()

  return (
    <Card className="overflow-hidden border border-border/60 bg-card/45 backdrop-blur-sm hover:border-border/100 transition-all duration-200">
      <CardContent className="p-5 flex flex-col justify-between h-36">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</span>
          <div className={`p-2 rounded-xl bg-card border border-border/40 ${color}`}>
            <Icon className="size-4" />
          </div>
        </div>

        <div className="flex items-end justify-between mt-2">
          <div className="space-y-1">
            <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{value}</h3>
            
            {/* Trend Indicator */}
            <div className="flex items-center gap-1 text-[10px] font-bold">
              {trend.isPositive ? (
                <TrendingUp className="size-3 text-emerald-500" />
              ) : (
                <TrendingDown className="size-3 text-destructive" />
              )}
              <span className={trend.isPositive ? 'text-emerald-500' : 'text-destructive'}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-muted-foreground font-medium">{trend.label}</span>
            </div>
          </div>

          {/* Sparkline Graphic */}
          <div className="w-24 h-8 shrink-0 opacity-75 hover:opacity-100 transition-opacity">
            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path
                d={sparklinePath}
                fill="none"
                stroke={trend.isPositive ? '#10b981' : '#ef4444'}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface OverviewStatsProps {
  stats: {
    completedTasks: number
    taskCompletionRate: number
    totalStudyHours: number
    totalAiTokens: number
    activeListings: number
    streak: number
    totalResources: number
  }
  chartData?: Array<{
    completedTasks: number
    studyMinutes: number
    aiTokens: number
    activeListings: number
  }>
}

export function OverviewStats({ stats, chartData = [] }: OverviewStatsProps) {
  // Extract historical trends for sparklines
  const taskSparkline = chartData.map((d) => d.completedTasks)
  const studySparkline = chartData.map((d) => d.studyMinutes)
  const tokensSparkline = chartData.map((d) => d.aiTokens)

  // Fallback sparkline if no activity exists
  const emptySpark = [0, 0, 0, 0, 0, 0, 0]

  // Helper to compute percentage trend dynamically from timeline data
  const calculateTrend = (data: number[], label = 'vs last week') => {
    if (data.length < 2) {
      return { value: 0, label: 'no activity yet', isPositive: true }
    }
    const mid = Math.floor(data.length / 2)
    const prevSum = data.slice(0, mid).reduce((a, b) => a + b, 0)
    const recentSum = data.slice(mid).reduce((a, b) => a + b, 0)

    if (prevSum === 0) {
      if (recentSum > 0) return { value: 100, label: 'new activity', isPositive: true }
      return { value: 0, label: 'no change', isPositive: true }
    }

    const pctChange = Math.round(((recentSum - prevSum) / prevSum) * 100)
    return {
      value: Math.abs(pctChange),
      label,
      isPositive: pctChange >= 0,
    }
  }

  const items = [
    {
      title: 'Active Tasks',
      value: stats.completedTasks,
      icon: CheckSquare,
      trend: calculateTrend(taskSparkline),
      color: 'text-blue-500',
      sparklineData: taskSparkline.length > 0 ? taskSparkline : emptySpark,
    },
    {
      title: 'Study Hours',
      value: `${stats.totalStudyHours.toFixed(1)}h`,
      icon: Clock,
      trend: calculateTrend(studySparkline),
      color: 'text-pink-500',
      sparklineData: studySparkline.length > 0 ? studySparkline : emptySpark,
    },
    {
      title: 'AI Tokens Spent',
      value: stats.totalAiTokens.toLocaleString(),
      icon: Sparkles,
      trend: calculateTrend(tokensSparkline),
      color: 'text-purple-500',
      sparklineData: tokensSparkline.length > 0 ? tokensSparkline : emptySpark,
    },
    {
      title: 'Study Streak',
      value: `${stats.streak} days`,
      icon: Flame,
      trend: {
        value: stats.streak > 0 ? 100 : 0,
        label: stats.streak > 0 ? 'daily goal met' : 'start your streak',
        isPositive: true,
      },
      color: 'text-orange-500',
      sparklineData: taskSparkline.length > 0 ? taskSparkline : emptySpark,
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {items.map((stat, idx) => (
        <motion.div key={idx} variants={itemVariants}>
          <StatCard {...stat} />
        </motion.div>
      ))}
    </motion.div>
  )
}
