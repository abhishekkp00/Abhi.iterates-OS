import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useResourcesListQuery } from '@/features/resources/hooks/useResources'
import { useTasks } from '@/features/productivity/hooks/useTasks'
import { Calendar, Play, Terminal } from '@/lib/icons'
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
    if (hour < 12) return 'GOOD_MORNING'
    if (hour < 18) return 'GOOD_AFTERNOON'
    return 'GOOD_EVENING'
  }, [])

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).toUpperCase()
  }, [])

  const motivationalQuote = useMemo(() => {
    const quotes = [
      "Success is the sum of small efforts, repeated day in and day out.",
      "The expert in anything was once a beginner.",
      "Focus on progress, not perfection.",
      "Your limitation—it's only your imagination.",
      "Push yourself, because no one else is going to do it for you."
    ]
    const index = new Date().getDate() % quotes.length
    return quotes[index]
  }, [])

  const initials = useMemo(() => {
    if (!user?.firstName) return 'STU'
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

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative w-full"
    >
      <div className="retro-card-amber overflow-hidden relative border-amber-500/30">
        {/* Retro Top Terminal Bar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-500/20 font-mono text-2xs uppercase tracking-widest text-amber-500/80">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-amber-500 animate-pulse" />
            <span>SYS_WORKSTATION // SESSION_ACTIVE</span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span>[HOST: LOCAL]</span>
            <span>[NET: ONLINE]</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* User Greeting Block */}
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded border-2 border-amber-500/40 bg-amber-500/10 font-mono text-lg font-bold text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              {initials}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-amber-400 font-bold text-lg">&gt;</span>
                <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight text-white uppercase">
                  {greeting}, {user?.firstName || 'STUDENT'}
                </h1>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                <Calendar className="size-3.5 text-amber-500/70" />
                <span>{currentDate}</span>
                <span className="text-amber-500/50">|</span>
                <span className="text-amber-400/90 font-semibold">[STUDENT_ID: #{user?.id ? user.id.toString().substring(0,6) : '001'}]</span>
              </div>
            </div>
          </div>

          {/* CTA Resume Action Button */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 bg-amber-500/10 border-amber-500/50 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all duration-150 shadow-[2px_2px_0px_0px_rgba(245,158,11,0.4)]"
              onClick={() => navigate(dynamicContext.url)}
            >
              <Play className="size-3.5 fill-current" />
              <span>RESUME: {dynamicContext.title}</span>
            </Button>
          </div>
        </div>

        {/* Motivational Console Prompt Quote */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 font-mono text-xs text-slate-400">
          <Terminal className="size-3.5 text-amber-500 shrink-0" />
          <span className="text-amber-400 font-bold uppercase tracking-wider shrink-0">QUOTE.LOG &gt;</span>
          <span className="truncate italic text-slate-300">"{motivationalQuote}"</span>
        </div>
      </div>
    </motion.div>
  )
}
