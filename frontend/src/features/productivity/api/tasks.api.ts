import { api } from '@/services/api'
import type { Task, TaskRequest, PlannerSummary } from '@/types/productivity'

const BASE = '/tasks'

export const tasksApi = {
  list: async () => {
    const res = await api.get<{ data: Task[] }>(BASE)
    return res.data.data
  },
  
  get: async (id: string) => {
    const res = await api.get<{ data: Task }>(`${BASE}/${id}`)
    return res.data.data
  },
  
  create: async (data: TaskRequest) => {
    const res = await api.post<{ data: Task }>(BASE, data)
    return res.data.data
  },
  
  update: async (id: string, data: TaskRequest) => {
    const res = await api.put<{ data: Task }>(`${BASE}/${id}`, data)
    return res.data.data
  },
  
  delete: async (id: string) => {
    await api.delete(`${BASE}/${id}`)
  },
  
  getSummary: async () => {
    const res = await api.get<{ data: PlannerSummary }>(`${BASE}/summary`)
    return res.data.data
  }
}
