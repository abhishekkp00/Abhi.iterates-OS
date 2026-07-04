import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/query-client'
import { AppRouter } from '@/routes/router'
import { useThemeStore } from '@/store/theme.store'
import { useEffect } from 'react'

/**
 * App — root provider wrapper.
 * Providers are ordered from outermost (infrastructure) to innermost (UI).
 */
function ThemeInitializer() {
  const { theme, setTheme } = useThemeStore()

  useEffect(() => {
    // Re-apply theme on mount (handles system preference changes)
    setTheme(theme)

    // Listen to system preference changes when theme is 'system'
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => { if (theme === 'system') setTheme('system') }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme, setTheme])

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      <AppRouter />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: 'font-sans text-sm',
          },
        }}
      />
    </QueryClientProvider>
  )
}
