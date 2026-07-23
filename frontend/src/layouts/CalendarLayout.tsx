import { Outlet, Link, useLocation } from 'react-router-dom'
import { Calendar, CalendarRange, Clock } from 'lucide-react'

export default function CalendarLayout() {
  const location = useLocation()
  const currentPath = location.pathname

  const navItems = [
    { label: 'Month View', path: '/calendar/month', icon: Calendar },
    { label: 'Week View', path: '/calendar/week', icon: CalendarRange },
    { label: 'Day View', path: '/calendar/day', icon: Clock },
  ]

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden p-6 max-w-7xl mx-auto w-full gap-6">
      {/* Calendar Header with Sub-navigation tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Interactive Calendar</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Browse and schedule your events, lectures, and session details.
          </p>
        </div>

        {/* Tab Links */}
        <div className="flex bg-muted/40 p-1 rounded-lg border border-border/40 shrink-0 self-start sm:self-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main Content nested pages */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
