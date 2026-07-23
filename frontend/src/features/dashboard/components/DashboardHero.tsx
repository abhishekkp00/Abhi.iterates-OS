import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useResourcesListQuery } from '@/features/resources/hooks/useResources'
import { useTasks } from '@/features/productivity/hooks/useTasks'
import { Calendar, Play, Sparkles } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface DashboardHeroProps {
  lastActiveContext?: {
    title: string
    url: string
  }
}

export function DashboardHero({ lastActiveContext }: DashboardHeroProps) {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  // Fetch recent resource & tasks to dynamically set the "Resume" button context
  const { data: resourcesData } = useResourcesListQuery({ page: 1, size: 1, sort: 'createdAt,desc' })
  const { tasks } = useTasks()

  // Dynamic greeting based on current local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  // Formatted date string
  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }, [])

  // Motivational quote pool
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

  // Avatar initials
  const initials = useMemo(() => {
    if (!user?.firstName) return 'U'
    const first = user.firstName.charAt(0).toUpperCase()
    const last = user.lastName ? user.lastName.charAt(0).toUpperCase() : ''
    return `${first}${last}`
  }, [user])

  // Compute dynamic resume context
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
      transition={{ duration: 0.4 }}
      className="relative w-full"
    >
      <Card className="overflow-hidden border border-border/60 bg-gradient-to-r from-card via-card/95 to-card/90 backdrop-blur-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* User Greeting block */}
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary border border-primary/20 shadow-inner">
                {initials}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                    {greeting}, {user?.firstName || 'Student'}!
                  </h1>
                  <Sparkles className="size-4 text-amber-500 animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Calendar className="size-3.5" />
                  <span>{currentDate}</span>
                </div>
              </div>
            </div>

            {/* CTA Button block */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Continue where left off button */}
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-background hover:bg-muted"
                onClick={() => navigate(dynamicContext.url)}
              >
                <Play className="size-3 fill-current" />
                <span>Resume: {dynamicContext.title}</span>
              </Button>
            </div>

          </div>

          {/* Motivational Quote row */}
          <div className="mt-5 pt-4 border-t border-border/40 flex items-center gap-2 text-xs text-muted-foreground italic font-medium">
            <span className="text-primary font-bold">Daily Quote:</span>
            <span>"{motivationalQuote}"</span>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  )
}
