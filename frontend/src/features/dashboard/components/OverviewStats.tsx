import { motion } from 'framer-motion'
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
  const sparklinePath = (() => {
    if (sparklineData.length === 0) return ''
    const width = 100
    const height = 28
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
    <div className="clean-card p-5 flex flex-col justify-between h-36 group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${color}`}>
          <Icon className="size-4" />
        </div>
      </div>

      <div className="flex items-end justify-between mt-2">
        <div className="space-y-1">
          <h3 className="font-display text-2xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
            {value}
          </h3>
          
          <div className="flex items-center gap-1.5 text-xs">
            {trend.isPositive ? (
              <TrendingUp className="size-3.5 text-emerald-400 shrink-0" />
            ) : (
              <TrendingDown className="size-3.5 text-rose-400 shrink-0" />
            )}
            <span className={trend.isPositive ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-slate-400 font-medium truncate">{trend.label}</span>
          </div>
        </div>

        {/* Sparkline Graphic */}
        <div className="w-20 h-7 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          <svg className="w-full h-full" viewBox="0 0 100 28" preserveAspectRatio="none">
            <path
              d={sparklinePath}
              fill="none"
              stroke={trend.isPositive ? '#10b981' : '#ef4444'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
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
  const taskSparkline = chartData.map((d) => d.completedTasks)
  const studySparkline = chartData.map((d) => d.studyMinutes)
  const tokensSparkline = chartData.map((d) => d.aiTokens)

  const emptySpark = [0, 0, 0, 0, 0, 0, 0]

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
      color: 'text-indigo-400',
      sparklineData: taskSparkline.length > 0 ? taskSparkline : emptySpark,
    },
    {
      title: 'Study Hours',
      value: `${stats.totalStudyHours.toFixed(1)}h`,
      icon: Clock,
      trend: calculateTrend(studySparkline),
      color: 'text-cyan-400',
      sparklineData: studySparkline.length > 0 ? studySparkline : emptySpark,
    },
    {
      title: 'AI Tokens Spent',
      value: stats.totalAiTokens.toLocaleString(),
      icon: Sparkles,
      trend: calculateTrend(tokensSparkline),
      color: 'text-purple-400',
      sparklineData: tokensSparkline.length > 0 ? tokensSparkline : emptySpark,
    },
    {
      title: 'Study Streak',
      value: `${stats.streak} days`,
      icon: Flame,
      trend: {
        value: stats.streak > 0 ? 100 : 0,
        label: stats.streak > 0 ? 'streak active' : 'streak broken',
        isPositive: stats.streak > 0,
      },
      color: stats.streak > 0 ? 'text-amber-400' : 'text-slate-500',
      sparklineData: taskSparkline.length > 0 ? taskSparkline : emptySpark,
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
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
