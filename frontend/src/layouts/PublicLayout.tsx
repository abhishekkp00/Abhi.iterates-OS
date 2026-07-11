import { Outlet } from 'react-router-dom'
import { GraduationCap } from '@/lib/icons'
import { APP_NAME, APP_TAGLINE } from '@/constants/app'

/**
 * PublicLayout — used for Landing, Login, Signup pages.
 * Minimal branding header, centered content.
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal top bar */}
      <header className="flex h-14 items-center border-b border-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4" />
          </div>
          <span className="text-sm font-semibold">{APP_NAME}</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Outlet />
      </main>

      <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
        {APP_TAGLINE} · © {new Date().getFullYear()} {APP_NAME}
      </footer>
    </div>
  )
}
