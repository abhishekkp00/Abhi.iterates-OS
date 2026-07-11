import { useSearchParams, Link } from 'react-router-dom'
import { AuthCard } from '@/components/common/AuthCard'
import { Button } from '@/components/ui/button'
import { ShieldAlert, ArrowLeft, LogIn } from '@/lib/icons'

export default function UnauthorizedPage() {
  const [searchParams] = useSearchParams()
  const isBreach = searchParams.get('breach') === 'true'

  const title = isBreach ? 'Security Alert' : 'Unauthorized Access'
  const subtitle = isBreach
    ? 'A potential security breach (token reuse) was detected. All active sessions have been terminated to safeguard your data.'
    : 'You do not have permission to view this page. Please contact your administrator if you believe this is an error.'

  return (
    <AuthCard>
      <div className="flex flex-col items-center text-center space-y-4 py-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-sm">
          <ShieldAlert className="size-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
        </div>

        <div className="flex flex-col w-full gap-2 pt-4">
          <Link to="/login" className="w-full">
            <Button className="w-full">
              <LogIn className="size-4" />
              Sign in again
            </Button>
          </Link>
          <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
            <ArrowLeft className="size-4" />
            Go back
          </Button>
        </div>
      </div>
    </AuthCard>
  )
}
