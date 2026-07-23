import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  BookOpen,
  Sparkles,
  Settings,
  Activity,
  ArrowLeft,
} from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AdminLayout() {
  const location = useLocation()

  const menuItems = [
    { path: '/admin', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/users', label: 'User Registry', icon: Users },
    { path: '/admin/resources', label: 'Resource Mod', icon: BookOpen },
    { path: '/admin/ai', label: 'AI Review', icon: Sparkles },
    { path: '/admin/settings', label: 'System Config', icon: Settings },
    { path: '/admin/audit', label: 'Audit Trail', icon: Activity },
  ]

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-border/80 bg-card/60 backdrop-blur-md flex flex-col shrink-0">
        {/* Header Branding */}
        <div className="h-14 border-b border-border/60 flex items-center px-5 gap-2.5">
          <ShieldCheck className="size-5 text-primary" />
          <span className="font-bold text-sm tracking-wider uppercase text-foreground">
            OS Control
          </span>
        </div>

        {/* Back Link */}
        <div className="p-3 border-b border-border/40">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs font-semibold gap-2 h-8.5">
              <ArrowLeft className="size-3.5" />
              Student View
            </Button>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link key={item.path} to={item.path}>
                <button
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all duration-200',
                    active
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
                  )}
                >
                  <Icon className={cn('size-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
                  <span>{item.label}</span>
                </button>
              </Link>
            )
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-border/40 text-[10px] text-muted-foreground bg-muted/20">
          <div>Platform: v1.0.0-PROD</div>
          <div className="mt-1">Environment: Developer</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Secondary Header */}
        <header className="h-14 border-b border-border/60 bg-card/40 flex items-center justify-between px-6 shrink-0">
          <div className="text-xs font-semibold text-muted-foreground">
            System Operations / {location.pathname.substring(1).replaceAll('/', ' / ')}
          </div>
        </header>

        {/* Outlet Scrollable Area */}
        <div className="flex-1 overflow-y-auto bg-background/50">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
