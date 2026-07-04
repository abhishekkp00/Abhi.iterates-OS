import { Link } from 'react-router-dom'

interface AuthFooterProps {
  message: string
  linkText: string
  linkHref: string
}

export function AuthFooter({ message, linkText, linkHref }: AuthFooterProps) {
  return (
    <div className="mt-6 text-center text-xs text-muted-foreground">
      <span>{message} </span>
      <Link
        to={linkHref}
        className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
      >
        {linkText}
      </Link>
    </div>
  )
}
