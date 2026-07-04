import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedLayout } from '@/layouts/ProtectedLayout'
import { GuestLayout } from '@/layouts/GuestLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { ErrorLayout } from '@/layouts/ErrorLayout'
import { LoadingState } from '@/components/ui/feedback'

// Lazy-load public page
const LandingPage       = lazy(() => import('@/pages/LandingPage'))

// Lazy-load auth pages
const LoginPage         = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage      = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage  = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const UnauthorizedPage  = lazy(() => import('@/pages/auth/UnauthorizedPage'))
const SessionExpiredPage = lazy(() => import('@/pages/auth/SessionExpiredPage'))

// Lazy-load protected pages
const DashboardPage     = lazy(() => import('@/pages/DashboardPage'))
const LibraryPage       = lazy(() => import('@/pages/LibraryPage'))
const MarketplacePage   = lazy(() => import('@/pages/MarketplacePage'))
const ResourcesPage     = lazy(() => import('@/pages/ResourcesPage'))
const AIWorkspacePage   = lazy(() => import('@/pages/AIWorkspacePage'))
const SettingsPage      = lazy(() => import('@/pages/SettingsPage'))

// Suspense fallback shared across all lazy routes
const PageLoader = () => <LoadingState label="Loading page…" />

const router = createBrowserRouter([
  // ── Public landing route
  {
    element: <PublicLayout />,
    errorElement: <ErrorLayout />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><LandingPage /></Suspense> },
    ],
  },

  // ── Guest-only auth routes (redirect to /dashboard if logged in)
  {
    element: <GuestLayout />,
    errorElement: <ErrorLayout />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/login', element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense> },
          { path: '/register', element: <Suspense fallback={<PageLoader />}><RegisterPage /></Suspense> },
          { path: '/forgot-password', element: <Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense> },
          { path: '/reset-password', element: <Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense> },
          { path: '/unauthorized', element: <Suspense fallback={<PageLoader />}><UnauthorizedPage /></Suspense> },
          { path: '/session-expired', element: <Suspense fallback={<PageLoader />}><SessionExpiredPage /></Suspense> },
        ],
      },
    ],
  },

  // ── Authenticated routes (guarded + sidebar/navbar shell)
  {
    element: <ProtectedLayout />,
    errorElement: <ErrorLayout />,
    children: [
      { path: '/dashboard',   element: <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense> },
      { path: '/library',     element: <Suspense fallback={<PageLoader />}><LibraryPage /></Suspense> },
      { path: '/marketplace', element: <Suspense fallback={<PageLoader />}><MarketplacePage /></Suspense> },
      { path: '/resources',   element: <Suspense fallback={<PageLoader />}><ResourcesPage /></Suspense> },
      { path: '/ai',          element: <Suspense fallback={<PageLoader />}><AIWorkspacePage /></Suspense> },
      { path: '/settings',    element: <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense> },
    ],
  },

  // ── 404 catch-all
  { path: '*', element: <ErrorLayout /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
