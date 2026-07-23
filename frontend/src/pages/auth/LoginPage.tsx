import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthCard } from '@/components/common/AuthCard'
import { AuthHeader } from '@/components/common/AuthHeader'
import { AuthFooter } from '@/components/common/AuthFooter'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useAuthStore } from '@/store/auth.store'
import { AuthService } from '@/services/auth.service'
import { api } from '@/services/api'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const loginStore = useAuthStore((s) => s.login)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)

  useEffect(() => {
    const token = searchParams.get('token')
    const refreshToken = searchParams.get('refreshToken')
    const error = searchParams.get('error')

    if (error) {
      toast.error('Google Sign-in Failed', {
        description: 'Could not authenticate with Google. Please try again.',
      })
      return
    }

    if (token && refreshToken) {
      // Set access token temporarily to allow getMe call
      setAccessToken(token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      AuthService.getMe()
        .then((user) => {
          loginStore(user, token, refreshToken)
          toast.success('Successfully logged in with Google!', {
            description: `Welcome, ${user.firstName}!`,
          })
          navigate('/dashboard', { replace: true })
        })
        .catch((err) => {
          console.error('Failed to fetch user profile post Google OAuth', err)
          toast.error('Authentication Failed', {
            description: 'Could not load your profile. Please sign in again.',
          })
        })
    }
  }, [searchParams, setAccessToken, loginStore, navigate])

  return (
    <AuthCard>
      <AuthHeader
        title="Welcome back"
        subtitle="Sign in to your student workspace"
      />
      <LoginForm />
      <AuthFooter
        message="Don't have an account?"
        linkText="Sign up"
        linkHref="/register"
      />
    </AuthCard>
  )
}
