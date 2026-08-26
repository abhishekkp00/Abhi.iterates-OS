import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Bot,
  Play,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Award,
  BarChart3,
  BookOpen,
  RefreshCw,
  Info,
} from '@/lib/icons'
import { academicApi, type AcademicDashboardData } from '@/features/academic/api/academic.api'
import { plannerApi } from '@/features/planner/api/planner.api'
import { GenerateAdaptiveAssessmentModal } from '@/features/assessment/components/GenerateAdaptiveAssessmentModal'
import { LoadingState } from '@/components/ui/feedback'
import { toast } from 'sonner'

export default function AcademicCommandCenterPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<AcademicDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)

  const loadDashboard = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await academicApi.getDashboardData()
      setData(res)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load academic dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const handleRegeneratePlan = async () => {
    setIsRegenerating(true)
    try {
      await plannerApi.regeneratePlan()
      toast.success('Study plan regenerated based on fresh evidence!')
      await loadDashboard()
    } catch {
      toast.error('Failed to regenerate study plan')
    } finally {
      setIsRegenerating(false)
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading Academic Command Center…" />
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto my-12 bg-white rounded-xl border border-slate-200 shadow-sm">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 text-base">Dashboard Load Failed</h3>
          <p className="text-xs text-slate-500">{error || 'Unable to retrieve academic workspace data.'}</p>
        </div>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const {
    todaySummary,
    todayPlanSummary,
    adherenceSummary,
    learningStateSummary,
    weakTopics,
    developingTopics,
    upcomingExams,
  } = data

  const todayPlan = data.todayPlan || todayPlanSummary
  const planAdherence = data.planAdherence || adherenceSummary
  const goals: any[] = data.goals || []
  const studyActivity: any = data.studyActivity || { totalStudyMinutes: 0, dailyActivity: [], studyConsistencyPercentage: 0, activeDaysCount: 0 }
  const recentAssessments: any[] = data.recentAssessments || []

  const nextSession = todayPlan?.nextSession

  return (
    <div className="page-container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* ── Top Header / Overview ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Academic Command Center</h1>
              <p className="text-xs text-slate-500">
                Data-driven decision support engine & real-time study velocity tracking
              </p>
            </div>
          </div>
        </div>

        {/* Factual Metric Chips */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-2.5">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-400 font-medium uppercase">Today</span>
              <span className="font-bold text-slate-800">{todaySummary.localDate}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-400 font-medium uppercase">Study Time Today</span>
              <span className="font-bold text-slate-800">
                {todaySummary.actualStudyMinutesToday} / {todaySummary.plannedMinutesToday} min
              </span>
            </div>
          </div>

          {todaySummary.nextExamTitle && todaySummary.daysToNextExam !== undefined && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="block text-[10px] text-amber-700 font-medium uppercase">Upcoming Exam</span>
                <span className="font-bold text-amber-900">
                  {todaySummary.nextExamTitle} ({todaySummary.daysToNextExam} days)
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate AI Test</span>
          </button>

          <button
            onClick={loadDashboard}
            className="p-3 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            title="Refresh Dashboard Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Plan Review Needed Warning Banner ─────────────────────────────── */}
      {todayPlan?.needsReview && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-amber-900 block">Your Study Plan May Need Updating</span>
              <span className="text-amber-700 text-[11px]">
                {todayPlan.staleReason || 'New assessment evidence recorded. Re-evaluate your schedule.'}
              </span>
            </div>
          </div>
          <button
            onClick={handleRegeneratePlan}
            disabled={isRegenerating}
            className="shrink-0 flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Plan'}</span>
          </button>
        </div>
      )}

      {/* ── Main Dashboard 2-Column Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Spans 2 columns on desktop): Next Action + Today's Plan + Weak Topics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Action: WHAT SHOULD I DO NOW? */}
          {nextSession ? (
            <div className="p-5 bg-indigo-900 text-white rounded-2xl shadow-md space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-indigo-800 text-indigo-200 font-bold text-[10px] uppercase tracking-wider rounded-md border border-indigo-700">
                  WHAT SHOULD I DO NOW?
                </span>
                <span className="text-xs text-indigo-300 font-medium">
                  Priority Score: {Math.round(nextSession.priorityScore * 1000) / 1000}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold">{nextSession.topicName}</h2>
                <p className="text-xs text-indigo-200">{nextSession.subjectName} • {nextSession.recommendedMinutes} min planned</p>
                <div className="mt-2 text-xs bg-indigo-950/60 p-2.5 rounded-lg border border-indigo-800 text-indigo-100 flex items-center space-x-2">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{nextSession.priorityReason}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => navigate(`/planner?action=start-session&topicId=${nextSession.topicId}&plannedSessionId=${nextSession.id}`)}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Session ({nextSession.recommendedMinutes} min)</span>
                </button>

                <button
                  onClick={() => navigate(`/ai?topicId=${nextSession.topicId}&mode=EXPLAIN`)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-800 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl border border-indigo-700 transition-colors"
                >
                  <Bot className="w-4 h-4 text-indigo-300" />
                  <span>Study with AI Tutor</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl space-y-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm">No Pending Sessions Today</h3>
              <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                You have completed all planned sessions or haven&apos;t generated an active study plan.
              </p>
              <button
                onClick={() => navigate('/planner')}
                className="inline-flex items-center space-x-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-colors mt-2"
              >
                <span>Open Planner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Today's Plan Timeline */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">Today&apos;s Planned Sessions</h3>
              </div>
              <button
                onClick={() => navigate('/planner')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Manage Plan →
              </button>
            </div>

            {!todayPlan?.sessions || todayPlan.sessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No active plan generated yet.</p>
            ) : (
              <div className="space-y-2.5">
                {todayPlan.sessions.map((session: any) => (
                  <div
                    key={session.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">{session.topicName}</span>
                        <span className="text-slate-400">({session.subjectName})</span>
                        {session.isCompleted && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold text-[10px] rounded-full">
                            Completed ({session.actualMinutes}m)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{session.priorityReason}</p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => navigate(`/ai?topicId=${session.topicId}&mode=EXPLAIN`)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-700 font-semibold border border-slate-200 rounded-lg text-xs"
                      >
                        Study Topic
                      </button>
                      <span className="font-bold text-slate-700">{session.recommendedMinutes} min</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weak Topics (Where am I struggling?) */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-sm">Weak Topics (Requires Review)</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">{weakTopics.length} topics</span>
            </div>

            {weakTopics.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No weak topics flagged! Keep up the good work.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {weakTopics.map((topic) => (
                  <div key={topic.topicId} className="p-3.5 border border-amber-200 bg-amber-50/50 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{topic.topicName}</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full uppercase">
                        WEAK
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p>Subject: {topic.subjectName}</p>
                      {topic.recentAveragePercentage !== undefined && (
                        <p>Score: <strong>{Math.round(topic.recentAveragePercentage)}%</strong> ({topic.trend})</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => navigate(`/ai?topicId=${topic.topicId}&mode=EXPLAIN`)}
                        className="flex-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] rounded-lg transition-colors text-center"
                      >
                        Study Topic
                      </button>
                      <button
                        onClick={() => navigate('/library')}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200 rounded-lg transition-colors text-center"
                      >
                        Assessment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Developing Topics */}
          {developingTopics.length > 0 && (
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Developing Topics</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">{developingTopics.length} topics</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {developingTopics.map((topic) => (
                  <div key={topic.topicId} className="p-3 border border-indigo-100 bg-indigo-50/30 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{topic.topicName}</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-semibold text-[10px] rounded-full uppercase">
                        DEVELOPING
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Score: {topic.recentAveragePercentage ? `${Math.round(topic.recentAveragePercentage)}%` : 'N/A'} • {topic.trend}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Learning State Distribution + Exams + Goals + Adherence + Activity */}
        <div className="space-y-6">
          {/* Learning State Distribution Bar */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Learning State Overview</span>
              </h3>
              <span className="text-xs text-slate-400">{learningStateSummary.totalTopics} total topics</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="block text-[10px] text-emerald-700 font-semibold uppercase">Strong</span>
                <span className="text-lg font-bold text-emerald-900">{learningStateSummary.strongCount}</span>
              </div>
              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                <span className="block text-[10px] text-indigo-700 font-semibold uppercase">Developing</span>
                <span className="text-lg font-bold text-indigo-900">{learningStateSummary.developingCount}</span>
              </div>
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="block text-[10px] text-amber-700 font-semibold uppercase">Weak</span>
                <span className="text-lg font-bold text-amber-900">{learningStateSummary.weakCount}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="block text-[10px] text-slate-500 font-semibold uppercase">No Data</span>
                <span className="text-lg font-bold text-slate-800">{learningStateSummary.insufficientDataCount}</span>
              </div>
            </div>
          </div>

          {/* Plan Adherence Meter */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Plan Adherence</span>
              </h3>
              <span className="text-xs font-bold text-indigo-600">{planAdherence.adherencePercentage}%</span>
            </div>

            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, planAdherence.adherencePercentage)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 flex justify-between">
                <span>{planAdherence.completedPlannedSessions} of {planAdherence.totalPlannedSessions} planned sessions completed</span>
              </p>
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Upcoming Exams</span>
              </h3>
              <span className="text-xs text-slate-400">{upcomingExams.length} scheduled</span>
            </div>

            {upcomingExams.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No upcoming exams scheduled.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingExams.map((exam) => (
                  <div key={exam.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{exam.title}</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-semibold text-[10px] rounded-full">
                        {exam.daysRemaining} days left
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Date: {exam.examDate} {exam.subjectName ? `• ${exam.subjectName}` : ''}</p>
                    <div className="text-[10px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-200/60">
                      <span>Topics: {exam.totalTopicsCount} | Coverage: {exam.assessmentCoveragePercentage}%</span>
                      <button
                        onClick={() => navigate(`/academic/exams/${exam.id}`)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Inspect Revision →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Goals */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Academic Goals</span>
              </h3>
              <span className="text-xs text-slate-400">{goals.length} active</span>
            </div>

            {goals.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No active goals configured.</p>
            ) : (
              <div className="space-y-2.5">
                {goals.map((goal: any) => (
                  <div key={goal.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{goal.topicName}</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-semibold text-[10px] rounded-full">
                        Target: {goal.targetState}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Due: {goal.targetDate} ({goal.daysRemaining} days left)</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Study Activity (Past 7 Days) */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Study Activity (7 Days)</span>
              </h3>
              <span className="text-xs font-bold text-slate-700">{studyActivity.totalStudyMinutes} min</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center pt-2">
              {studyActivity.dailyActivity.map((day: any) => (
                <div key={day.date} className="space-y-1">
                  <div className="h-16 bg-slate-100 rounded-lg flex flex-col justify-end p-0.5">
                    <div
                      className="bg-indigo-600 rounded-md transition-all"
                      style={{
                        height: `${Math.min(100, Math.max(10, (day.studyMinutes / 120) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="block text-[9px] text-slate-400 font-medium">{day.date.substring(5)}</span>
                  <span className="block text-[10px] font-bold text-slate-700">{day.studyMinutes}m</span>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
              <span>Consistency Rate:</span>
              <strong className="text-slate-800">{studyActivity.studyConsistencyPercentage}% ({studyActivity.activeDaysCount} / 7 days)</strong>
            </div>
          </div>

          {/* Recent Assessments */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Recent Assessments</span>
              </h3>
            </div>

            {recentAssessments.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No assessments completed yet.</p>
            ) : (
              <div className="space-y-2">
                {recentAssessments.map((a: any) => (
                  <div key={a.attemptId} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{a.assessmentTitle}</span>
                      <span className="text-[10px] text-slate-400">{new Date(a.submittedAt).toLocaleDateString()}</span>
                    </div>
                    <span className={`px-2 py-0.5 font-bold text-[10px] rounded-full ${a.percentage >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {Math.round(a.percentage)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <GenerateAdaptiveAssessmentModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerated={(assessmentId) => {
          toast.success('Adaptive Assessment generated and published!')
          loadDashboard()
          navigate(`/academic/assessments/${assessmentId}`)
        }}
      />
    </div>
  )
}
