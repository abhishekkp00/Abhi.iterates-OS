import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useWebSocketStore } from '@/store/websocket.store'
import { useNotificationStore } from '@/store/notification.store'
import type { AppNotification } from '@/types'
import { LoadingState } from '@/components/ui/feedback'

/**
 * ProtectedLayout — auth guard ONLY.
 * Does not render any visual layout. Visual shell is handled by DashboardLayout.
 * This separation keeps auth logic and layout logic independently testable.
 */
export function ProtectedLayout() {
  const { isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

  const { connect, disconnect, subscribe, status } = useWebSocketStore()
  const { fetchNotifications, fetchUnreadCount, addLiveNotification } = useNotificationStore()

  useEffect(() => {
    if (isAuthenticated) {
      // Connect to WebSocket
      connect()
      
      // Load initial notifications list and count
      fetchNotifications()
      fetchUnreadCount()
    } else {
      disconnect()
    }
  }, [isAuthenticated, connect, disconnect, fetchNotifications, fetchUnreadCount])

  // Subscribe to user notifications queue when WebSocket status becomes CONNECTED
  useEffect(() => {
    if (isAuthenticated && status === 'CONNECTED') {
      const unsubscribe = subscribe('/user/queue/notifications', (payload) => {
        addLiveNotification(payload as AppNotification)
      })
      return () => {
        unsubscribe()
      }
    }
  }, [isAuthenticated, status, subscribe, addLiveNotification])

  // While SessionInitializer is performing silent token refresh, show a
  // full-screen loader to prevent a flash-redirect to /login.
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState label="Verifying session…" />
      </div>
    )
  }

  if (!isAuthenticated) {
    // Preserve the attempted location so GuestLayout can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Authenticated — render child routes (DashboardLayout will be the next child)
  return <Outlet />
}
