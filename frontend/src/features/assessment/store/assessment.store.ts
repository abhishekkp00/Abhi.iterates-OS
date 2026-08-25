import { create } from 'zustand'
import { assessmentApi } from '../api/assessment.api'
import type {
  Assessment,
  Question,
  AssessmentAttempt,
  TopicPerformance,
  CreateAssessmentPayload,
  CreateQuestionPayload,
} from '@/types/assessment'

interface AssessmentState {
  assessments: Assessment[]
  activeAssessment: Assessment | null
  questions: Question[]
  activeAttempt: AssessmentAttempt | null
  submittedResult: AssessmentAttempt | null
  selectedAnswers: Record<string, string> // questionId -> selectedOptionId
  topicPerformance: Record<string, TopicPerformance>
  isLoading: boolean
  error: string | null

  fetchAssessments: () => Promise<void>
  createAssessment: (payload: CreateAssessmentPayload) => Promise<Assessment>
  publishAssessment: (id: string) => Promise<Assessment>
  addQuestion: (assessmentId: string, payload: CreateQuestionPayload) => Promise<void>
  loadAssessmentRunner: (assessmentId: string) => Promise<void>
  selectAnswer: (questionId: string, optionId: string) => void
  startAttempt: (assessmentId: string) => Promise<AssessmentAttempt>
  submitAttempt: () => Promise<AssessmentAttempt>
  fetchTopicPerformance: (topicId: string) => Promise<TopicPerformance>
  resetRunner: () => void
  clearError: () => void
}

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  assessments: [],
  activeAssessment: null,
  questions: [],
  activeAttempt: null,
  submittedResult: null,
  selectedAnswers: {},
  topicPerformance: {},
  isLoading: false,
  error: null,

  fetchAssessments: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await assessmentApi.getUserAssessments(0, false)
      set({ assessments: data.content, isLoading: false })
    } catch (e: any) {
      set({ error: e?.response?.data?.message || 'Failed to fetch assessments', isLoading: false })
    }
  },

  createAssessment: async (payload: CreateAssessmentPayload) => {
    set({ isLoading: true, error: null })
    try {
      const assessment = await assessmentApi.createAssessment(payload)
      set((state) => ({ assessments: [assessment, ...state.assessments], isLoading: false }))
      return assessment
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to create assessment'
      set({ error: msg, isLoading: false })
      throw new Error(msg)
    }
  },

  publishAssessment: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const published = await assessmentApi.publishAssessment(id)
      set((state) => ({
        assessments: state.assessments.map((a) => (a.id === id ? published : a)),
        isLoading: false,
      }))
      return published
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to publish assessment'
      set({ error: msg, isLoading: false })
      throw new Error(msg)
    }
  },

  addQuestion: async (assessmentId: string, payload: CreateQuestionPayload) => {
    set({ isLoading: true, error: null })
    try {
      await assessmentApi.addQuestion(assessmentId, payload)
      // Refresh assessment details
      const updated = await assessmentApi.getAssessmentById(assessmentId)
      set((state) => ({
        assessments: state.assessments.map((a) => (a.id === assessmentId ? updated : a)),
        isLoading: false,
      }))
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to add question'
      set({ error: msg, isLoading: false })
      throw new Error(msg)
    }
  },

  loadAssessmentRunner: async (assessmentId: string) => {
    set({ isLoading: true, error: null, submittedResult: null, selectedAnswers: {} })
    try {
      const assessment = await assessmentApi.getAssessmentById(assessmentId)
      const questions = await assessmentApi.getStudentQuestions(assessmentId)
      set({ activeAssessment: assessment, questions, isLoading: false })
    } catch (e: any) {
      set({ error: e?.response?.data?.message || 'Failed to load assessment', isLoading: false })
    }
  },

  selectAnswer: (questionId: string, optionId: string) => {
    set((state) => ({
      selectedAnswers: { ...state.selectedAnswers, [questionId]: optionId },
    }))
  },

  startAttempt: async (assessmentId: string) => {
    set({ isLoading: true, error: null })
    try {
      const attempt = await assessmentApi.startAttempt(assessmentId)
      set({ activeAttempt: attempt, isLoading: false })
      return attempt
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to start attempt'
      set({ error: msg, isLoading: false })
      throw new Error(msg)
    }
  },

  submitAttempt: async () => {
    const { activeAttempt, selectedAnswers } = get()
    if (!activeAttempt) {
      throw new Error('No active attempt in progress.')
    }

    set({ isLoading: true, error: null })
    try {
      const answersList = Object.entries(selectedAnswers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      }))

      const result = await assessmentApi.submitAttempt(activeAttempt.id, { answers: answersList })
      set({ submittedResult: result, activeAttempt: null, isLoading: false })
      return result
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to submit attempt'
      set({ error: msg, isLoading: false })
      throw new Error(msg)
    }
  },

  fetchTopicPerformance: async (topicId: string) => {
    try {
      const perf = await assessmentApi.getTopicPerformance(topicId)
      set((state) => ({
        topicPerformance: { ...state.topicPerformance, [topicId]: perf },
      }))
      return perf
    } catch (e) {
      const emptyPerf: TopicPerformance = {
        topicId,
        topicName: 'Topic',
        totalAttempts: 0,
        totalQuestionsAttempted: 0,
        totalQuestionsCorrect: 0,
        totalMarksObtained: 0,
        totalMarksAvailable: 0,
        averagePercentage: 0,
        latestPercentage: 0,
      }
      return emptyPerf
    }
  },

  resetRunner: () => {
    set({
      activeAssessment: null,
      questions: [],
      activeAttempt: null,
      submittedResult: null,
      selectedAnswers: {},
    })
  },

  clearError: () => set({ error: null }),
}))
