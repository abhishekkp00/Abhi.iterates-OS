import { useEffect, useState } from 'react'
import { useAssessmentStore } from '../store/assessment.store'
import { AssessmentRunnerWidget } from './AssessmentRunnerWidget'
import { Plus, Award, Play, BookOpen, Clock, FileText } from '@/lib/icons'

interface AssessmentManagerWidgetProps {
  subjectId?: string
}

export function AssessmentManagerWidget({ subjectId }: AssessmentManagerWidgetProps) {
  const {
    assessments,
    isLoading,
    fetchAssessments,
    createAssessment,
    publishAssessment,
    addQuestion,
    loadAssessmentRunner,
  } = useAssessmentStore()

  const [activeRunnerId, setActiveRunnerId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddQuestionModal, setShowAddQuestionModal] = useState<string | null>(null)

  // Form states for creating assessment
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newDuration, setNewDuration] = useState('30')

  // Form states for adding question
  const [qText, setQText] = useState('')
  const [qMarks, setQMarks] = useState('1')
  const [opt1, setOpt1] = useState('')
  const [opt2, setOpt2] = useState('')
  const [opt3, setOpt3] = useState('')
  const [opt4, setOpt4] = useState('')
  const [correctIndex, setCorrectIndex] = useState(0)

  useEffect(() => {
    fetchAssessments()
  }, [fetchAssessments])

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    try {
      await createAssessment({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        durationMinutes: parseInt(newDuration, 10) || 30,
        subjectId: subjectId || undefined,
      })
      setNewTitle('')
      setNewDesc('')
      setShowCreateModal(false)
    } catch (e) {
      // Error handled in store
    }
  }

  const handleAddQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showAddQuestionModal || !qText.trim() || !opt1.trim() || !opt2.trim()) return

    const options = [
      { optionText: opt1.trim(), optionOrder: 1, isCorrect: correctIndex === 0 },
      { optionText: opt2.trim(), optionOrder: 2, isCorrect: correctIndex === 1 },
    ]

    if (opt3.trim()) {
      options.push({ optionText: opt3.trim(), optionOrder: 3, isCorrect: correctIndex === 2 })
    }
    if (opt4.trim()) {
      options.push({ optionText: opt4.trim(), optionOrder: 4, isCorrect: correctIndex === 3 })
    }

    try {
      await addQuestion(showAddQuestionModal, {
        questionText: qText.trim(),
        marks: parseFloat(qMarks) || 1,
        questionOrder: 1, // Store auto-increments or appends
        options,
      })
      setQText('')
      setOpt1('')
      setOpt2('')
      setOpt3('')
      setOpt4('')
      setShowAddQuestionModal(null)
    } catch (e) {
      // Error handled in store
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await publishAssessment(id)
    } catch (e) {
      // Error handled in store
    }
  }

  const handleStartRunner = async (id: string) => {
    await loadAssessmentRunner(id)
    setActiveRunnerId(id)
  }

  if (activeRunnerId) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setActiveRunnerId(null)}
          className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          ← Back to Assessment Bank
        </button>
        <AssessmentRunnerWidget assessmentId={activeRunnerId} onClose={() => setActiveRunnerId(null)} />
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-card p-5 shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="size-5 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Academic Assessment Engine</h3>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="size-3.5" />
          <span>New Assessment</span>
        </button>
      </div>

      {/* ASSESSMENTS LIST */}
      {isLoading && assessments.length === 0 ? (
        <div className="text-center py-8 text-xs text-muted-foreground">Loading assessments...</div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border/60 rounded-lg text-xs text-muted-foreground space-y-1">
          <BookOpen className="size-6 text-muted-foreground mx-auto mb-1 opacity-50" />
          <p className="font-medium text-foreground">No assessments created yet.</p>
          <p>Create your first assessment package to test topic knowledge performance.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assessments.map((a) => {
            const isPublished = a.status === 'PUBLISHED'

            return (
              <div
                key={a.id}
                className="p-4 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-foreground line-clamp-1">{a.title}</h4>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isPublished
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>

                  {a.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{a.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="size-3" />
                      {a.questionCount} Qs
                    </span>
                    {a.durationMinutes && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {a.durationMinutes}m
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isPublished ? (
                      <>
                        <button
                          onClick={() => setShowAddQuestionModal(a.id)}
                          className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-[11px] font-medium hover:bg-secondary/80"
                        >
                          + Question
                        </button>
                        <button
                          onClick={() => handlePublish(a.id)}
                          disabled={a.questionCount === 0}
                          className="px-2 py-1 rounded bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 disabled:opacity-40"
                        >
                          Publish
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleStartRunner(a.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 text-white text-[11px] font-medium hover:bg-emerald-500 shadow-sm"
                      >
                        <Play className="size-3 fill-current" />
                        <span>Take Test</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CREATE ASSESSMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-card border border-border rounded-xl p-6 shadow-xl w-full max-w-md space-y-4"
          >
            <h3 className="text-sm font-bold text-foreground">Create New Assessment Package</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">Assessment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems Deadlocks Quiz"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short summary of knowledge domain tested..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                Create Package
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD QUESTION MODAL */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddQuestionSubmit}
            className="bg-card border border-border rounded-xl p-6 shadow-xl w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-sm font-bold text-foreground">Add Multiple-Choice Question</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">Question Prompt *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. What is the necessary condition for deadlock?"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Marks Available</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={qMarks}
                  onChange={(e) => setQMarks(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-2 border-t border-border/50 pt-2">
                <label className="block font-semibold text-foreground">
                  Options (Select radio for Correct Option) *
                </label>

                {[
                  { val: opt1, set: setOpt1, idx: 0, label: 'Option A *' },
                  { val: opt2, set: setOpt2, idx: 1, label: 'Option B *' },
                  { val: opt3, set: setOpt3, idx: 2, label: 'Option C (Optional)' },
                  { val: opt4, set: setOpt4, idx: 3, label: 'Option D (Optional)' },
                ].map((item) => (
                  <div key={item.idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOptionRadio"
                      checked={correctIndex === item.idx}
                      onChange={() => setCorrectIndex(item.idx)}
                      className="size-4 text-primary"
                    />
                    <input
                      type="text"
                      placeholder={item.label}
                      value={item.val}
                      onChange={(e) => item.set(e.target.value)}
                      className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setShowAddQuestionModal(null)}
                className="px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                Save Question
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
