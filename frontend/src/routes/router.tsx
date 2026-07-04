import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthenticatedLayout } from '@/layouts/AuthenticatedLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { ErrorLayout } from '@/layouts/ErrorLayout'
import { LoadingState } from '@/components/ui/feedback'

// Lazy-load all pages — reduces initial bundle size
const LandingPage       = lazy(() => import('@/pages/LandingPage'))
const DashboardPage     = lazy(() => import('@/pages/DashboardPage'))
const LibraryPage       = lazy(() => import('@/pages/LibraryPage'))
const MarketplacePage   = lazy(() => import('@/pages/MarketplacePage'))
const ResourcesPage     = lazy(() => import('@/pages/ResourcesPage'))
const AIWorkspacePage   = lazy(() => import('@/pages/AIWorkspacePage'))
const SettingsPage      = lazy(() => import('@/pages/SettingsPage'))

// Suspense fallback shared across all lazy routes
const PageLoader = () => <LoadingState label="Loading page…" />

const router = createBrowserRouter([
  // ── Public routes (no sidebar/navbar)
  {
    element: <PublicLayout />,
    errorElement: <ErrorLayout />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><LandingPage /></Suspense> },
    ],
  },

  // ── Authenticated routes (sidebar + navbar shell)
  {
    element: <AuthenticatedLayout />,
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
