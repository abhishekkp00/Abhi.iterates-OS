import { create } from 'zustand'
import { academicApi } from '../api/academic.api'
import type {
  AcademicSubject,
  AcademicTopic,
  StudySession,
  TopicProgress,
  StartStudySessionPayload,
  CompleteStudySessionPayload,
  ManualStudySessionPayload,
} from '@/types/academic'

interface AcademicState {
  subjects: AcademicSubject[]
  topics: Record<string, AcademicTopic[]>
  activeSession: StudySession | null
  activeProgress: TopicProgress | null
  sessions: StudySession[]
  totalSessionsCount: number
  isLoading: boolean
  error: string | null

  fetchSubjects: () => Promise<void>
  fetchTopics: (subjectId: string) => Promise<void>
  fetchActiveSession: () => Promise<void>
  startSession: (payload: StartStudySessionPayload) => Promise<StudySession>
  completeSession: (id: string, payload?: CompleteStudySessionPayload) => Promise<StudySession>
  cancelSession: (id: string) => Promise<StudySession>
  createManualSession: (payload: ManualStudySessionPayload) => Promise<StudySession>
  fetchTopicProgress: (topicId: string) => Promise<TopicProgress>
  fetchSessions: (page?: number) => Promise<void>
  clearError: () => void
}

export const useAcademicStore = create<AcademicState>((set, get) => ({
  subjects: [],
  topics: {},
  activeSession: null,
  activeProgress: null,
  sessions: [],
  totalSessionsCount: 0,
  isLoading: false,
  error: null,

  fetchSubjects: async () => {
    try {
      set({ isLoading: true, error: null })
      const subjects = await academicApi.getSubjects()
      set({ subjects, isLoading: false })
    } catch (e: any) {
      set({ error: e?.response?.data?.message || 'Failed to fetch subjects', isLoading: false })
    }
  },

  fetchTopics: async (subjectId: string) => {
    try {
      set({ isLoading: true, error: null })
      const topicsList = await academicApi.getTopicsBySubject(subjectId)
      set((state) => ({
        topics: { ...state.topics, [subjectId]: topicsList },
        isLoading: false,
      }))
    } catch (e: any) {
      set({ error: e?.response?.data?.message || 'Failed to fetch topics', isLoading: false })
    }
  },

  fetchActiveSession: async () => {
    try {
      const activeSession = await academicApi.getActiveSession()
      set({ activeSession })
    } catch (e) {
      set({ activeSession: null })
    }
  },

  startSession: async (payload: StartStudySessionPayload) => {
    set({ isLoading: true, error: null })
    try {
      const session = await academicApi.startSession(payload)
      set({ activeSession: session, isLoading: false })
      return session
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to start study session'
      set({ error: msg, isLoading: false })
      throw new Error(msg)
    }
  },

  completeSession: async (id: string, payload?: CompleteStudySessionPayload) => {
    set({ isLoading: true, error: null })
    try {
      const completed = await academicApi.completeSession(id, payload)
      set({ activeSession: null, isLoading: false })
      
      // Refresh topic progress if applicable
      if (completed.topicId) {
        get().fetchTopicProgress(completed.topicId)
      }
      get().fetchSessions(0)
      return completed
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to complete study session'
      set({ error: msg, isLoading: false })
      throw new Error(msg)
    }
  },

  cancelSession: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const cancelled = await academicApi.cancelSession(id)
      set({ activeSession: null, isLoading: false })
      return cancelled
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to cancel study session'
      set({ error: msg, isLoading: false })
      throw new Error(msg)
    }
  },

  createManualSession: async (payload: ManualStudySessionPayload) => {
    set({ isLoading: true, error: null })
    try {
      const session = await academicApi.createManualSession(payload)
      set({ isLoading: false })
      if (payload.topicId) {
        get().fetchTopicProgress(payload.topicId)
      }
      get().fetchSessions(0)
      return session
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to record manual study session'
      set({ error: msg, isLoading: false })
      throw new Error(msg)
    }
  },

  fetchTopicProgress: async (topicId: string) => {
    try {
      const progress = await academicApi.getTopicProgress(topicId)
      set({ activeProgress: progress })
      return progress
    } catch (e) {
      const emptyProgress: TopicProgress = {
        topicId,
        totalStudyMinutes: 0,
        sessionCount: 0,
        averageSessionMinutes: 0,
      }
      set({ activeProgress: emptyProgress })
      return emptyProgress
    }
  },

  fetchSessions: async (page = 0) => {
    set({ isLoading: true, error: null })
    try {
      const data = await academicApi.getUserSessions(page)
      set({
        sessions: data.content,
        totalSessionsCount: data.totalElements,
        isLoading: false,
      })
    } catch (e: any) {
      set({ error: e?.response?.data?.message || 'Failed to fetch sessions', isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
