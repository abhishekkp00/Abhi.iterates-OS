import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, RegisterPayload } from '@/types/auth.payload'
import { useAuth } from '../hooks/useAuth'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/button'
import { Mail, User as UserIcon, Loader2 } from '@/lib/icons'
import { useState, useEffect } from 'react'

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
  )
}
