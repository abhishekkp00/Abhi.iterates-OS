import { api } from '@/services/api'
import type { StudySessionType } from '@/types/academic'

export type StudyPlanStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'COMPLETED'
export type GoalTargetState = 'STRONG' | 'DEVELOPING'

export interface PlannedStudySession {
  id: string
  topicId: string
  topicName: string
  subjectId: string
  subjectName: string
  dayNumber: number
  recommendedMinutes: number
  priorityScore: number
  priorityReason: string
  sessionType: StudySessionType
  isManualOverride: boolean
  overrideNotes?: string
  isCompleted?: boolean
  completedAt?: string
  actualMinutes?: number
  displayOrder: number
}

export interface StudyPlan {
  id?: string
  status: StudyPlanStatus
  planStartDate: string
  planEndDate: string
  planningHorizonDays: number
  totalPlannedMinutes: number
  totalAvailableMinutes: number
  capacityWarning: boolean
  capacityWarningMsg?: string
  needsReview?: boolean
  staleReason?: string
  sessions: PlannedStudySession[]
  createdAt?: string
  updatedAt?: string
}

export interface StudyPlanSummary {
  id: string
  status: StudyPlanStatus
  planStartDate: string
  planEndDate: string
  totalPlannedMinutes: number
  sessionCount: number
  capacityWarning: boolean
  needsReview?: boolean
  staleReason?: string
  createdAt: string
  updatedAt: string
}

export interface PlannerPreferences {
  id?: string
  availableMinutesPerDay: number
  preferredSessionLengthMinutes: number
  planningHorizonDays: number
  createdAt?: string
  updatedAt?: string
}

export interface GeneratePlanPayload {
  availableMinutesPerDay?: number
  preferredSessionLengthMinutes?: number
  planningHorizonDays?: number
  examId?: string
}

export interface AcademicGoal {
  id: string
  topicId: string
  topicName: string
  subjectId: string
  subjectName: string
  targetState: GoalTargetState
  targetDate: string
  description?: string
  isActive: boolean
  daysRemaining: number
  createdAt: string
  updatedAt: string
}

export interface CreateGoalPayload {
  topicId: string
  targetState: GoalTargetState
  targetDate: string
  description?: string
}

export interface TopicPrerequisite {
  id: string
  topicId: string
  topicName: string
  prerequisiteTopicId: string
  prerequisiteTopicName: string
  subjectId: string
  subjectName: string
}

export interface TopicPriorityBreakdown {
  topicId: string
  topicName: string
  subjectId: string
  subjectName: string
  learningState: string
  recommendedStrategy: StudySessionType
  weaknessFactor: number
  examUrgencyFactor: number
  trendFactor: number
  recencyFactor: number
  goalUrgencyFactor: number
  prerequisiteImportanceFactor: number
  neglectFactor: number
  rawScore: number
  isHighEffortLowPerformance: boolean
  reason: string
}

function extractData<T>(res: { data: any; status?: number }): T {
  if (res.status === 204 || !res.data) return null as T
  return res.data && typeof res.data === 'object' && 'data' in res.data ? res.data.data : res.data
}

export const plannerApi = {
  // Plan Generation & Lifecycle
  previewPlan: async (payload?: GeneratePlanPayload): Promise<StudyPlan> => {
    const res = await api.post('/study-plans/preview', payload || {})
    return extractData<StudyPlan>(res)
  },

  saveDraftPlan: async (payload?: GeneratePlanPayload): Promise<StudyPlan> => {
    const res = await api.post('/study-plans', payload || {})
    return extractData<StudyPlan>(res)
  },

  regeneratePlan: async (payload?: GeneratePlanPayload): Promise<StudyPlan> => {
    const res = await api.post('/study-plans/regenerate', payload || {})
    return extractData<StudyPlan>(res)
  },

  activatePlan: async (planId: string): Promise<StudyPlan> => {
    const res = await api.post(`/study-plans/${planId}/activate`)
    return extractData<StudyPlan>(res)
  },

  expirePlan: async (planId: string): Promise<StudyPlan> => {
    const res = await api.post(`/study-plans/${planId}/expire`)
    return extractData<StudyPlan>(res)
  },

  getPlan: async (planId: string): Promise<StudyPlan> => {
    const res = await api.get(`/study-plans/${planId}`)
    return extractData<StudyPlan>(res)
  },

  getPriorityBreakdown: async (planId: string): Promise<TopicPriorityBreakdown[]> => {
    const res = await api.get(`/study-plans/${planId}/priority-breakdown`)
    return extractData<TopicPriorityBreakdown[]>(res)
  },

  getUserPlans: async (): Promise<StudyPlanSummary[]> => {
    const res = await api.get('/study-plans')
    return extractData<StudyPlanSummary[]>(res)
  },

  overrideSession: async (
    planId: string,
    sessionId: string,
    data: { recommendedMinutes?: number; sessionType?: StudySessionType; overrideNotes: string }
  ): Promise<PlannedStudySession> => {
    const res = await api.put(
      `/study-plans/${planId}/sessions/${sessionId}`,
      data
    )
    return extractData<PlannedStudySession>(res)
  },

  // Preferences
  getPreferences: async (): Promise<PlannerPreferences> => {
    const res = await api.get('/study-plans/preferences')
    return extractData<PlannerPreferences>(res)
  },

  upsertPreferences: async (data: Partial<PlannerPreferences>): Promise<PlannerPreferences> => {
    const res = await api.put('/study-plans/preferences', data)
    return extractData<PlannerPreferences>(res)
  },

  // Academic Goals
  createGoal: async (data: CreateGoalPayload): Promise<AcademicGoal> => {
    const res = await api.post('/academic/goals', data)
    return extractData<AcademicGoal>(res)
  },

  getActiveGoals: async (): Promise<AcademicGoal[]> => {
    const res = await api.get('/academic/goals')
    return extractData<AcademicGoal[]>(res)
  },

  deactivateGoal: async (goalId: string): Promise<void> => {
    await api.delete(`/academic/goals/${goalId}`)
  },

  // Topic Prerequisites
  addPrerequisite: async (topicId: string, prerequisiteTopicId: string): Promise<TopicPrerequisite> => {
    const res = await api.post(`/academic/topics/${topicId}/prerequisites`, {
      prerequisiteTopicId,
    })
    return extractData<TopicPrerequisite>(res)
  },

  getPrerequisites: async (topicId: string): Promise<TopicPrerequisite[]> => {
    const res = await api.get(`/academic/topics/${topicId}/prerequisites`)
    return extractData<TopicPrerequisite[]>(res)
  },

  removePrerequisite: async (topicId: string, prerequisiteTopicId: string): Promise<void> => {
    await api.delete(`/academic/topics/${topicId}/prerequisites/${prerequisiteTopicId}`)
  },
}
