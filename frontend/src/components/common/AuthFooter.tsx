import { Link } from 'react-router-dom'

interface AuthFooterProps {
  message: string
  linkText: string
  linkHref: string
}

export function AuthFooter({ message, linkText, linkHref }: AuthFooterProps) {
  return (
    <div className="mt-6 text-center text-xs text-slate-400">
      <span>{message} </span>
      <Link
        to={linkHref}
        className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        {linkText}
      </Link>
    </div>
  )
}
