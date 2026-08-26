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

export const academicApi = {
  // Subjects
  getSubjects: async (): Promise<AcademicSubject[]> => {
    const res = await api.get<AcademicSubject[]>('/academic/subjects')
    return res.data
  },

  createSubject: async (payload: { name: string; code?: string; colorHex?: string }): Promise<AcademicSubject> => {
    const res = await api.post<AcademicSubject>('/academic/subjects', payload)
    return res.data
  },

  // Topics
  getTopics: async (subjectId?: string): Promise<AcademicTopic[]> => {
    const url = subjectId ? `/academic/topics?subjectId=${subjectId}` : '/academic/topics'
    const res = await api.get<AcademicTopic[]>(url)
    return res.data
  },

  createTopic: async (payload: { subjectId: string; name: string; description?: string }): Promise<AcademicTopic> => {
    const res = await api.post<AcademicTopic>('/academic/topics', payload)
    return res.data
  },

  getTopicsBySubject: async (subjectId?: string): Promise<AcademicTopic[]> => {
    return academicApi.getTopics(subjectId)
  },

  // Study Sessions
  startSession: async (payload: StartStudySessionPayload): Promise<StudySession> => {
    const res = await api.post<StudySession>('/study-sessions/start', payload)
    return res.data
  },

  completeSession: async (sessionId: string, payload?: CompleteStudySessionPayload): Promise<StudySession> => {
    const res = await api.post<StudySession>(`/study-sessions/${sessionId}/complete`, payload || {})
    return res.data
  },

  cancelSession: async (sessionId: string): Promise<StudySession> => {
    const res = await api.post<StudySession>(`/study-sessions/${sessionId}/cancel`, {})
    return res.data
  },

  logManualSession: async (payload: ManualStudySessionPayload): Promise<StudySession> => {
    const res = await api.post<StudySession>('/study-sessions/manual', payload)
    return res.data
  },

  createManualSession: async (payload: ManualStudySessionPayload): Promise<StudySession> => {
    return academicApi.logManualSession(payload)
  },

  getActiveSession: async (): Promise<StudySession | null> => {
    try {
      const res = await api.get<StudySession>('/study-sessions/active')
      return res.status === 204 ? null : res.data
    } catch {
      return null
    }
  },

  getUserSessions: async (page = 0, size = 20): Promise<PagedStudySessions> => {
    const res = await api.get<PagedStudySessions>(`/study-sessions?page=${page}&size=${size}`)
    return res.data
  },

  getTopicProgress: async (topicId: string): Promise<TopicProgress> => {
    const res = await api.get<TopicProgress>(`/study-sessions/topics/${topicId}/progress`)
    return res.data
  },

  // Learning State Analysis
  getTopicLearningState: async (topicId: string): Promise<LearningStateResult> => {
    const res = await api.get<LearningStateResult>(`/academic/topics/${topicId}/learning-state`)
    return res.data
  },

  getUserTopicsLearningState: async (subjectId?: string): Promise<LearningStateResult[]> => {
    const url = `/academic/learning-state/topics${subjectId ? `?subjectId=${subjectId}` : ''}`
    const res = await api.get<LearningStateResult[]>(url)
    return res.data
  },

  getSubjectLearningStateSummary: async (subjectId: string): Promise<SubjectLearningStateSummary> => {
    const res = await api.get<SubjectLearningStateSummary>(`/academic/subjects/${subjectId}/learning-state`)
    return res.data
  },

  // Command Center Dashboard & Exams
  getDashboardData: async (timeZone?: string): Promise<AcademicDashboardData> => {
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const res = await api.get<AcademicDashboardData>(`/academic/dashboard?timeZone=${encodeURIComponent(tz)}`)
    return res.data
  },

  getExams: async (): Promise<Exam[]> => {
    const res = await api.get<Exam[]>('/academic/exams')
    return res.data
  },

  getExamById: async (id: string): Promise<Exam> => {
    const res = await api.get<Exam>(`/academic/exams/${id}`)
    return res.data
  },

  getExamCoverage: async (id: string): Promise<ExamCoverageResponse> => {
    const res = await api.get<ExamCoverageResponse>(`/academic/exams/${id}/coverage`)
    return res.data
  },

  createExam: async (payload: ExamRequest): Promise<Exam> => {
    const res = await api.post<Exam>('/academic/exams', payload)
    return res.data
  },

  updateExam: async (id: string, payload: ExamRequest): Promise<Exam> => {
    const res = await api.put<Exam>(`/academic/exams/${id}`, payload)
    return res.data
  },

  deleteExam: async (id: string): Promise<void> => {
    await api.delete(`/academic/exams/${id}`)
  },
}
