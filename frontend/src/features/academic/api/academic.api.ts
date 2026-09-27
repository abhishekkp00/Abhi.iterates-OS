import { api } from '@/services/api'
import type { PlannedStudySession } from '@/features/planner/api/planner.api'
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

export type LearningState = 'STRONG' | 'DEVELOPING' | 'WEAK' | 'INSUFFICIENT_DATA'
export type LearningTrend = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'NO_TREND' | 'INSUFFICIENT_DATA'
export type GoalTargetState = 'STRONG' | 'DEVELOPING'
export type ExamStudyPhase = 'LEARNING' | 'PRACTICE' | 'CONSOLIDATION' | 'REVISION' | 'FINAL_REVIEW' | 'EXAM_PASSED_DATE'

export interface PagedStudySessions {
  content: StudySession[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface Exam {
  id: string
  userId: string
  subjectId?: string
  subjectName?: string
  title: string
  description?: string
  examDate: string
  daysRemaining: number
  totalTopicsCount: number
  assessedTopicsCount: number
  assessmentCoveragePercentage: number
  topicIds: string[]
  createdAt: string
  updatedAt: string
}

export interface ExamRequest {
  title: string
  description?: string
  subjectId?: string
  examDate: string
  topicIds?: string[]
}

export interface ExamTopicBreakdownItem {
  topicId: string
  topicName: string
  subjectId?: string
  subjectName?: string
  learningState: LearningState
  trend: LearningTrend
  studyMinutes: number
  recentAccuracyPercentage?: number
  assessmentAttemptCount: number
  recommendedStrategy: string
  topicPhase: ExamStudyPhase
  priorityScore: number
  reason: string
}

export interface ExamCoverageResponse {
  examId: string
  examTitle: string
  examDate: string
  daysRemaining: number
  globalPhase: ExamStudyPhase
  totalTopicsCount: number
  studiedTopicsCount: number
  assessedTopicsCount: number
  studyCoveragePercentage: number
  assessmentCoveragePercentage: number
  weakTopicsCount: number
  developingTopicsCount: number
  strongTopicsCount: number
  insufficientDataTopicsCount: number
  recommendedStrategySummary: string
  topicBreakdown: ExamTopicBreakdownItem[]
}

export interface TodaySummary {
  localDate: string
  actualStudyMinutesToday: number
  plannedMinutesToday: number
  todaySessionCount: number
  completedSessionCountToday: number
  nextExamTitle?: string
  daysToNextExam?: number
}

export interface TodayPlanSummary {
  planId?: string
  planStatus?: string
  needsReview?: boolean
  staleReason?: string
  sessions?: PlannedStudySession[]
  nextSession?: PlannedStudySession
}

export interface PlanAdherenceSummary {
  periodDays: number
  totalPlannedSessions: number
  completedPlannedSessions: number
  adherencePercentage: number
  definition: string
}

export interface LearningStateSummary {
  totalTopics: number
  strongCount: number
  developingCount: number
  weakCount: number
  insufficientDataCount: number
}

export interface WeakTopicSummary {
  topicId: string
  topicName: string
  subjectId?: string
  subjectName?: string
  state: LearningState
  trend: LearningTrend
  recentAveragePercentage?: number
  totalStudyMinutes?: number
  lastStudiedAt?: string
  reason?: string
}

export interface DevelopingTopicSummary {
  topicId: string
  topicName: string
  subjectId?: string
  subjectName?: string
  state: LearningState
  trend: LearningTrend
  recentAveragePercentage?: number
  totalStudyMinutes?: number
  lastStudiedAt?: string
}

export interface AcademicDashboardData {
  todaySummary: TodaySummary
  todayPlanSummary: TodayPlanSummary
  adherenceSummary: PlanAdherenceSummary
  learningStateSummary: LearningStateSummary
  weakTopics: WeakTopicSummary[]
  developingTopics: DevelopingTopicSummary[]
  upcomingExams: Exam[]
  todayPlan?: TodayPlanSummary
  planAdherence?: PlanAdherenceSummary
  goals?: any[]
  studyActivity?: any
  recentAssessments?: any[]
}

function extractData<T>(res: { data: any; status?: number }): T {
  if (res.status === 204 || !res.data) return null as T
  return res.data && typeof res.data === 'object' && 'data' in res.data ? res.data.data : res.data
}

export const academicApi = {
  // Subjects
  getSubjects: async (): Promise<AcademicSubject[]> => {
    const res = await api.get('/academic/subjects')
    return extractData<AcademicSubject[]>(res)
  },

  createSubject: async (payload: { name: string; code?: string; colorHex?: string }): Promise<AcademicSubject> => {
    const res = await api.post('/academic/subjects', payload)
    return extractData<AcademicSubject>(res)
  },

  // Topics
  getTopics: async (subjectId?: string): Promise<AcademicTopic[]> => {
    const url = subjectId ? `/academic/topics?subjectId=${subjectId}` : '/academic/topics'
    const res = await api.get(url)
    return extractData<AcademicTopic[]>(res)
  },

  createTopic: async (payload: { subjectId: string; name: string; description?: string }): Promise<AcademicTopic> => {
    const res = await api.post('/academic/topics', payload)
    return extractData<AcademicTopic>(res)
  },

  getTopicsBySubject: async (subjectId?: string): Promise<AcademicTopic[]> => {
    return academicApi.getTopics(subjectId)
  },

  // Study Sessions
  startSession: async (payload: StartStudySessionPayload): Promise<StudySession> => {
    const res = await api.post('/study-sessions/start', payload)
    return extractData<StudySession>(res)
  },

  completeSession: async (sessionId: string, payload?: CompleteStudySessionPayload): Promise<StudySession> => {
    const res = await api.post(`/study-sessions/${sessionId}/complete`, payload || {})
    return extractData<StudySession>(res)
  },

  cancelSession: async (sessionId: string): Promise<StudySession> => {
    const res = await api.post(`/study-sessions/${sessionId}/cancel`, {})
    return extractData<StudySession>(res)
  },

  logManualSession: async (payload: ManualStudySessionPayload): Promise<StudySession> => {
    const res = await api.post('/study-sessions/manual', payload)
    return extractData<StudySession>(res)
  },

  createManualSession: async (payload: ManualStudySessionPayload): Promise<StudySession> => {
    return academicApi.logManualSession(payload)
  },

  getActiveSession: async (): Promise<StudySession | null> => {
    try {
      const res = await api.get('/study-sessions/active')
      return res.status === 204 ? null : extractData<StudySession>(res)
    } catch {
      return null
    }
  },

  getUserSessions: async (page = 0, size = 20): Promise<PagedStudySessions> => {
    const res = await api.get(`/study-sessions?page=${page}&size=${size}`)
    return extractData<PagedStudySessions>(res)
  },

  getTopicProgress: async (topicId: string): Promise<TopicProgress> => {
    const res = await api.get(`/study-sessions/topics/${topicId}/progress`)
    return extractData<TopicProgress>(res)
  },

  // Learning State Analysis
  getTopicLearningState: async (topicId: string): Promise<LearningStateResult> => {
    const res = await api.get(`/academic/topics/${topicId}/learning-state`)
    return extractData<LearningStateResult>(res)
  },

  getUserTopicsLearningState: async (subjectId?: string): Promise<LearningStateResult[]> => {
    const url = `/academic/learning-state/topics${subjectId ? `?subjectId=${subjectId}` : ''}`
    const res = await api.get(url)
    return extractData<LearningStateResult[]>(res)
  },

  getSubjectLearningStateSummary: async (subjectId: string): Promise<SubjectLearningStateSummary> => {
    const res = await api.get(`/academic/subjects/${subjectId}/learning-state`)
    return extractData<SubjectLearningStateSummary>(res)
  },

  // Command Center Dashboard & Exams
  getDashboardData: async (timeZone?: string): Promise<AcademicDashboardData> => {
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const res = await api.get(`/academic/dashboard?timeZone=${encodeURIComponent(tz)}`)
    return extractData<AcademicDashboardData>(res)
  },

  getExams: async (): Promise<Exam[]> => {
    const res = await api.get('/academic/exams')
    return extractData<Exam[]>(res)
  },

  getExamById: async (id: string): Promise<Exam> => {
    const res = await api.get(`/academic/exams/${id}`)
    return extractData<Exam>(res)
  },

  getExamCoverage: async (id: string): Promise<ExamCoverageResponse> => {
    const res = await api.get(`/academic/exams/${id}/coverage`)
    return extractData<ExamCoverageResponse>(res)
  },

  createExam: async (payload: ExamRequest): Promise<Exam> => {
    const res = await api.post('/academic/exams', payload)
    return extractData<Exam>(res)
  },

  updateExam: async (id: string, payload: ExamRequest): Promise<Exam> => {
    const res = await api.put(`/academic/exams/${id}`, payload)
    return extractData<Exam>(res)
  },

  deleteExam: async (id: string): Promise<void> => {
    await api.delete(`/academic/exams/${id}`)
  },
}
