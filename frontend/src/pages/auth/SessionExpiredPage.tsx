import { Link } from 'react-router-dom'
import { AuthCard } from '@/components/common/AuthCard'
import { Button } from '@/components/ui/button'
import { Clock, LogIn } from '@/lib/icons'

export default function SessionExpiredPage() {
  return (
    <AuthCard>
      <div className="flex flex-col items-center text-center space-y-4 py-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-sm animate-pulse">
          <Clock className="size-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Session Expired</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your login session has expired for security reasons. Please log in again to continue working.
          </p>
        </div>

        <div className="w-full pt-4">
          <Link to="/login" className="w-full">
            <Button className="w-full">
              <LogIn className="size-4" />
              Sign in to Workspace
            </Button>
          </Link>
        </div>
      </div>
    </AuthCard>
  )
}
