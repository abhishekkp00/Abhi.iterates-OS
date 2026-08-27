import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { type LoginPayload } from '@/types/auth.payload'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/button'
import { GoogleIcon } from '@/components/common/GoogleIcon'
import { Mail, Loader2 } from '@/lib/icons'
import { API_BASE_URL } from '@/constants/app'

export function LoginForm() {
  const { login, isLoggingIn } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginPayload>({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (data: LoginPayload) => {
    if (!data.email || !data.password) {
      toast.error('Validation Error', { description: 'Please enter both email and password.' })
      return
    }
    login(data)
  }

  const handleGoogleLogin = () => {
    toast.info('Connecting to Google OAuth...')
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2.5 h-11 border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl transition-all"
        onClick={handleGoogleLogin}
      >
        <GoogleIcon className="size-4" />
        <span>Continue with Google</span>
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-800" />
        </div>
        <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
          <span className="bg-[#151c2c] px-3 text-slate-400">Or sign in with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="size-4 text-slate-400" />}
          error={errors.email?.message}
          {...register('email', { required: 'Email address is required' })}
          autoComplete="email"
        />

        <div className="space-y-1.5">
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required' })}
            autoComplete="current-password"
          />
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin text-white" />
              <span>Signing in...</span>
            </div>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>
    </div>
  )
}
