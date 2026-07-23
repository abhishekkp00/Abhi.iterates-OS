import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, RegisterPayload } from '@/types/auth.payload'
import { useAuth } from '../hooks/useAuth'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/button'
import { Mail, User as UserIcon, Loader2 } from '@/lib/icons'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { API_BASE_URL } from '@/constants/app'

function GoogleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

export function RegisterForm() {
  const { register: signup, isRegistering } = useAuth()
  const [passwordValue, setPasswordValue] = useState('')
  const [strength, setStrength] = useState({
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
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  })

  // Watch password field to update strength indicator
  const watchedPassword = watch('password')

  useEffect(() => {
    const val = watchedPassword || ''
    setPasswordValue(val)
    
    const hasLength = val.length >= 8
    const hasUpper = /[A-Z]/.test(val)
    const hasLower = /[a-z]/.test(val)
    const hasNumber = /[0-9]/.test(val)
    const hasSpecial = /[^a-zA-Z0-9]/.test(val)

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
  }, [watchedPassword])

  const onSubmit = (data: RegisterPayload) => {
    signup(data)
  }

  const handleGoogleSignup = () => {
    toast.info('Initiating Google Sign-up...')
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`
  }

  // Determine strength label & color
  const strengthLabels = ['Empty', 'Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong']
  const strengthColors = [
    'bg-muted',
    'bg-destructive',
    'bg-destructive/80',
    'bg-warning',
    'bg-success/80',
    'bg-success',
  ]

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2 h-10 border-border/80 font-medium hover:bg-accent/50"
        onClick={handleGoogleSignup}
      >
        <GoogleIcon className="size-4" />
        <span>Sign up with Google</span>
      </Button>

      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
          <span className="bg-card px-2 text-muted-foreground font-medium">Or sign up with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            type="text"
            placeholder="Abhishek"
            error={errors.firstName?.message}
            {...register('firstName')}
            autoComplete="given-name"
          />
          <Input
            label="Last name"
            type="text"
            placeholder="Patel"
            error={errors.lastName?.message}
            {...register('lastName')}
            autoComplete="family-name"
          />
        </div>

        <Input
          label="Username"
          type="text"
          placeholder="abhi_iterates"
          leftIcon={<UserIcon className="size-4" />}
          error={errors.username?.message}
          {...register('username')}
          autoComplete="username"
        />

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="size-4" />}
          error={errors.email?.message}
          {...register('email')}
          autoComplete="email"
        />

        <div className="space-y-2">
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
            autoComplete="new-password"
          />
          
          {/* Password Strength Indicator */}
          {passwordValue && (
            <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
              <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                <span>Password strength</span>
                <span className="font-semibold">{strengthLabels[strength.score]}</span>
              </div>
              
              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      level <= strength.score ? strengthColors[strength.score] : 'bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>

              {/* Checklist */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1.5 text-[9px] text-muted-foreground">
                <div className={`flex items-center gap-1 ${strength.hasLength ? 'text-success' : ''}`}>
                  <span>●</span> Min 8 characters
                </div>
                <div className={`flex items-center gap-1 ${strength.hasUpper ? 'text-success' : ''}`}>
                  <span>●</span> One uppercase letter
                </div>
                <div className={`flex items-center gap-1 ${strength.hasLower ? 'text-success' : ''}`}>
                  <span>●</span> One lowercase letter
                </div>
                <div className={`flex items-center gap-1 ${strength.hasNumber ? 'text-success' : ''}`}>
                  <span>●</span> One number
                </div>
                <div className={`flex items-center gap-1 ${strength.hasSpecial ? 'text-success' : ''} col-span-2`}>
                  <span>●</span> One special character (!@#$ etc.)
                </div>
              </div>
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          disabled={isRegistering}
        >
          {isRegistering ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>
    </div>
  )
}

