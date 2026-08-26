import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Sparkles,
  BookOpen,
  ArrowLeft,
  Flame,
  ShieldCheck,
  BarChart3,
} from 'lucide-react'
import { academicApi, type ExamCoverageResponse, type ExamStudyPhase } from '@/features/academic/api/academic.api'
import { usePlannerStore } from '@/features/planner/store/planner.store'

const PHASES: { key: ExamStudyPhase; label: string; desc: string }[] = [
  { key: 'LEARNING', label: '1. Learning', desc: '> 21 days: Foundational concept study & prerequisites' },
  { key: 'PRACTICE', label: '2. Practice', desc: '14–21 days: Active problem solving & exercises' },
  { key: 'CONSOLIDATION', label: '3. Consolidation', desc: '7–14 days: Reinforce developing areas & practice tests' },
  { key: 'REVISION', label: '4. Revision', desc: '3–7 days: Error review, weak topic repair & active recall' },
  { key: 'FINAL_REVIEW', label: '5. Final Review', desc: '0–3 days: Key recall, summary review & high-priority fixes' },
]

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const generatePreview = usePlannerStore((s) => s.generatePreview)

  const [coverage, setCoverage] = useState<ExamCoverageResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    academicApi
      .getExamCoverage(id)
      .then((data) => {
        setCoverage(data)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to load exam coverage details')
        setIsLoading(false)
      })
  }, [id])

  const handleGenerateExamPlan = async () => {
    if (!id) return
    setIsGeneratingPlan(true)
    try {
      await generatePreview({ examId: id })
      navigate('/planner')
    } catch {
      // Handled in store
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-slate-400">
        Loading exam revision details...
      </div>
    )
  }

  if (error || !coverage) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm font-semibold text-rose-600">{error || 'Exam not found'}</p>
        <button
          onClick={() => navigate('/academic')}
          className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
        >
          Back to Academic Command Center
        </button>
      </div>
    )
  }

  const daysLabel =
    coverage.daysRemaining < 0
      ? 'Exam Date Passed'
      : coverage.daysRemaining === 0
      ? 'Exam Today!'
      : coverage.daysRemaining === 1
      ? 'Exam Tomorrow!'
      : `${coverage.daysRemaining} Days Remaining`

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/academic')}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Academic Command Center</span>
          </button>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{coverage.examTitle}</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                coverage.daysRemaining <= 3
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : coverage.daysRemaining <= 7
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}
            >
              {daysLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Date: {coverage.examDate}</span>
            <span>•</span>
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>{coverage.totalTopicsCount} Exam Topics</span>
          </p>
        </div>

        <button
          onClick={handleGenerateExamPlan}
          disabled={isGeneratingPlan}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isGeneratingPlan ? 'Building Plan...' : 'Generate Exam Study Plan'}</span>
        </button>
      </div>

      {/* Exam Phase Timeline Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Exam Revision Strategy Phase</h2>
          </div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
            Active Phase: {coverage.globalPhase}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
          {PHASES.map((p) => {
            const isActive = coverage.globalPhase === p.key
            return (
              <div
                key={p.key}
                className={`p-3 rounded-xl border transition-all text-xs space-y-1 ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-semibold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-xs">{p.label}</div>
                <div className={`text-[10px] ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>{p.desc}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Factual Coverage Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Study Coverage</span>
          <div className="text-2xl font-extrabold text-slate-900">{coverage.studyCoveragePercentage}%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, coverage.studyCoveragePercentage)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {coverage.studiedTopicsCount} of {coverage.totalTopicsCount} topics studied
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Assessment Coverage</span>
          <div className="text-2xl font-extrabold text-emerald-600">{coverage.assessmentCoveragePercentage}%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, coverage.assessmentCoveragePercentage)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {coverage.assessedTopicsCount} of {coverage.totalTopicsCount} topics assessed
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Weak Topics</span>
          <div className="text-2xl font-extrabold text-rose-600">{coverage.weakTopicsCount}</div>
          <p className="text-[11px] text-slate-400">Require priority repair during revision</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Developing / Strong</span>
          <div className="text-2xl font-extrabold text-slate-900">
            {coverage.developingTopicsCount} / {coverage.strongTopicsCount}
          </div>
          <p className="text-[11px] text-slate-400">Scheduled for practice & consolidation</p>
        </div>
      </div>

      {/* Non-Predictive Disclaimer */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center space-x-2">
        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>
          <strong>Factual Evidence Policy</strong>: Coverage metrics reflect factual study history and assessment attempt evidence. No predictive readiness scores or pass probability estimations are used.
        </span>
      </div>

      {/* Topic Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Exam Topic Strategy Breakdown</h2>
          </div>
          <span className="text-xs text-slate-400">{coverage.topicBreakdown.length} Topics</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Topic</th>
                <th className="p-3">Mastery State</th>
                <th className="p-3">Trend</th>
                <th className="p-3">Study Time</th>
                <th className="p-3">Accuracy</th>
                <th className="p-3">Recommended Strategy</th>
                <th className="p-3">Priority Score</th>
                <th className="p-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coverage.topicBreakdown.map((item) => (
                <tr key={item.topicId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-slate-800">
                    {item.topicName}
                    <span className="block text-[10px] font-normal text-slate-400">{item.subjectName}</span>
                  </td>
                  <td className="p-3 font-semibold">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${
                        item.learningState === 'WEAK'
                          ? 'bg-rose-100 text-rose-800'
                          : item.learningState === 'DEVELOPING'
                          ? 'bg-amber-100 text-amber-800'
                          : item.learningState === 'STRONG'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.learningState}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-600">{item.trend}</td>
                  <td className="p-3 font-mono">{item.studyMinutes} min</td>
                  <td className="p-3 font-mono">
                    {item.recentAccuracyPercentage != null ? `${Math.round(item.recentAccuracyPercentage)}%` : 'No test'}
                  </td>
                  <td className="p-3 font-bold text-indigo-600">{item.recommendedStrategy}</td>
                  <td className="p-3 font-mono font-bold text-slate-800">
                    {(item.priorityScore).toFixed(2)}
                  </td>
                  <td className="p-3 text-slate-500 max-w-xs truncate" title={item.reason}>
                    {item.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
