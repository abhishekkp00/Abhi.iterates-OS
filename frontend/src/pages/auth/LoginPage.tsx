import { AuthCard } from '@/components/common/AuthCard'
import { AuthHeader } from '@/components/common/AuthHeader'
import { AuthFooter } from '@/components/common/AuthFooter'
import { LoginForm } from '@/features/auth/components/LoginForm'

export default function LoginPage() {
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
