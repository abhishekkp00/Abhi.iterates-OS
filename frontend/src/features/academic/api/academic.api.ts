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
export type LearningTrend = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'NO_TREND'
export type GoalTargetState = 'STRONG' | 'DEVELOPING'

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

export interface GoalSummary {
  id: string
  topicId: string
  topicName: string
  subjectId?: string
  subjectName?: string
  targetState: GoalTargetState
  targetDate: string
  daysRemaining: number
  isActive: boolean
  description?: string
}

export interface DailyActivitySummary {
  date: string
  studyMinutes: number
  sessionCount: number
}

export interface StudyActivitySummary {
  periodDays: number
  totalStudyMinutes: number
  activeDaysCount: number
  studyConsistencyPercentage: number
  dailyActivity: DailyActivitySummary[]
}

export interface RecentAssessmentSummary {
  attemptId: string
  assessmentId: string
  assessmentTitle: string
  percentage: number
  submittedAt: string
}

export interface AcademicDashboardData {
  todaySummary: TodaySummary
  todayPlan?: TodayPlanSummary
  planAdherence: PlanAdherenceSummary
  learningStateSummary: LearningStateSummary
  weakTopics: WeakTopicSummary[]
  developingTopics: DevelopingTopicSummary[]
  upcomingExams: Exam[]
  goals: GoalSummary[]
  studyActivity: StudyActivitySummary
  recentAssessments: RecentAssessmentSummary[]
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

  // Command Center Dashboard & Exams
  getDashboardData: async (timeZone?: string): Promise<AcademicDashboardData> => {
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const res = await api.get<AcademicDashboardData>(`/v1/academic/dashboard?timeZone=${encodeURIComponent(tz)}`)
    return res.data
  },

  getExams: async (): Promise<Exam[]> => {
    const res = await api.get<Exam[]>('/v1/academic/exams')
    return res.data
  },

  createExam: async (payload: ExamRequest): Promise<Exam> => {
    const res = await api.post<Exam>('/v1/academic/exams', payload)
    return res.data
  },

  updateExam: async (id: string, payload: ExamRequest): Promise<Exam> => {
    const res = await api.put<Exam>(`/v1/academic/exams/${id}`, payload)
    return res.data
  },

  deleteExam: async (id: string): Promise<void> => {
    await api.delete(`/v1/academic/exams/${id}`)
  },
}
