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

function extractData<T>(res: { data: any; status?: number }): T {
  if (res.status === 204 || !res.data) return null as T
  return res.data && typeof res.data === 'object' && 'data' in res.data ? res.data.data : res.data
}

export const assessmentApi = {
  // Assessment Creation & Management
  createAssessment: async (payload: CreateAssessmentPayload): Promise<Assessment> => {
    const res = await api.post('/assessments', payload)
    return extractData<Assessment>(res)
  },

  publishAssessment: async (id: string): Promise<Assessment> => {
    const res = await api.post(`/assessments/${id}/publish`)
    return extractData<Assessment>(res)
  },

  addQuestion: async (assessmentId: string, payload: CreateQuestionPayload): Promise<any> => {
    const res = await api.post(`/assessments/${assessmentId}/questions`, payload)
    return extractData<any>(res)
  },

  getStudentQuestions: async (assessmentId: string): Promise<Question[]> => {
    const res = await api.get(`/assessments/${assessmentId}/questions`)
    return extractData<Question[]>(res)
  },

  getAssessmentById: async (id: string): Promise<Assessment> => {
    const res = await api.get(`/assessments/${id}`)
    return extractData<Assessment>(res)
  },

  getUserAssessments: async (page = 0, publishedOnly = false): Promise<PagedAssessments> => {
    const url = `/assessments?page=${page}&size=20${publishedOnly ? '&publishedOnly=true' : ''}`
    const res = await api.get(url)
    return extractData<PagedAssessments>(res)
  },

  // Test Attempt & Submission
  startAttempt: async (assessmentId: string): Promise<AssessmentAttempt> => {
    const res = await api.post(`/assessment-attempts/assessments/${assessmentId}/start`)
    return extractData<AssessmentAttempt>(res)
  },

  submitAttempt: async (attemptId: string, payload: SubmitAttemptPayload): Promise<AssessmentAttempt> => {
    const res = await api.post(`/assessment-attempts/${attemptId}/submit`, payload)
    return extractData<AssessmentAttempt>(res)
  },

  getAttemptById: async (attemptId: string): Promise<AssessmentAttempt> => {
    const res = await api.get(`/assessment-attempts/${attemptId}`)
    return extractData<AssessmentAttempt>(res)
  },

  getUserAttempts: async (page = 0): Promise<PagedAttempts> => {
    const res = await api.get(`/assessment-attempts?page=${page}&size=20`)
    return extractData<PagedAttempts>(res)
  },

  getTopicPerformance: async (topicId: string): Promise<TopicPerformance> => {
    const res = await api.get(`/assessment-attempts/topics/${topicId}/performance`)
    return extractData<TopicPerformance>(res)
  },

  generateAdaptiveAssessment: async (payload: {
    topicId: string
    subjectId?: string
    questionCount?: number
    difficulty?: string
    includeResources?: boolean
  }): Promise<Assessment> => {
    const res = await api.post('/assessments/generate', payload)
    return extractData<Assessment>(res)
  },
}
