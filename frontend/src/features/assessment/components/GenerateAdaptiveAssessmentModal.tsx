import React, { useState, useEffect } from 'react'
import { Sparkles, Brain, Loader2, AlertCircle, X } from 'lucide-react'
import { assessmentApi } from '../api/assessment.api'
import { academicApi } from '@/features/academic/api/academic.api'
import type { AcademicSubject, AcademicTopic } from '@/types/academic'

interface GenerateAdaptiveAssessmentModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerated: (assessmentId: string) => void
  preselectedTopicId?: string
}

export const GenerateAdaptiveAssessmentModal: React.FC<GenerateAdaptiveAssessmentModalProps> = ({
  isOpen,
  onClose,
  onGenerated,
  preselectedTopicId,
}) => {
  const [subjects, setSubjects] = useState<AcademicSubject[]>([])
  const [topics, setTopics] = useState<AcademicTopic[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedTopicId, setSelectedTopicId] = useState<string>(preselectedTopicId || '')
  const [questionCount, setQuestionCount] = useState<number>(5)
  const [includeResources, setIncludeResources] = useState<boolean>(true)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadSubjects()
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedSubjectId) {
      loadTopics(selectedSubjectId)
    } else {
      setTopics([])
    }
  }, [selectedSubjectId])

  useEffect(() => {
    if (preselectedTopicId) {
      setSelectedTopicId(preselectedTopicId)
    }
  }, [preselectedTopicId])

  const loadSubjects = async () => {
    try {
      const data = await academicApi.getSubjects()
      setSubjects(data)
      if (data && data.length > 0 && data[0] && !selectedSubjectId) {
        setSelectedSubjectId(data[0].id)
      }
    } catch (err: any) {
      setError('Failed to load academic subjects.')
    }
  }

  const loadTopics = async (subjectId: string) => {
    try {
      const data = await academicApi.getTopicsBySubject(subjectId)
      setTopics(data)
    } catch (err: any) {
      setTopics([])
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTopicId) {
      setError('Please select a topic for the assessment.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const result = await assessmentApi.generateAdaptiveAssessment({
        topicId: selectedTopicId,
        subjectId: selectedSubjectId || undefined,
        questionCount,
        includeResources,
      })

      setIsGenerating(false)
      onGenerated(result.id)
      onClose()
    } catch (err: any) {
      setIsGenerating(false)
      setError(err?.response?.data?.message || err?.message || 'Failed to generate adaptive assessment.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">AI Adaptive Assessment</h2>
              <p className="text-xs text-muted-foreground">Synthesize questions tailored to your learning state</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleGenerate} className="mt-4 space-y-4">
          {/* Subject Selection */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Academic Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value)
                setSelectedTopicId('')
              }}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          {/* Topic Selection */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Target Topic</label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Select a Topic --</option>
              {topics.map((top) => (
                <option key={top.id} value={top.id}>
                  {top.name}
                </option>
              ))}
            </select>
          </div>

          {/* Question Count & RAG Toggle */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Number of Questions</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={3}>3 Questions (Quick Check)</option>
                <option value={5}>5 Questions (Standard)</option>
                <option value={10}>10 Questions (Comprehensive)</option>
                <option value={15}>15 Questions (Exam Practice)</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeResources}
                  onChange={(e) => setIncludeResources(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span>Ground in My Uploaded Notes</span>
              </label>
            </div>
          </div>

          {/* Adaptive Blueprint Callout */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Brain className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              The blueprint engine will analyze your topic mastery level and prior test performance to automatically calibrate question difficulty.
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-input bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || !selectedTopicId}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Test</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
