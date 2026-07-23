import { api } from '@/services/api'
import type { CalendarEvent, CalendarEventRequest } from '@/types/productivity'

const BASE = '/calendar'

export const calendarApi = {
  list: async () => {
    const res = await api.get<{ data: CalendarEvent[] }>(BASE)
    return res.data.data
  },
  
  createEvent: async (data: CalendarEventRequest) => {
    const res = await api.post<{ data: CalendarEvent }>(`${BASE}/events`, data)
    return res.data.data
  },
  
  updateEvent: async (id: string, data: CalendarEventRequest) => {
    const res = await api.put<{ data: CalendarEvent }>(`${BASE}/events/${id}`, data)
    return res.data.data
  },
  
  deleteEvent: async (id: string) => {
    await api.delete(`${BASE}/events/${id}`)
  }
}
