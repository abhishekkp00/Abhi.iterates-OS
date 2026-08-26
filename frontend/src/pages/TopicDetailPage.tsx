import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Brain,
  Sparkles,
  BarChart3,
  Play,
} from 'lucide-react'
import { academicApi, type LearningState, type LearningTrend } from '@/features/academic/api/academic.api'
import { assessmentApi } from '@/features/assessment/api/assessment.api'
import { GenerateAdaptiveAssessmentModal } from '@/features/assessment/components/GenerateAdaptiveAssessmentModal'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'

export function TopicDetailPage() {
  const { id: topicId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [topic, setTopic] = useState<any>(null)
  const [learningState, setLearningState] = useState<any>(null)
  const [topicPerformance, setTopicPerformance] = useState<any>(null)
  const [studySessions, setStudySessions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'assessments' | 'history'>('overview')

  useEffect(() => {
    if (!topicId) return

    async function loadTopicWorkspaceData() {
      setIsLoading(true)
      try {
        // Fetch topic details, learning state, and performance concurrently
        const [allTopics, stateData, perfData, sessionData] = await Promise.all([
          academicApi.getTopics(),
          academicApi.getTopicLearningState(topicId!).catch(() => null),
          assessmentApi.getTopicPerformance(topicId!).catch(() => null),
          academicApi.getUserSessions(0, 10).catch(() => ({ content: [] })),
        ])

        const matchedTopic = allTopics.find((t: any) => t.id === topicId)
        setTopic(matchedTopic || { id: topicId, name: 'Topic Workspace', description: 'Academic Topic Workspace' })
        setLearningState(stateData)
        setTopicPerformance(perfData)

        // Filter sessions for this topic
        const filteredSessions = (sessionData.content || []).filter((s: any) => s.topicId === topicId)
        setStudySessions(filteredSessions)
      } catch (err) {
        console.error('Failed to load topic workspace:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadTopicWorkspaceData()
  }, [topicId])

  if (isLoading) {
    return (
      <div className="page-container max-w-7xl mx-auto py-10 px-4 text-center">
        <div className="inline-block p-3 rounded-full bg-indigo-50 text-indigo-600 mb-3 animate-spin">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-600">Loading topic workspace...</p>
      </div>
    )
  }

  const state: LearningState = learningState?.state || 'INSUFFICIENT_DATA'
  const trend: LearningTrend = learningState?.trend || 'INSUFFICIENT_DATA'
  const recommendedStrategy = learningState?.recommendedStrategy || 'TARGETED_PRACTICE'

  const getStateBadge = (st: LearningState) => {
    switch (st) {
      case 'STRONG':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">STRONG</span>
      case 'DEVELOPING':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">DEVELOPING</span>
      case 'WEAK':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">WEAK</span>
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-full">INSUFFICIENT DATA</span>
    }
  }

  const getTrendBadge = (tr: LearningTrend) => {
    switch (tr) {
      case 'IMPROVING':
        return <span className="text-emerald-600 font-semibold">↑ Improving</span>
      case 'DECLINING':
        return <span className="text-rose-600 font-semibold">↓ Declining</span>
      case 'STABLE':
        return <span className="text-slate-600 font-semibold">→ Stable</span>
      default:
        return <span className="text-slate-400">No Trend</span>
    }
  }

  return (
    <div className="page-container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* ── Breadcrumbs Navigation ────────────────────────────────────────── */}
      <Breadcrumbs />

      {/* ── Header Card ───────────────────────────────────────────────────── */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md">
                {topic?.subjectName || 'Academic Topic'}
              </span>
              {getStateBadge(state)}
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{topic?.name}</h1>
            {topic?.description && (
              <p className="text-xs text-slate-500 max-w-2xl">{topic.description}</p>
            )}
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(`/ai?topicId=${topicId}`)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-xl transition-all"
            >
              <Brain className="w-4 h-4" />
              <span>Ask RAG Tutor</span>
            </button>

            <button
              onClick={() => setIsAssessmentModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Play className="w-4 h-4" />
              <span>Test Me (Assessment)</span>
            </button>
          </div>
        </div>

        {/* Factual Mastery Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
            <span className="text-[11px] text-slate-400 block font-medium">Learning State</span>
            <div className="font-bold text-slate-800 flex items-center space-x-1.5">
              <span>{state}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
            <span className="text-[11px] text-slate-400 block font-medium">Performance Trend</span>
            <div className="font-bold text-slate-800">
              {getTrendBadge(trend)}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
            <span className="text-[11px] text-slate-400 block font-medium">Total Study Time</span>
            <div className="font-bold text-slate-800">
              {learningState?.totalStudyMinutes || 0} min
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
            <span className="text-[11px] text-slate-400 block font-medium">Recent Test Accuracy</span>
            <div className="font-bold text-slate-800">
              {topicPerformance?.averagePercentage ? `${Math.round(topicPerformance.averagePercentage)}%` : 'No attempts'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recommended Strategy Banner ──────────────────────────────────── */}
      <div className="p-4 bg-indigo-900 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-800 rounded-xl shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
              Deterministic Planner Recommendation
            </div>
            <div className="text-sm font-bold">
              Strategy: {recommendedStrategy.replace('_', ' ')}
            </div>
            <div className="text-xs text-indigo-200">
              {learningState?.reason || `Topic is currently ${state}. Focus on active recall and problem practice.`}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAssessmentModalOpen(true)}
          className="px-4 py-2 bg-white text-indigo-950 font-bold text-xs rounded-xl hover:bg-indigo-50 shrink-0 transition-colors"
        >
          Execute Strategy →
        </button>
      </div>

      {/* ── Navigation Tabs ──────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 flex space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Overview & Performance
        </button>
        <button
          onClick={() => setActiveTab('assessments')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'assessments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Assessments & Evidence
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Study History ({studySessions.length})
        </button>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 text-xs">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Assessment Performance Summary</span>
            </h3>

            {topicPerformance ? (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-medium">Total Attempts</span>
                  <strong className="text-slate-800">{topicPerformance.totalAttempts || 0}</strong>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-medium">Questions Answered</span>
                  <strong className="text-slate-800">{topicPerformance.totalQuestionsAnswered || 0}</strong>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-medium">Accuracy</span>
                  <strong className="text-slate-800">{Math.round(topicPerformance.averagePercentage || 0)}%</strong>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 py-4 text-center">No assessment evidence recorded for this topic yet.</p>
            )}
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 text-xs">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
              <Brain className="w-4 h-4 text-indigo-600" />
              <span>Contextual RAG Tutor</span>
            </h3>

            <p className="text-slate-500 leading-relaxed">
              Launch the grounded AI Tutor to ask targeted questions about <strong>{topic?.name}</strong> using indexed PDF notes and academic resources.
            </p>

            <div className="pt-2">
              <button
                onClick={() => navigate(`/ai?topicId=${topicId}`)}
                className="w-full py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center space-x-2"
              >
                <Brain className="w-4 h-4" />
                <span>Open Topic-Aware RAG Chat →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assessments' && (
        <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Topic Assessments</h3>
            <button
              onClick={() => setIsAssessmentModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-500"
            >
              + Generate Adaptive Assessment
            </button>
          </div>

          <p className="text-slate-500">
            Generate customized assessments for <strong>{topic?.name}</strong> to evaluate your mastery and update your factual learning state.
          </p>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 text-xs">
          <h3 className="font-bold text-slate-800 text-sm">Recorded Study Sessions</h3>

          {studySessions.length === 0 ? (
            <p className="text-slate-400 py-4 text-center">No study sessions logged for this topic yet.</p>
          ) : (
            <div className="space-y-2">
              {studySessions.map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="font-bold text-slate-800 block">{session.sessionType || 'STUDY'}</span>
                    <span className="text-[10px] text-slate-400">{new Date(session.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <span className="font-mono text-slate-700 font-bold">{session.actualMinutes || session.durationMinutes || 30} min</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Generate Adaptive Assessment Modal ─────────────────────────────── */}
      <GenerateAdaptiveAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        onGenerated={(id) => navigate(`/assessments/${id}`)}
        preselectedTopicId={topicId}
      />
    </div>
  )
}
