import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { LoginPayload, RegisterPayload } from '@/types/auth.payload'
import { AxiosError } from 'axios'

export function useAuth() {
  const navigate = useNavigate()
  const loginStore = useAuthStore((s) => s.login)
  const logoutStore = useAuthStore((s) => s.logout)
  const refreshToken = useAuthStore((s) => s.refreshToken)

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => AuthService.login(payload),
    onSuccess: (data) => {
      const { user, accessToken, refreshToken: newRefreshToken } = data.data
      loginStore(user, accessToken, newRefreshToken)
      toast.success('Successfully logged in!', {
        description: `Welcome back, ${user.firstName}!`,
      })
      navigate('/dashboard')
    },
    onError: (error: unknown) => {
      const err = error as AxiosError<{ message?: string }>
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.'
      toast.error('Login Failed', {
        description: msg,
      })
    },
  })

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => AuthService.register(payload),
    onSuccess: (_data) => {
      toast.success('Registration successful!', {
        description: 'You can now log in to your workspace.',
      })
      navigate('/login')
    },
    onError: (error: unknown) => {
      const err = error as AxiosError<{ message?: string; data?: Record<string, string> }>
      const fieldErrors = err.response?.data?.data
      
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        // Show validation errors
        const firstErrorKey = Object.keys(fieldErrors)[0]!
        const firstErrorVal = fieldErrors[firstErrorKey]
        toast.error('Registration Failed', {
          description: `${firstErrorKey}: ${firstErrorVal}`,
        })
      } else {
        const msg = err.response?.data?.message || 'An error occurred during registration.'
        toast.error('Registration Failed', {
          description: msg,
        })
      }
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await AuthService.logout(refreshToken)
      }
    },
    onSettled: () => {
      logoutStore()
      toast.success('Logged out successfully.')
      navigate('/login')
    },
  })

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  }
}
