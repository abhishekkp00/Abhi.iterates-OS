import { create } from 'zustand'
import type { AppNotification } from '@/types'
import { api } from '@/services/api'
import { toast } from 'sonner'

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: number
  loading: boolean
  
  // HTTP Fetch operations
  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  
  // Real-Time Action
  addLiveNotification: (notification: AppNotification) => void
  
  // Mutations
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true })
    try {
      // Backend paginated GET /api/v1/notifications
      const response = await api.get('/notifications')
      const content = response.data?.data?.content || []
      set({ notifications: content })
    } catch (err) {
      console.error('[NotificationStore] Failed to fetch notifications:', err)
    } finally {
      set({ loading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      // Backend GET /api/v1/notifications/unread-count
      const response = await api.get('/notifications/unread-count')
      const count = response.data?.data?.count ?? 0
      set({ unreadCount: count })
    } catch (err) {
      console.error('[NotificationStore] Failed to fetch unread count:', err)
    }
  },

  addLiveNotification: (notification) => {
    // Avoid double inserts
    const exists = get().notifications.some((n) => n.id === notification.id)
    if (exists) return

    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }))

    // Play subtle high-fidelity audio chime on live updates if possible
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioCtx = new AudioCtx()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, audioCtx.currentTime) // A5 note
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.15)
    } catch (_e) {
      // Audio context blocked/unsupported; gracefully ignore
    }

    // Trigger toast overlay notification
    toast(notification.message, {
      description: 'New update received',
      action: notification.actionUrl ? {
        label: 'View',
        onClick: () => {
          window.location.href = notification.actionUrl!
        }
      } : undefined
    })
  },

  markRead: async (id) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }))

    try {
      // PATCH /api/v1/notifications/{id}/read
      const response = await api.patch(`/notifications/${id}/read`)
      const count = response.data?.data?.count ?? get().unreadCount
      set({ unreadCount: count })
    } catch (err) {
      console.error('[NotificationStore] Failed to mark read:', err)
      // Revert count if failed (optional, but keep simple since we are local)
    }
  },

  markAllRead: async () => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }))

    try {
      // PATCH /api/v1/notifications/mark-all-read
      await api.patch('/notifications/mark-all-read')
      set({ unreadCount: 0 })
    } catch (err) {
      console.error('[NotificationStore] Failed to mark all read:', err)
    }
  },

  remove: async (id) => {
    const isUnread = get().notifications.find((n) => n.id === id)?.read === false

    // Optimistic update
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: isUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    }))

    try {
      // DELETE /api/v1/notifications/{id}
      const response = await api.delete(`/notifications/${id}`)
      const count = response.data?.data?.count ?? get().unreadCount
      set({ unreadCount: count })
    } catch (err) {
      console.error('[NotificationStore] Failed to delete notification:', err)
    }
  },
}))
