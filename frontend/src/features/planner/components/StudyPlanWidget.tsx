import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Info,
  Play,
  Bot,
} from 'lucide-react'
import { usePlannerStore } from '../store/planner.store'
import { plannerApi, type PlannedStudySession } from '../api/planner.api'

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
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-800 text-base">Adaptive Study Planner</h3>
              {previewPlan && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-medium text-[10px] rounded-full uppercase tracking-wider">
                  Preview Mode
                </span>
              )}
              {currentPlan && currentPlan.status === 'ACTIVE' && !previewPlan && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-medium text-[10px] rounded-full uppercase tracking-wider flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 inline" />
                  <span>Active Plan</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Deterministic priority calculator & constraint-aware schedule engine
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Planner Settings & Availability"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {previewPlan ? (
            <>
              <button
                onClick={clearPreview}
                className="text-xs text-slate-600 hover:text-slate-800 font-medium px-3 py-2 rounded-lg border border-slate-200 transition-colors"
              >
                Discard Preview
              </button>
              <button
                onClick={handleSaveAndActivate}
                disabled={isGenerating}
                className="flex items-center space-x-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Activate Plan</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Calculating...' : 'Generate New Plan'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="text-red-500 hover:text-red-700 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Preferences Panel */}
      {showPreferences && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 text-xs">
          <h4 className="font-semibold text-slate-700 flex items-center space-x-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span>Planner Constraints & Preferences</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-600 mb-1">
                Daily Availability: <span className="text-indigo-600 font-bold">{availableMinutes} min/day</span>
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
                min="25"
                max="90"
                step="5"
                value={sessionLength}
                onChange={(e) => setSessionLength(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="text-[10px] text-slate-400">(Bounds: 25–90 min)</span>
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
            <button
              onClick={() => setShowPreferences(false)}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
            >
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

      {/* Capacity Warning Banner */}
      {activePlanToDisplay?.capacityWarning && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs space-y-1">
          <div className="flex items-center space-x-1.5 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Capacity Warning</span>
          </div>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            {activePlanToDisplay.capacityWarningMsg}
          </p>
        </div>
      )}

      {/* Plan Review Needed Banner */}
      {activePlanToDisplay?.needsReview && !previewPlan && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5 font-bold text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Study Plan May Need Review</span>
            </div>
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              {activePlanToDisplay.staleReason || 'New assessment evidence or topic mastery progress recorded. Update your plan to maintain optimal learning velocity.'}
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                await plannerApi.regeneratePlan()
                await fetchActiveOrLatestPlan()
              } catch {
                // Handled
              }
            }}
            className="shrink-0 flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Regenerate Plan</span>
          </button>
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
              Click &quot;Generate New Plan&quot; to calculate your personalized, topic-prioritized study schedule based on your mastery state, trends, and goals.
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
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                {session.sessionType}
                              </span>
                              {session.isManualOverride && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                                  Manual Override
                                </span>
                              )}
                            </div>

                            {/* Priority Reason Pill */}
                            <div className="relative group inline-block">
                              <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full inline-flex items-center space-x-1 cursor-help">
                                <Info className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span className="truncate max-w-xs">{session.priorityReason}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            <button
                              onClick={() => navigate(`/ai?topicId=${session.topicId}&mode=EXPLAIN`)}
                              className="inline-flex items-center space-x-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors"
                              title={`Study ${session.topicName} with Topic-Aware RAG AI Tutor`}
                            >
                              <Bot className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Study Topic</span>
                            </button>
                            <span className="font-bold text-slate-700">{session.recommendedMinutes} min</span>
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              Score: {Math.round(session.priorityScore * 1000) / 1000}
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
    </div>
  )
}
