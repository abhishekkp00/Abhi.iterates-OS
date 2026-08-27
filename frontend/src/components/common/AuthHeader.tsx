import { Link } from 'react-router-dom'
import { GraduationCap } from '@/lib/icons'
import { APP_NAME } from '@/constants/app'

interface AuthHeaderProps {
  title: string
  subtitle: string
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-4 mb-6">
      <Link
        to="/"
        className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-xl p-1 transition-all"
        aria-label="Go to landing page"
      >
        <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md group-hover:scale-105 group-hover:bg-indigo-500 transition-all">
          <GraduationCap className="size-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors font-display">
          {APP_NAME}
        </span>
      </Link>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-white font-display">{title}</h2>
        <p className="text-sm text-slate-400 font-medium">{subtitle}</p>
      </div>
    </div>
  )
}
