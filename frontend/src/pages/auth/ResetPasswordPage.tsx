import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { AuthCard } from '@/components/common/AuthCard'
import { AuthHeader } from '@/components/common/AuthHeader'
import { AuthFooter } from '@/components/common/AuthFooter'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2 } from '@/lib/icons'

const schema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain one uppercase letter')
    .regex(/[a-z]/, 'Must contain one lowercase letter')
    .regex(/[0-9]/, 'Must contain one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type FormValue = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = (_data: FormValue) => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setSubmitted(true)
    }, 1200)
  }

  if (submitted) {
    return (
      <AuthCard>
        <div className="text-center space-y-4 py-4">
          <div className="flex justify-center text-success animate-bounce">
            <CheckCircle2 className="size-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Password reset complete</h2>
            <p className="text-sm text-muted-foreground">
              Your password has been successfully updated. You can now sign in with your new credentials.
            </p>
          </div>
          <div className="pt-2">
            <Button className="w-full" onClick={() => window.location.href = '/login'}>
              Go to sign in
            </Button>
          </div>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Reset your password"
        subtitle="Please enter your new password below"
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordInput
          label="New Password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          label="Confirm New Password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Resetting password...
            </>
          ) : (
            'Reset password'
          )}
        </Button>
      </form>
      <AuthFooter
        message="Back to"
        linkText="Sign in"
        linkHref="/login"
      />
    </AuthCard>
  )
}
