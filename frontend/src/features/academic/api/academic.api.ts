import { api } from '@/services/api'
import type {
  AcademicSubject,
  AcademicTopic,
  StudySession,
  TopicProgress,
  LearningStateResult,
  SubjectLearningStateSummary,
  StartStudySessionPayload,
  CompleteStudySessionPayload,
  ManualStudySessionPayload,
} from '@/types/academic'

export interface PagedStudySessions {
  content: StudySession[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export const academicApi = {
  // Subjects
  getSubjects: async (): Promise<AcademicSubject[]> => {
    const res = await api.get<AcademicSubject[]>('/v1/academic/subjects')
    return res.data
  },

  createSubject: async (data: { name: string; code?: string; color?: string; description?: string }): Promise<AcademicSubject> => {
    const res = await api.post<AcademicSubject>('/v1/academic/subjects', data)
    return res.data
  },

  // Topics
  getTopicsBySubject: async (subjectId: string): Promise<AcademicTopic[]> => {
    const res = await api.get<AcademicTopic[]>(`/v1/academic/subjects/${subjectId}/topics`)
    return res.data
  },

  createTopic: async (data: { subjectId: string; name: string; description?: string; orderIndex?: number }): Promise<AcademicTopic> => {
    const res = await api.post<AcademicTopic>('/v1/academic/topics', data)
    return res.data
  },

  // Study Sessions
  startSession: async (payload: StartStudySessionPayload): Promise<StudySession> => {
    const res = await api.post<StudySession>('/v1/study-sessions/start', payload)
    return res.data
  },

  completeSession: async (id: string, payload?: CompleteStudySessionPayload): Promise<StudySession> => {
    const res = await api.post<StudySession>(`/v1/study-sessions/${id}/complete`, payload || {})
    return res.data
  },

  cancelSession: async (id: string): Promise<StudySession> => {
    const res = await api.post<StudySession>(`/v1/study-sessions/${id}/cancel`)
    return res.data
  },

  createManualSession: async (payload: ManualStudySessionPayload): Promise<StudySession> => {
    const res = await api.post<StudySession>('/v1/study-sessions/manual', payload)
    return res.data
  },

  getActiveSession: async (): Promise<StudySession | null> => {
    try {
      const res = await api.get<StudySession>('/v1/study-sessions/active')
      return res.status === 204 ? null : res.data
    } catch (e) {
      return null
    }
  },

  getUserSessions: async (page = 0, size = 20): Promise<PagedStudySessions> => {
    const res = await api.get<PagedStudySessions>(`/v1/study-sessions?page=${page}&size=${size}`)
    return res.data
  },

  getTopicProgress: async (topicId: string): Promise<TopicProgress> => {
    const res = await api.get<TopicProgress>(`/v1/study-sessions/topics/${topicId}/progress`)
    return res.data
  },

  // Learning State Analysis
  getTopicLearningState: async (topicId: string): Promise<LearningStateResult> => {
    const res = await api.get<LearningStateResult>(`/v1/academic/topics/${topicId}/learning-state`)
    return res.data
  },

  getUserTopicsLearningState: async (subjectId?: string): Promise<LearningStateResult[]> => {
    const url = `/v1/academic/learning-state/topics${subjectId ? `?subjectId=${subjectId}` : ''}`
    const res = await api.get<LearningStateResult[]>(url)
    return res.data
  },

  getSubjectLearningStateSummary: async (subjectId: string): Promise<SubjectLearningStateSummary> => {
    const res = await api.get<SubjectLearningStateSummary>(`/v1/academic/subjects/${subjectId}/learning-state`)
    return res.data
  },
}
