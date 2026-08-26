import { api } from '@/services/api'
import type {
  Assessment,
  Question,
  AssessmentAttempt,
  TopicPerformance,
  CreateAssessmentPayload,
  CreateQuestionPayload,
  SubmitAttemptPayload,
} from '@/types/assessment'

export interface PagedAssessments {
  content: Assessment[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface PagedAttempts {
  content: AssessmentAttempt[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export const assessmentApi = {
  // Assessment Creation & Management
  createAssessment: async (payload: CreateAssessmentPayload): Promise<Assessment> => {
    const res = await api.post<Assessment>('/v1/assessments', payload)
    return res.data
  },

  publishAssessment: async (id: string): Promise<Assessment> => {
    const res = await api.post<Assessment>(`/v1/assessments/${id}/publish`)
    return res.data
  },

  addQuestion: async (assessmentId: string, payload: CreateQuestionPayload): Promise<any> => {
    const res = await api.post(`/v1/assessments/${assessmentId}/questions`, payload)
    return res.data
  },

  getStudentQuestions: async (assessmentId: string): Promise<Question[]> => {
    const res = await api.get<Question[]>(`/v1/assessments/${assessmentId}/questions`)
    return res.data
  },

  getAssessmentById: async (id: string): Promise<Assessment> => {
    const res = await api.get<Assessment>(`/v1/assessments/${id}`)
    return res.data
  },

  getUserAssessments: async (page = 0, publishedOnly = false): Promise<PagedAssessments> => {
    const url = `/v1/assessments?page=${page}&size=20${publishedOnly ? '&publishedOnly=true' : ''}`
    const res = await api.get<PagedAssessments>(url)
    return res.data
  },

  // Test Attempt & Submission
  startAttempt: async (assessmentId: string): Promise<AssessmentAttempt> => {
    const res = await api.post<AssessmentAttempt>(`/v1/assessment-attempts/assessments/${assessmentId}/start`)
    return res.data
  },

  submitAttempt: async (attemptId: string, payload: SubmitAttemptPayload): Promise<AssessmentAttempt> => {
    const res = await api.post<AssessmentAttempt>(`/v1/assessment-attempts/${attemptId}/submit`, payload)
    return res.data
  },

  getAttemptById: async (attemptId: string): Promise<AssessmentAttempt> => {
    const res = await api.get<AssessmentAttempt>(`/v1/assessment-attempts/${attemptId}`)
    return res.data
  },

  getUserAttempts: async (page = 0): Promise<PagedAttempts> => {
    const res = await api.get<PagedAttempts>(`/v1/assessment-attempts?page=${page}&size=20`)
    return res.data
  },

  getTopicPerformance: async (topicId: string): Promise<TopicPerformance> => {
    const res = await api.get<TopicPerformance>(`/v1/assessment-attempts/topics/${topicId}/performance`)
    return res.data
  },

  generateAdaptiveAssessment: async (payload: {
    topicId: string
    subjectId?: string
    questionCount?: number
    difficulty?: string
    includeResources?: boolean
  }): Promise<Assessment> => {
    const res = await api.post<Assessment>('/v1/assessments/generate', payload)
    return res.data
  },
}
