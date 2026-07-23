import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export function AdminGuard() {
  const user = useAuthStore((s) => s.user)

  if (!user || (!user.roles.includes('ROLE_ADMIN') && !user.roles.includes('ADMIN'))) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
