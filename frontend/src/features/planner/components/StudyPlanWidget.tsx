import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  Info,
  Bot,
  BarChart2,
  BookOpen,
  X,
} from 'lucide-react'
import { usePlannerStore } from '../store/planner.store'
import { plannerApi, type PlannedStudySession, type TopicPriorityBreakdown } from '../api/planner.api'
import { GenerateAdaptiveAssessmentModal } from '@/features/assessment/components/GenerateAdaptiveAssessmentModal'

export function StudyPlanWidget() {
  const navigate = useNavigate()
  const {
    currentPlan,
    previewPlan,
    preferences,
    isLoadingPlan,
    isGenerating,
    error,
    fetchActiveOrLatestPlan,
    fetchPreferences,
    updatePreferences,
    generatePreview,
    saveDraft,
    activatePlan,
    clearPreview,
    clearError,
  } = usePlannerStore()

  const [showPreferences, setShowPreferences] = useState(false)
  const [availableMinutes, setAvailableMinutes] = useState(120)
  const [sessionLength, setSessionLength] = useState(45)
  const [horizonDays, setHorizonDays] = useState(7)

  // Plan Inspector Modal
  const [showInspector, setShowInspector] = useState(false)
  const [breakdown, setBreakdown] = useState<TopicPriorityBreakdown[]>([])
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false)

  // AI Assessment Modal Deep-Link
  const [selectedAssessmentTopicId, setSelectedAssessmentTopicId] = useState<string | null>(null)

  useEffect(() => {
    fetchActiveOrLatestPlan()
    fetchPreferences()
  }, [])

  useEffect(() => {
    if (preferences) {
      setAvailableMinutes(preferences.availableMinutesPerDay)
      setSessionLength(preferences.preferredSessionLengthMinutes)
      setHorizonDays(preferences.planningHorizonDays)
    }
  }, [preferences])

  const handleGenerate = async () => {
    clearError()
    try {
      await generatePreview({
        availableMinutesPerDay: availableMinutes,
        preferredSessionLengthMinutes: sessionLength,
        planningHorizonDays: horizonDays,
      })
    } catch {
      // Handled in store
    }
  }

  const handleSaveAndActivate = async () => {
    try {
      const draft = await saveDraft({
        availableMinutesPerDay: availableMinutes,
        preferredSessionLengthMinutes: sessionLength,
        planningHorizonDays: horizonDays,
      })
      if (draft.id) {
        await activatePlan(draft.id)
      }
    } catch {
      // Handled in store
    }
  }

  const handleSavePreferences = async () => {
    await updatePreferences({
      availableMinutesPerDay: availableMinutes,
      preferredSessionLengthMinutes: sessionLength,
      planningHorizonDays: horizonDays,
    })
    setShowPreferences(false)
  }

  const handleOpenInspector = async () => {
    if (!activePlanToDisplay?.id) return
    setIsLoadingBreakdown(true)
    setShowInspector(true)
    try {
      const data = await plannerApi.getPriorityBreakdown(activePlanToDisplay.id)
      setBreakdown(data)
    } catch (err) {
      setBreakdown([])
    } finally {
      setIsLoadingBreakdown(false)
    }
  }

  const activePlanToDisplay = previewPlan || currentPlan

  // Group sessions by day
  const sessionsByDay: Record<number, PlannedStudySession[]> = {}
  if (activePlanToDisplay?.sessions) {
    for (const session of activePlanToDisplay.sessions) {
      const dayArr = sessionsByDay[session.dayNumber] || []
      dayArr.push(session)
      sessionsByDay[session.dayNumber] = dayArr
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-800">Adaptive Learning Engine</h2>
              {activePlanToDisplay && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activePlanToDisplay.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activePlanToDisplay.status === 'DRAFT'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {previewPlan ? 'PREVIEW' : activePlanToDisplay.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Deterministic time allocation grounded in mastery evidence, upcoming exams, and prerequisite dependencies.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          {activePlanToDisplay?.id && (
            <button
              onClick={handleOpenInspector}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center space-x-1.5"
            >
              <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Inspect Factors</span>
            </button>
          )}

          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="p-2 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            title="Planner Preferences"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {previewPlan ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={clearPreview}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg"
              >
                Discard
              </button>
              <button
                onClick={handleSaveAndActivate}
                disabled={isGenerating}
                className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save & Activate</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Calculating...' : 'Regenerate Plan'}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-rose-500 hover:text-rose-700 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Preferences Drawer */}
      {showPreferences && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
          <h3 className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
            Planner Preferences & Availability Constraints
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-600 mb-1">
                Daily Study Time: <span className="text-indigo-600 font-bold">{availableMinutes} min</span>
              </label>
              <input
                type="range"
                min="30"
                max="480"
                step="15"
                value={availableMinutes}
                onChange={(e) => setAvailableMinutes(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="text-[10px] text-slate-400">({Math.round((availableMinutes / 60) * 10) / 10} hours/day)</span>
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">
                Preferred Session: <span className="text-indigo-600 font-bold">{sessionLength} min</span>
              </label>
              <input
                type="range"
                min="20"
                max="60"
                step="5"
                value={sessionLength}
                onChange={(e) => setSessionLength(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="text-[10px] text-slate-400">(Bounds: 20–60 min)</span>
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">
                Planning Horizon: <span className="text-indigo-600 font-bold">{horizonDays} days</span>
              </label>
              <select
                value={horizonDays}
                onChange={(e) => setHorizonDays(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
              >
                <option value={3}>3 Days</option>
                <option value={7}>7 Days (1 Week)</option>
                <option value={14}>14 Days (2 Weeks)</option>
                <option value={30}>30 Days (1 Month)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-1">
            <button onClick={() => setShowPreferences(false)} className="px-3 py-1.5 text-slate-600 hover:text-slate-800">
              Cancel
            </button>
            <button
              onClick={handleSavePreferences}
              className="bg-slate-800 hover:bg-slate-900 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoadingPlan ? (
        <div className="text-xs text-slate-400 text-center py-8">Loading study plan...</div>
      ) : !activePlanToDisplay ? (
        <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl space-y-3">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700">No Active Study Plan</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click &quot;Generate Study Plan&quot; to calculate your personalized, topic-prioritized study schedule.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Study Plan</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Plan Meta Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {activePlanToDisplay.planStartDate} → {activePlanToDisplay.planEndDate} ({activePlanToDisplay.planningHorizonDays} days)
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  <strong>{activePlanToDisplay.totalPlannedMinutes}</strong> / {activePlanToDisplay.totalAvailableMinutes} min planned
                </span>
              </div>
            </div>

            <span className="text-[11px] text-slate-400">
              {activePlanToDisplay.sessions?.length || 0} total sessions
            </span>
          </div>

          {/* Sessions Grouped by Day */}
          <div className="space-y-4">
            {Object.keys(sessionsByDay)
              .map(Number)
              .sort((a, b) => a - b)
              .map((dayNum) => {
                const daySessions = sessionsByDay[dayNum] || []
                const dayTotalMin = daySessions.reduce((acc, s) => acc + s.recommendedMinutes, 0)

                return (
                  <div key={dayNum} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
                      <span>Day {dayNum}</span>
                      <span className="text-slate-400 font-normal">{dayTotalMin} min</span>
                    </div>

                    <div className="space-y-2">
                      {daySessions.map((session) => (
                        <div
                          key={session.id || `${session.topicId}-${session.displayOrder}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-xs transition-all text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-slate-800">{session.topicName}</span>
                              <span className="text-[10px] text-slate-400">({session.subjectName})</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                                {session.sessionType || 'STUDY'}
                              </span>
                              {session.isManualOverride && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                                  Manual Override
                                </span>
                              )}
                            </div>

                            {/* Priority Reason Pill */}
                            <div className="relative group inline-block">
                              <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
                                <Info className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span className="truncate max-w-xs">{session.priorityReason}</span>
                              </span>
                            </div>
                          </div>

                          {/* Strategy Deep-Link Buttons */}
                          <div className="flex items-center space-x-2 shrink-0">
                            {session.sessionType === 'PRACTICE' || session.sessionType === 'ASSIGNMENT' ? (
                              <button
                                onClick={() => setSelectedAssessmentTopicId(session.topicId)}
                                className="inline-flex items-center space-x-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Take Practice Test</span>
                              </button>
                            ) : session.sessionType === 'READING' ? (
                              <button
                                onClick={() => navigate(`/ai?topicId=${session.topicId}&mode=EXPLAIN`)}
                                className="inline-flex items-center space-x-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-lg border border-amber-200 transition-colors"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                                <span>Prerequisite Review</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => navigate(`/ai?topicId=${session.topicId}&mode=EXPLAIN`)}
                                className="inline-flex items-center space-x-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors"
                              >
                                <Bot className="w-3.5 h-3.5 text-indigo-600" />
                                <span>RAG Tutor</span>
                              </button>
                            )}

                            <span className="font-bold text-slate-700">{session.recommendedMinutes} min</span>
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              Score: {Math.round(session.priorityScore * 100) / 100}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Plan Inspector Modal */}
      {showInspector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Topic Priority Engine Factors</h2>
                  <p className="text-xs text-muted-foreground">Transparent multi-component breakdown used for deterministic allocation</p>
                </div>
              </div>
              <button onClick={() => setShowInspector(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoadingBreakdown ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Calculating breakdown factors...</div>
            ) : breakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No topic factors found.</div>
            ) : (
              <div className="space-y-4">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Topic</th>
                      <th className="p-2.5">State</th>
                      <th className="p-2.5">Weakness</th>
                      <th className="p-2.5">Exam</th>
                      <th className="p-2.5">Trend</th>
                      <th className="p-2.5">Recency</th>
                      <th className="p-2.5">Prereq</th>
                      <th className="p-2.5">Raw Score</th>
                      <th className="p-2.5 rounded-r-lg">Strategy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {breakdown.map((item) => (
                      <tr key={item.topicId} className="hover:bg-accent/50">
                        <td className="p-2.5 font-bold text-foreground">
                          {item.topicName}
                          <span className="block text-[10px] font-normal text-muted-foreground">{item.subjectName}</span>
                        </td>
                        <td className="p-2.5 font-medium">{item.learningState}</td>
                        <td className="p-2.5 font-mono">{Math.round(item.weaknessFactor * 100)}%</td>
                        <td className="p-2.5 font-mono">{Math.round(item.examUrgencyFactor * 100)}%</td>
                        <td className="p-2.5 font-mono">{Math.round(item.trendFactor * 100)}%</td>
                        <td className="p-2.5 font-mono">{Math.round(item.recencyFactor * 100)}%</td>
                        <td className="p-2.5 font-mono">{Math.round(item.prerequisiteImportanceFactor * 100)}%</td>
                        <td className="p-2.5 font-bold text-primary font-mono">{(item.rawScore).toFixed(2)}</td>
                        <td className="p-2.5 font-semibold text-indigo-600">{item.recommendedStrategy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adaptive Assessment Modal */}
      {selectedAssessmentTopicId && (
        <GenerateAdaptiveAssessmentModal
          isOpen={!!selectedAssessmentTopicId}
          onClose={() => setSelectedAssessmentTopicId(null)}
          preselectedTopicId={selectedAssessmentTopicId}
          onGenerated={(assessmentId) => {
            setSelectedAssessmentTopicId(null)
            navigate(`/academic/assessments/${assessmentId}`)
          }}
        />
      )}
    </div>
  )
}
