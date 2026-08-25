import { useEffect, useState } from 'react'
import { Target, Plus, Calendar, AlertCircle, Trash2 } from 'lucide-react'
import { usePlannerStore } from '@/features/planner/store/planner.store'
import { useAcademicStore } from '@/features/academic/store/academic.store'
import type { AcademicTopic } from '@/types/academic'
import type { GoalTargetState } from '@/features/planner/api/planner.api'

export function AcademicGoalWidget() {
  const { subjects, topics, fetchSubjects, fetchTopics } = useAcademicStore()
  const { goals, isLoadingGoals, error, fetchGoals, createGoal, deactivateGoal, clearError } =
    usePlannerStore()

  const [isOpen, setIsOpen] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedTopicId, setSelectedTopicId] = useState<string>('')
  const [targetState, setTargetState] = useState<GoalTargetState>('STRONG')
  const [targetDate, setTargetDate] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchSubjects()
    fetchGoals()
  }, [])

  useEffect(() => {
    if (selectedSubjectId) {
      fetchTopics(selectedSubjectId)
    }
  }, [selectedSubjectId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!selectedTopicId) {
      setFormError('Please select a topic.')
      return
    }
    if (!targetDate) {
      setFormError('Please select a target deadline date.')
      return
    }

    setIsSubmitting(true)
    try {
      await createGoal({
        topicId: selectedTopicId,
        targetState,
        targetDate,
        description: description || undefined,
      })
      setIsOpen(false)
      setSelectedTopicId('')
      setDescription('')
      setTargetDate('')
    } catch (err: any) {
      setFormError(err.message || 'Failed to create goal.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentTopics = selectedSubjectId ? topics[selectedSubjectId] || [] : []

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-base">Academic Goals</h3>
            <p className="text-xs text-slate-500">
              Set deadline-driven targets to guide your study plan
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsOpen(!isOpen)
            clearError()
            setFormError(null)
          }}
          className="flex items-center space-x-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>

      {/* Error alert */}
      {(error || formError) && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError || error}</span>
        </div>
      )}

      {/* Create Modal Form */}
      {isOpen && (
        <form
          onSubmit={handleCreate}
          className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3"
        >
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            New Academic Goal
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value)
                  setSelectedTopicId('')
                }}
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a Subject...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Topic</label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                disabled={!selectedSubjectId}
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                <option value="">Select a Topic...</option>
                {currentTopics.map((t: AcademicTopic) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Target Mastery</label>
              <select
                value={targetState}
                onChange={(e) => setTargetState(e.target.value as GoalTargetState)}
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="STRONG">STRONG (Score ≥ 85%)</option>
                <option value="DEVELOPING">DEVELOPING (Score ≥ 75%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Target Deadline</label>
              <input
                type="date"
                value={targetDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes / Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Needs score for mid-term exam"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs px-3 py-1.5 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Set Goal'}
            </button>
          </div>
        </form>
      )}

      {/* Goal List */}
      {isLoadingGoals ? (
        <div className="text-xs text-slate-400 text-center py-3">Loading active goals...</div>
      ) : goals.length === 0 ? (
        <div className="text-xs text-slate-400 italic py-2 text-center border border-dashed border-slate-200 rounded-lg">
          No active academic goals set. Click &quot;Add Goal&quot; to set target deadlines for your topics.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {goals.map((goal) => {
            const isOverdue = goal.daysRemaining < 0
            const isUrgent = goal.daysRemaining >= 0 && goal.daysRemaining <= 7

            return (
              <div
                key={goal.id}
                className="flex items-start justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-slate-800">{goal.topicName}</span>
                    <span className="text-[10px] text-slate-500">({goal.subjectName})</span>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                      Target: {goal.targetState}
                    </span>
                    <span
                      className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        isOverdue
                          ? 'bg-red-100 text-red-800'
                          : isUrgent
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      <span>
                        {isOverdue
                          ? `Overdue (${Math.abs(goal.daysRemaining)}d)`
                          : `${goal.daysRemaining} days left`}
                      </span>
                    </span>
                  </div>

                  {goal.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-1">{goal.description}</p>
                  )}
                </div>

                <button
                  onClick={() => deactivateGoal(goal.id)}
                  title="Remove goal"
                  className="text-slate-400 hover:text-red-600 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
