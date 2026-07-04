import { AuthCard } from '@/components/common/AuthCard'
import { AuthHeader } from '@/components/common/AuthHeader'
import { AuthFooter } from '@/components/common/AuthFooter'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="Forgot password"
        subtitle="Enter your email to receive a reset link"
      />
      <ForgotPasswordForm />
      <AuthFooter
        message="Remember your password?"
        linkText="Sign in"
        linkHref="/login"
      />
    </AuthCard>
  )
}
