import { useState, useEffect } from 'react'
import { useAcademicStore } from '../store/academic.store'
import { Play, Check, X, Clock, Activity } from '@/lib/icons'
import type { StudySessionType } from '@/types/academic'
import { toast } from 'sonner'

export function StudySessionWidget() {
  const {
    subjects,
    topics,
    activeSession,
    activeProgress,
    isLoading,
    fetchSubjects,
    fetchTopics,
    fetchActiveSession,
    startSession,
    completeSession,
    cancelSession,
    createManualSession,
    fetchTopicProgress,
  } = useAcademicStore()

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedTopicId, setSelectedTopicId] = useState<string>('')
  const [sessionType, setSessionType] = useState<StudySessionType>('STUDY')
  const [notes, setNotes] = useState<string>('')

  const [showManualModal, setShowManualModal] = useState(false)
  const [manualStart, setManualStart] = useState('')
  const [manualEnd, setManualEnd] = useState('')

  // Live timer elapsed seconds for UI display
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    fetchSubjects()
    fetchActiveSession()
  }, [])

  useEffect(() => {
    if (selectedSubjectId) {
      fetchTopics(selectedSubjectId)
    }
  }, [selectedSubjectId])

  useEffect(() => {
    if (selectedTopicId) {
      fetchTopicProgress(selectedTopicId)
    }
  }, [selectedTopicId])

  // Live optimistic timer update (Server timestamp remains source of truth upon completion)
  useEffect(() => {
    if (!activeSession || !activeSession.startedAt) {
      setElapsedSeconds(0)
      return
    }

    const startTime = new Date(activeSession.startedAt).getTime()

    const updateTimer = () => {
      const now = Date.now()
      const diff = Math.max(0, Math.floor((now - startTime) / 1000))
      setElapsedSeconds(diff)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [activeSession])

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    const hrs = Math.floor(mins / 60)
    const displayMins = mins % 60

    if (hrs > 0) {
      return `${hrs}h ${displayMins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`
    }
    return `${displayMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = async () => {
    if (!selectedTopicId) {
      toast.error('Please select an academic topic first.')
      return
    }

    try {
      await startSession({
        topicId: selectedTopicId,
        sessionType,
        notes,
      })
      toast.success('Study session started!')
    } catch (e: any) {
      toast.error(e.message || 'Failed to start session')
    }
  }

  const handleComplete = async () => {
    if (!activeSession) return
    try {
      const res = await completeSession(activeSession.id, { notes })
      toast.success(`Study session completed! Recorded ${res.durationMinutes} minutes.`)
      setNotes('')
    } catch (e: any) {
      toast.error(e.message || 'Failed to complete session')
    }
  }

  const handleCancel = async () => {
    if (!activeSession) return
    try {
      await cancelSession(activeSession.id)
      toast.info('Study session cancelled.')
      setNotes('')
    } catch (e: any) {
      toast.error(e.message || 'Failed to cancel session')
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTopicId || !manualStart || !manualEnd) {
      toast.error('Please fill in all required fields for past study recording.')
      return
    }

    try {
      const startIso = new Date(manualStart).toISOString()
      const endIso = new Date(manualEnd).toISOString()

      const res = await createManualSession({
        topicId: selectedTopicId,
        sessionType,
        startedAt: startIso,
        endedAt: endIso,
        notes,
      })

      toast.success(`Past study recorded! Added ${res.durationMinutes} minutes.`)
      setShowManualModal(false)
      setNotes('')
    } catch (e: any) {
      toast.error(e.message || 'Failed to record manual session')
    }
  }

  const topicList = selectedSubjectId ? topics[selectedSubjectId] || [] : []

  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Clock className="size-4 text-primary" />
          <span>Academic Study Session</span>
        </div>

        {activeSession && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Active Session
          </span>
        )}
      </div>

      {/* ACTIVE SESSION VIEW */}
      {activeSession ? (
        <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                {activeSession.subjectName || 'Academic Subject'}
              </span>
              <h4 className="text-base font-semibold text-foreground">
                {activeSession.topicName || 'Active Topic'}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Type: {activeSession.sessionType}</span>
              <div className="text-2xl font-bold font-mono text-primary tracking-tight">
                {formatTimer(elapsedSeconds)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Session Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. Completed deadlock detection algorithm practice"
              className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
            <a
              href={`/ai?topicId=${activeSession.topicId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors"
            >
              <Activity className="size-3.5 text-indigo-600" />
              <span>Need Help? Open Tutor</span>
            </a>

            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-medium transition-colors"
              >
                <X className="size-3.5" />
                <span>Cancel</span>
              </button>

              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-sm transition-colors"
              >
                <Check className="size-3.5" />
                <span>Complete Session</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* START NEW SESSION FORM */
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value)
                  setSelectedTopicId('')
                }}
                className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select Subject...</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} {sub.code ? `(${sub.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Topic</label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                disabled={!selectedSubjectId}
                className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
              >
                <option value="">Select Topic...</option>
                {topicList.map((top) => (
                  <option key={top.id} value={top.id}>
                    {top.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Session Type</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as StudySessionType)}
                className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="STUDY">STUDY</option>
                <option value="REVISION">REVISION</option>
                <option value="PRACTICE">PRACTICE</option>
                <option value="READING">READING</option>
                <option value="VIDEO">VIDEO</option>
                <option value="ASSIGNMENT">ASSIGNMENT</option>
                <option value="MOCK_TEST">MOCK TEST</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Session goal or topic focus"
                className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* TOPIC PROGRESS SUMMARY (Factual Historical Data Only) */}
          {selectedTopicId && activeProgress && (
            <div className="bg-muted/40 p-3 rounded-lg border border-border/40 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Activity className="size-3.5 text-primary" />
                <span className="font-medium text-foreground">Topic Progress:</span>
              </div>
              <div className="flex gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Total Study: </span>
                  <span className="font-semibold text-foreground">{activeProgress.totalStudyMinutes} mins</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sessions: </span>
                  <span className="font-semibold text-foreground">{activeProgress.sessionCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Length: </span>
                  <span className="font-semibold text-foreground">{activeProgress.averageSessionMinutes} mins</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setShowManualModal(true)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              + Record past study
            </button>

            <button
              onClick={handleStart}
              disabled={isLoading || !selectedTopicId}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              <Play className="size-3.5 fill-current" />
              <span>Start Session</span>
            </button>
          </div>
        </div>
      )}

      {/* MANUAL ENTRY MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="w-full max-w-md bg-card border border-border p-5 rounded-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h3 className="font-semibold text-sm">Record Past Study Session</h3>
              <button onClick={() => setShowManualModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Time</label>
                <input
                  type="datetime-local"
                  value={manualStart}
                  onChange={(e) => setManualStart(e.target.value)}
                  required
                  className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">End Time</label>
                <input
                  type="datetime-local"
                  value={manualEnd}
                  onChange={(e) => setManualEnd(e.target.value)}
                  required
                  className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
