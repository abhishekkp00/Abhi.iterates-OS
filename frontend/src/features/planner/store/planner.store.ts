import { create } from 'zustand'
import {
  plannerApi,
  type StudyPlan,
  type StudyPlanSummary,
  type PlannerPreferences,
  type AcademicGoal,
  type GeneratePlanPayload,
  type CreateGoalPayload,
} from '../api/planner.api'

interface PlannerStore {
  // State
  currentPlan: StudyPlan | null
  previewPlan: StudyPlan | null
  userPlans: StudyPlanSummary[]
  preferences: PlannerPreferences | null
  goals: AcademicGoal[]
  isLoadingPlan: boolean
  isGenerating: boolean
  isLoadingGoals: boolean
  error: string | null

  // Actions
  fetchActiveOrLatestPlan: () => Promise<void>
  fetchPreferences: () => Promise<void>
  updatePreferences: (data: Partial<PlannerPreferences>) => Promise<void>
  generatePreview: (payload?: GeneratePlanPayload) => Promise<StudyPlan>
  saveDraft: (payload?: GeneratePlanPayload) => Promise<StudyPlan>
  activatePlan: (planId: string) => Promise<void>
  expirePlan: (planId: string) => Promise<void>
  fetchGoals: () => Promise<void>
  createGoal: (data: CreateGoalPayload) => Promise<void>
  deactivateGoal: (goalId: string) => Promise<void>
  clearPreview: () => void
  clearError: () => void
}

export const usePlannerStore = create<PlannerStore>((set, get) => ({
  currentPlan: null,
  previewPlan: null,
  userPlans: [],
  preferences: null,
  goals: [],
  isLoadingPlan: false,
  isGenerating: false,
  isLoadingGoals: false,
  error: null,

  fetchActiveOrLatestPlan: async () => {
    set({ isLoadingPlan: true, error: null })
    try {
      const summaries = await plannerApi.getUserPlans()
      set({ userPlans: summaries })

      const active = summaries.find((p) => p.status === 'ACTIVE')
      const targetSummary = active || summaries[0]

      if (targetSummary) {
        const fullPlan = await plannerApi.getPlan(targetSummary.id)
        set({ currentPlan: fullPlan, isLoadingPlan: false })
      } else {
        set({ currentPlan: null, isLoadingPlan: false })
      }
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to load study plan',
        isLoadingPlan: false,
      })
    }
  },

  fetchPreferences: async () => {
    try {
      const prefs = await plannerApi.getPreferences()
      set({ preferences: prefs })
    } catch (err: any) {
      console.error('Failed to load preferences:', err)
    }
  },

  updatePreferences: async (data: Partial<PlannerPreferences>) => {
    try {
      const updated = await plannerApi.upsertPreferences(data)
      set({ preferences: updated })
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to update preferences' })
    }
  },

  generatePreview: async (payload?: GeneratePlanPayload) => {
    set({ isGenerating: true, error: null })
    try {
      const plan = await plannerApi.previewPlan(payload)
      set({ previewPlan: plan, isGenerating: false })
      return plan
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to generate plan preview'
      set({ error: msg, isGenerating: false })
      throw new Error(msg)
    }
  },

  saveDraft: async (payload?: GeneratePlanPayload) => {
    set({ isGenerating: true, error: null })
    try {
      const plan = await plannerApi.saveDraftPlan(payload)
      set({ previewPlan: plan, isGenerating: false })
      await get().fetchActiveOrLatestPlan()
      return plan
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save draft plan'
      set({ error: msg, isGenerating: false })
      throw new Error(msg)
    }
  },

  activatePlan: async (planId: string) => {
    set({ isGenerating: true, error: null })
    try {
      const updated = await plannerApi.activatePlan(planId)
      set({ currentPlan: updated, previewPlan: null, isGenerating: false })
      await get().fetchActiveOrLatestPlan()
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to activate study plan',
        isGenerating: false,
      })
    }
  },

  expirePlan: async (planId: string) => {
    try {
      await plannerApi.expirePlan(planId)
      await get().fetchActiveOrLatestPlan()
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to expire plan' })
    }
  },

  fetchGoals: async () => {
    set({ isLoadingGoals: true })
    try {
      const goals = await plannerApi.getActiveGoals()
      set({ goals, isLoadingGoals: false })
    } catch (err: any) {
      set({ isLoadingGoals: false })
    }
  },

  createGoal: async (data: CreateGoalPayload) => {
    try {
      await plannerApi.createGoal(data)
      await get().fetchGoals()
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create goal'
      set({ error: msg })
      throw new Error(msg)
    }
  },

  deactivateGoal: async (goalId: string) => {
    try {
      await plannerApi.deactivateGoal(goalId)
      await get().fetchGoals()
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to deactivate goal' })
    }
  },

  clearPreview: () => set({ previewPlan: null }),
  clearError: () => set({ error: null }),
}))
