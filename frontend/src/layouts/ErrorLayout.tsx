import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from '@/lib/icons'

/**
 * Error layout — catches route-level errors and displays a clean error boundary.
 */
export function ErrorLayout() {
  const error = useRouteError()

  const is404 = isRouteErrorResponse(error) && error.status === 404
  const title = is404 ? '404 — Page Not Found' : 'Something went wrong'
  const message = is404
    ? "The page you're looking for doesn't exist or has been moved."
    : 'An unexpected error occurred. Our team has been notified.'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <div className="space-y-2">
        <p className="text-5xl font-bold text-muted-foreground/30">{is404 ? '404' : '500'}</p>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="size-4" />
          Go back
        </Button>
        <Link to="/">
          <Button size="sm">
            <Home className="size-4" />
            Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
