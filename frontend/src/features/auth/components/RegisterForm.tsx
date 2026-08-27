import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { type RegisterPayload } from '@/types/auth.payload'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/button'
import { GoogleIcon } from '@/components/common/GoogleIcon'
import { Mail, User as UserIcon, Loader2 } from '@/lib/icons'
import { API_BASE_URL } from '@/constants/app'

interface PasswordStrength {
  score: number
  hasLength: boolean
  hasUpper: boolean
  hasLower: boolean
  hasNumber: boolean
  hasSpecial: boolean
}

export function RegisterForm() {
  const { register: registerUser, isRegistering } = useAuth()

  const [strength, setStrength] = useState<PasswordStrength>({
    score: 0,
    hasLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterPayload>({
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
    },
  })

  const passwordValue = watch('password', '')

  useEffect(() => {
    if (!passwordValue) {
      setStrength({
        score: 0,
        hasLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false,
      })
      return
    }

    const hasLength = passwordValue.length >= 8
    const hasUpper = /[A-Z]/.test(passwordValue)
    const hasLower = /[a-z]/.test(passwordValue)
    const hasNumber = /[0-9]/.test(passwordValue)
    const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue)

    let score = 0
    if (hasLength) score += 1
    if (hasUpper) score += 1
    if (hasLower) score += 1
    if (hasNumber) score += 1
    if (hasSpecial) score += 1

    setStrength({
      score,
      hasLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    })
  }, [passwordValue])

  const onSubmit = (data: RegisterPayload) => {
    if (!data.email || !data.password || !data.username || !data.firstName) {
      toast.error('Validation Error', { description: 'Please fill in all required fields.' })
      return
    }
    registerUser(data)
  }

  const handleGoogleSignup = () => {
    toast.info('Connecting to Google OAuth...')
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`
  }

  const strengthLabels = ['Empty', 'Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong']
  const strengthColors = [
    'bg-slate-800',
    'bg-rose-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-emerald-500',
    'bg-emerald-400',
  ]

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2.5 h-11 border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl transition-all"
        onClick={handleGoogleSignup}
      >
        <GoogleIcon className="size-4" />
        <span>Continue with Google</span>
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-800" />
        </div>
        <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
          <span className="bg-[#151c2c] px-3 text-slate-400">Or sign up with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            type="text"
            placeholder="Abhishek"
            error={errors.firstName?.message}
            {...register('firstName', { required: 'First name is required' })}
            autoComplete="given-name"
          />
          <Input
            label="Last name"
            type="text"
            placeholder="Patel"
            error={errors.lastName?.message}
            {...register('lastName', { required: 'Last name is required' })}
            autoComplete="family-name"
          />
        </div>

        <Input
          label="Username"
          type="text"
          placeholder="abhi_iterates"
          leftIcon={<UserIcon className="size-4 text-slate-400" />}
          error={errors.username?.message}
          {...register('username', { required: 'Username is required' })}
          autoComplete="username"
        />

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="size-4 text-slate-400" />}
          error={errors.email?.message}
          {...register('email', { required: 'Email address is required' })}
          autoComplete="email"
        />

        <div className="space-y-2">
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required' })}
            autoComplete="new-password"
          />

          {passwordValue && (
            <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
                <span>Password Strength</span>
                <span className="text-indigo-400">{strengthLabels[strength.score]}</span>
              </div>

              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      level <= strength.score ? strengthColors[strength.score] : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[9px] font-medium text-slate-400">
                <div className={`flex items-center gap-1 ${strength.hasLength ? 'text-emerald-400' : ''}`}>
                  <span>●</span> Min 8 characters
                </div>
                <div className={`flex items-center gap-1 ${strength.hasUpper ? 'text-emerald-400' : ''}`}>
                  <span>●</span> One uppercase letter
                </div>
                <div className={`flex items-center gap-1 ${strength.hasLower ? 'text-emerald-400' : ''}`}>
                  <span>●</span> One lowercase letter
                </div>
                <div className={`flex items-center gap-1 ${strength.hasNumber ? 'text-emerald-400' : ''}`}>
                  <span>●</span> One number
                </div>
                <div className={`flex items-center gap-1 ${strength.hasSpecial ? 'text-emerald-400' : ''} col-span-2`}>
                  <span>●</span> One special character (!@#$ etc.)
                </div>
              </div>
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all mt-2"
          disabled={isRegistering}
        >
          {isRegistering ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin text-white" />
              <span>Creating account...</span>
            </div>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>
    </div>
  )
}
