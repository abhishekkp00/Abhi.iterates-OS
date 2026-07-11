import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { LoadingState } from '@/components/ui/feedback'

/**
 * ProtectedLayout — auth guard ONLY.
 * Does not render any visual layout. Visual shell is handled by DashboardLayout.
 * This separation keeps auth logic and layout logic independently testable.
 */
export function ProtectedLayout() {
  const { isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

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
