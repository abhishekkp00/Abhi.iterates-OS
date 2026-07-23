import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAnalyticsQuery } from '@/features/analytics/hooks/useAnalytics'
import { useResourcesListQuery } from '@/features/resources/hooks/useResources'
import { useTasks } from '@/features/productivity/hooks/useTasks'
import { DashboardHero } from '@/features/dashboard/components/DashboardHero'
import { QuickActions } from '@/features/dashboard/components/QuickActions'
import { OverviewStats } from '@/features/dashboard/components/OverviewStats'
import { PlannerPreview } from '@/features/dashboard/components/PlannerPreview'
import { RecentResourcesPreview } from '@/features/dashboard/components/RecentResourcesPreview'
import { AiWorkspacePreview } from '@/features/dashboard/components/AiWorkspacePreview'
import { StudyStreakCalendar } from '@/features/dashboard/components/StudyStreakCalendar'
import { staggerParentVariants, staggerChildVariants } from '@/lib/animations'

export default function DashboardPage() {
  // Fetch weekly analytics (7 days range)
  const { data: analyticsData } = useAnalyticsQuery(7)
  const { data: resourcesData } = useResourcesListQuery({ page: 1, size: 1 })
  const { tasks } = useTasks()

  // Compute streak dynamically based on active user completed tasks/activity
  const streak = useMemo(() => {
    const completedCount = tasks.filter((t: any) => t.status === 'COMPLETED').length
    if (completedCount === 0) return 0
    return Math.min(completedCount, 7) // dynamic active streak based on completed tasks
  }, [tasks])

  const stats = {
    completedTasks: analyticsData?.completedTasks ?? tasks.filter((t: any) => t.status === 'COMPLETED').length,
    taskCompletionRate: analyticsData?.taskCompletionRate ?? 0.0,
    totalStudyHours: analyticsData?.totalStudyHours ?? 0.0,
    totalAiTokens: analyticsData?.totalAiTokens ?? 0,
    activeListings: analyticsData?.activeListings ?? 0,
    streak,
    totalResources: resourcesData?.totalElements ?? 0,
  }

  return (
    <div className="page-container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={staggerParentVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Row 1: Greeting Hero (Full Width) */}
        <motion.div variants={staggerChildVariants}>
          <DashboardHero />
        </motion.div>

        {/* Row 2: Quick Navigation Actions (Full Width) */}
        <motion.div variants={staggerChildVariants}>
          <QuickActions />
        </motion.div>

        {/* Row 3: Overview Statistics Cards (Full Width) */}
        <motion.div variants={staggerChildVariants}>
          <OverviewStats stats={stats} chartData={analyticsData?.chartData || []} />
        </motion.div>

        {/* Row 4: Widget Previews Split Layout (Grid) */}
        <motion.div
          variants={staggerChildVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Left Column: Agenda + Recent Resources Previews (Spans 2 columns on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            <PlannerPreview />
            <RecentResourcesPreview />
          </div>

          {/* Right Column: AI Workspace + Streak Calendar */}
          <div className="space-y-6">
            <AiWorkspacePreview />
            <StudyStreakCalendar />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
