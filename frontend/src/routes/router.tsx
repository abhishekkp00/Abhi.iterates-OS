import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedLayout } from '@/layouts/ProtectedLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { GuestLayout } from '@/layouts/GuestLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { ErrorLayout } from '@/layouts/ErrorLayout'
import { LoadingState } from '@/components/ui/feedback'

// ── Public page ───────────────────────────────────────────────────────────────
const LandingPage        = lazy(() => import('@/pages/LandingPage'))

// ── Auth pages (guest-only) ───────────────────────────────────────────────────
const LoginPage          = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage       = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage  = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const UnauthorizedPage   = lazy(() => import('@/pages/auth/UnauthorizedPage'))
const SessionExpiredPage = lazy(() => import('@/pages/auth/SessionExpiredPage'))

// ── Protected dashboard pages ─────────────────────────────────────────────────
const DashboardPage   = lazy(() => import('@/pages/DashboardPage'))
const LibraryPage     = lazy(() => import('@/pages/LibraryPage'))
const MarketplacePage = lazy(() => import('@/pages/MarketplacePage'))
const ResourcesPage   = lazy(() => import('@/pages/ResourcesPage'))
const AIWorkspacePage = lazy(() => import('@/pages/AIWorkspacePage'))
const SettingsPage    = lazy(() => import('@/pages/SettingsPage'))

// Shared suspense fallback
const PageLoader = () => <LoadingState label="Loading page…" />

const router = createBrowserRouter([
  // ── Public landing ─────────────────────────────────────────────────────────
  {
    element: <PublicLayout />,
    errorElement: <ErrorLayout />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><LandingPage /></Suspense> },
    ],
  },

  // ── Guest-only auth routes ─────────────────────────────────────────────────
  // GuestLayout redirects authenticated users to /dashboard.
  {
    element: <GuestLayout />,
    errorElement: <ErrorLayout />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/login',          element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense> },
          { path: '/register',       element: <Suspense fallback={<PageLoader />}><RegisterPage /></Suspense> },
          { path: '/forgot-password',element: <Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense> },
          { path: '/reset-password', element: <Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense> },
          { path: '/unauthorized',   element: <Suspense fallback={<PageLoader />}><UnauthorizedPage /></Suspense> },
          { path: '/session-expired',element: <Suspense fallback={<PageLoader />}><SessionExpiredPage /></Suspense> },
        ],
      },
    ],
  },

  // ── Authenticated routes ───────────────────────────────────────────────────
  // Two-layer nesting:
  //   ProtectedLayout  →  auth guard (redirects to /login if not authenticated)
  //     DashboardLayout  →  visual shell (sidebar, navbar, content area)
  //       Page components
  //
  // Why two layers?
  //   ProtectedLayout is a pure auth concern — no UI, easy to test in isolation.
  //   DashboardLayout is a pure layout concern — no auth logic.
  //   Future: admin routes can share ProtectedLayout but use a different layout.
  {
    element: <ProtectedLayout />,
    errorElement: <ErrorLayout />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard',   element: <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense> },
          { path: '/library',     element: <Suspense fallback={<PageLoader />}><LibraryPage /></Suspense> },
          { path: '/marketplace', element: <Suspense fallback={<PageLoader />}><MarketplacePage /></Suspense> },
          { path: '/resources',   element: <Suspense fallback={<PageLoader />}><ResourcesPage /></Suspense> },
          { path: '/ai',          element: <Suspense fallback={<PageLoader />}><AIWorkspacePage /></Suspense> },
          { path: '/settings',    element: <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense> },
        ],
      },
    ],
  },

  // ── 404 catch-all ──────────────────────────────────────────────────────────
  { path: '*', element: <ErrorLayout /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
