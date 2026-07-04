import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle2 } from '@/lib/icons'
import { useState } from 'react'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
})

type FormValue = z.infer<typeof schema>

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
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
      <div className="text-center space-y-3 py-4">
        <div className="flex justify-center text-success">
          <CheckCircle2 className="size-10" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">Check your inbox</h3>
          <p className="text-xs text-muted-foreground">
            We've sent a password reset link to your email address if it is registered in our system.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        leftIcon={<Mail className="size-4" />}
        error={errors.email?.message}
        {...register('email')}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Sending reset link...' : 'Send reset link'}
      </Button>
    </form>
  )
}
