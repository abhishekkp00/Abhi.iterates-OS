import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { AuthService } from '@/services/auth.service'

export function SessionInitializer() {
  const { accessToken, refreshToken, login, logout, setInitialized } = useAuthStore()

  useEffect(() => {
    async function restoreSession() {
      if (refreshToken && !accessToken) {
        try {
          const response = await AuthService.refresh(refreshToken)
          const { accessToken: newAccess, refreshToken: newRefresh, user } = response.data
          login(user, newAccess, newRefresh)
        } catch (error) {
          logout()
        } finally {
          setInitialized(true)
        }
      } else {
        setInitialized(true)
      }
    }
    restoreSession()
  }, [refreshToken, accessToken, login, logout, setInitialized])

  return null
}
