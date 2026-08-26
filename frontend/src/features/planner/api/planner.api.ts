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

export const plannerApi = {
  // Plan Generation & Lifecycle
  previewPlan: async (payload?: GeneratePlanPayload): Promise<StudyPlan> => {
    const res = await api.post<StudyPlan>('/study-plans/preview', payload || {})
    return res.data
  },

  saveDraftPlan: async (payload?: GeneratePlanPayload): Promise<StudyPlan> => {
    const res = await api.post<StudyPlan>('/study-plans', payload || {})
    return res.data
  },

  regeneratePlan: async (payload?: GeneratePlanPayload): Promise<StudyPlan> => {
    const res = await api.post<StudyPlan>('/study-plans/regenerate', payload || {})
    return res.data
  },

  activatePlan: async (planId: string): Promise<StudyPlan> => {
    const res = await api.post<StudyPlan>(`/study-plans/${planId}/activate`)
    return res.data
  },

  expirePlan: async (planId: string): Promise<StudyPlan> => {
    const res = await api.post<StudyPlan>(`/study-plans/${planId}/expire`)
    return res.data
  },

  getPlan: async (planId: string): Promise<StudyPlan> => {
    const res = await api.get<StudyPlan>(`/study-plans/${planId}`)
    return res.data
  },

  getPriorityBreakdown: async (planId: string): Promise<TopicPriorityBreakdown[]> => {
    const res = await api.get<TopicPriorityBreakdown[]>(`/study-plans/${planId}/priority-breakdown`)
    return res.data
  },

  getUserPlans: async (): Promise<StudyPlanSummary[]> => {
    const res = await api.get<StudyPlanSummary[]>('/study-plans')
    return res.data
  },

  overrideSession: async (
    planId: string,
    sessionId: string,
    data: { recommendedMinutes?: number; sessionType?: StudySessionType; overrideNotes: string }
  ): Promise<PlannedStudySession> => {
    const res = await api.put<PlannedStudySession>(
      `/study-plans/${planId}/sessions/${sessionId}`,
      data
    )
    return res.data
  },

  // Preferences
  getPreferences: async (): Promise<PlannerPreferences> => {
    const res = await api.get<PlannerPreferences>('/study-plans/preferences')
    return res.data
  },

  upsertPreferences: async (data: Partial<PlannerPreferences>): Promise<PlannerPreferences> => {
    const res = await api.put<PlannerPreferences>('/study-plans/preferences', data)
    return res.data
  },

  // Academic Goals
  createGoal: async (data: CreateGoalPayload): Promise<AcademicGoal> => {
    const res = await api.post<AcademicGoal>('/academic/goals', data)
    return res.data
  },

  getActiveGoals: async (): Promise<AcademicGoal[]> => {
    const res = await api.get<AcademicGoal[]>('/academic/goals')
    return res.data
  },

  deactivateGoal: async (goalId: string): Promise<void> => {
    await api.delete(`/academic/goals/${goalId}`)
  },

  // Topic Prerequisites
  addPrerequisite: async (topicId: string, prerequisiteTopicId: string): Promise<TopicPrerequisite> => {
    const res = await api.post<TopicPrerequisite>(`/academic/topics/${topicId}/prerequisites`, {
      prerequisiteTopicId,
    })
    return res.data
  },

  getPrerequisites: async (topicId: string): Promise<TopicPrerequisite[]> => {
    const res = await api.get<TopicPrerequisite[]>(`/academic/topics/${topicId}/prerequisites`)
    return res.data
  },

  removePrerequisite: async (topicId: string, prerequisiteTopicId: string): Promise<void> => {
    await api.delete(`/academic/topics/${topicId}/prerequisites/${prerequisiteTopicId}`)
  },
}
