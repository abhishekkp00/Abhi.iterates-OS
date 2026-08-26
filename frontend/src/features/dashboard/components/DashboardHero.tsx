import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useResourcesListQuery } from '@/features/resources/hooks/useResources'
import { useTasks } from '@/features/productivity/hooks/useTasks'
import { Calendar, Play, Flame, CheckCircle2, ArrowRight } from '@/lib/icons'
import { Button } from '@/components/ui/button'

interface DashboardHeroProps {
  lastActiveContext?: {
    title: string
    url: string
  }
}

export function DashboardHero({ lastActiveContext }: DashboardHeroProps) {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const { data: resourcesData } = useResourcesListQuery({ page: 1, size: 1, sort: 'createdAt,desc' })
  const { tasks } = useTasks()

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
  }, [])

  const initials = useMemo(() => {
    if (!user?.firstName) return 'ST'
    const first = user.firstName.charAt(0).toUpperCase()
    const last = user.lastName ? user.lastName.charAt(0).toUpperCase() : ''
    return `${first}${last}`
  }, [user])

  const dynamicContext = useMemo(() => {
    if (lastActiveContext) return lastActiveContext

    const latestResource = resourcesData?.content?.[0]
    if (latestResource) {
      return { title: latestResource.title, url: '/resources' }
    }

    const latestPendingTask = tasks.find((t: any) => t.status !== 'COMPLETED')
    if (latestPendingTask) {
      return { title: latestPendingTask.title, url: '/planner' }
    }

    return { title: 'Explore Study Library', url: '/resources' }
  }, [lastActiveContext, resourcesData, tasks])

  // Compute daily goal metrics
  const completedTasksToday = tasks.filter((t: any) => t.status === 'COMPLETED').length
  const totalTasksCount = Math.max(tasks.length, 1)
  const progressPercent = Math.min(Math.round((completedTasksToday / totalTasksCount) * 100), 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative w-full"
    >
      <div className="clean-card bg-gradient-to-r from-[#151c2c] via-[#1a2336] to-[#151c2c] border-[#222d45] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* User Info & Greeting */}
          <div className="flex items-center gap-4">
            <div className="flex size-13 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 font-bold text-lg border border-indigo-500/30">
              {initials}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight text-white">
                  {greeting}, {user?.firstName || 'Student'}!
                </h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Calendar className="size-3.5 text-indigo-400" />
                <span>{currentDate}</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> Ready for today's session
                </span>
              </div>
            </div>
          </div>

          {/* Quick CTA button */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 h-9 rounded-lg shadow-md flex items-center gap-2 transition-all"
              onClick={() => navigate(dynamicContext.url)}
            >
              <Play className="size-3.5 fill-current" />
              <span>Resume: {dynamicContext.title}</span>
            </Button>
          </div>
        </div>

        {/* Daily Goal & Progress Bar Row */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">Daily Learning Goal</span>
              <span className="text-indigo-400">{completedTasksToday} of {totalTasksCount} tasks ({progressPercent}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-start md:justify-end gap-3 text-xs font-semibold text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <Flame className="size-4 text-amber-500" />
              <span className="text-slate-200">Study Streak:</span>
              <span className="text-amber-400 font-bold">Active</span>
            </div>
            <button
              onClick={() => navigate('/planner')}
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>View Planner</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
