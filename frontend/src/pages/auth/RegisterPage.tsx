import { AuthCard } from '@/components/common/AuthCard'
import { AuthHeader } from '@/components/common/AuthHeader'
import { AuthFooter } from '@/components/common/AuthFooter'
import { RegisterForm } from '@/features/auth/components/RegisterForm'

export default function RegisterPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="Create your account"
        subtitle="Get started with AbhiIterates.OS today"
      />
      <RegisterForm />
      <AuthFooter
        message="Already have an account?"
        linkText="Sign in"
        linkHref="/login"
      />
    </AuthCard>
  )
}
