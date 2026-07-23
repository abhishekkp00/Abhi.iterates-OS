import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ProtectedLayout } from '@/layouts/ProtectedLayout'
import { AdminGuard } from '@/components/common/AdminGuard'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { GuestLayout } from '@/layouts/GuestLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { ErrorLayout } from '@/layouts/ErrorLayout'
import { LoadingState } from '@/components/ui/feedback'

// ── Public ────────────────────────────────────────────────────────────────────
const LandingPage = lazy(() => import('@/pages/LandingPage'))

// ── Auth (guest-only) ─────────────────────────────────────────────────────────
const LoginPage           = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage        = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage  = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage   = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const UnauthorizedPage    = lazy(() => import('@/pages/auth/UnauthorizedPage'))
const SessionExpiredPage  = lazy(() => import('@/pages/auth/SessionExpiredPage'))

// ── Main dashboard pages ──────────────────────────────────────────────────────
const DashboardPage   = lazy(() => import('@/pages/DashboardPage'))
const LibraryPage     = lazy(() => import('@/pages/LibraryPage'))
const MarketplacePage = lazy(() => import('@/pages/MarketplacePage'))
const StudyRoomPage = lazy(() => import('@/pages/StudyRoomPage'))
const ResourcesLayout = lazy(() => import('@/layouts/ResourcesLayout'))
const ResourcesPage   = lazy(() => import('@/pages/ResourcesPage'))
const ResourceCreatePage = lazy(() => import('@/pages/ResourceCreatePage'))
const ResourceDetailPage = lazy(() => import('@/pages/ResourceDetailPage'))
const ResourceEditPage   = lazy(() => import('@/pages/ResourceEditPage'))
const AIChatLayout = lazy(() => import('@/layouts/AIChatLayout').then(m => ({ default: m.AIChatLayout })))
const AIPage        = lazy(() => import('@/pages/AIPage'))
const AIChatPage    = lazy(() => import('@/pages/AIChatPage'))
const AIToolsPage    = lazy(() => import('@/pages/AIToolsPage'))
const AIHistoryPage  = lazy(() => import('@/pages/AIHistoryPage'))
const ProfilePage     = lazy(() => import('@/pages/ProfilePage'))

// ── Productivity Hub ─────────────────────────────────────────────────────────
const PlannerPage       = lazy(() => import('@/pages/PlannerPage'))
const TasksPage         = lazy(() => import('@/pages/TasksPage'))
const CalendarLayout    = lazy(() => import('@/layouts/CalendarLayout'))
const CalendarDayPage   = lazy(() => import('@/pages/CalendarDayPage'))
const CalendarWeekPage  = lazy(() => import('@/pages/CalendarWeekPage'))
const CalendarMonthPage = lazy(() => import('@/pages/CalendarMonthPage'))


// ── Real-Time Collaboration & Notifications ─────────────────────────────────
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const ActivityPage      = lazy(() => import('@/pages/ActivityPage'))
const CommentsPage      = lazy(() => import('@/pages/CommentsPage'))

// ── Settings shell + sub-pages ────────────────────────────────────────────────
// SettingsLayout is lazy so it's excluded from the initial bundle.
// Each settings section is its own chunk — users only download what they open.
const SettingsLayout        = lazy(() => import('@/layouts/SettingsLayout'))
const ProfileSettings       = lazy(() => import('@/pages/settings/ProfileSettings'))
const SecuritySettings      = lazy(() => import('@/pages/settings/SecuritySettings'))
const NotificationsSettings = lazy(() => import('@/pages/settings/NotificationsSettings'))
const AppearanceSettings    = lazy(() => import('@/pages/settings/AppearanceSettings'))

// ── Analytics ────────────────────────────────────────────────────────────────
const AnalyticsDashboard     = lazy(() => import('@/pages/analytics/AnalyticsDashboard'))
const ProductivityAnalytics  = lazy(() => import('@/pages/analytics/ProductivityAnalytics'))
const AiAnalytics            = lazy(() => import('@/pages/analytics/AiAnalytics'))
const ResourceAnalytics      = lazy(() => import('@/pages/analytics/ResourceAnalytics'))
const AdminAnalytics         = lazy(() => import('@/pages/admin/AdminAnalytics'))

// ── Admin Portal ─────────────────────────────────────────────────────────────
const AdminLayout     = lazy(() => import('@/layouts/AdminLayout'))
const AdminDashboard  = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminUsers      = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminResources  = lazy(() => import('@/pages/admin/AdminResources'))
const AdminMarketplace= lazy(() => import('@/pages/admin/AdminMarketplace'))
const AdminAi         = lazy(() => import('@/pages/admin/AdminAi'))
const AdminSettings   = lazy(() => import('@/pages/admin/AdminSettings'))
const AdminAudit      = lazy(() => import('@/pages/admin/AdminAudit'))

// Shared suspense fallback — used across all lazy-loaded routes
const PageLoader = () => <LoadingState label="Loading…" />

const router = createBrowserRouter([
  // ── Public landing ─────────────────────────────────────────────────────────
  {
    element: <PublicLayout />,
    errorElement: <ErrorLayout />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<PageLoader />}><LandingPage /></Suspense>,
      },
    ],
  },

  // ── Guest-only auth routes ─────────────────────────────────────────────────
  // GuestLayout redirects authenticated users away to /dashboard.
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
  //
  // Layer 1 — ProtectedLayout: pure auth guard, no visual UI.
  //           Redirects to /login if not authenticated.
  //
  // Layer 2 — DashboardLayout: visual application shell (sidebar, navbar).
  //           Shared by all dashboard pages.
  //
  // Layer 3 — SettingsLayout: inner shell for /settings/* routes.
  //           Has its own left-nav for settings categories.
  //
  // Why three layers?
  //   Auth, layout, and domain concerns are each independently testable and swappable.
  //   Future admin-only routes can reuse ProtectedLayout with a different layout shell.
  {
    element: <ProtectedLayout />,
    errorElement: <ErrorLayout />,
    children: [
      {
        element: <DashboardLayout />,
        children: [

          // Default protected route — redirect bare-path visitors to /dashboard
          // This handles cases where users somehow land on an unmatched protected URL.
          // Note: the root '/' is handled by PublicLayout (LandingPage), not here.

          // ── Core pages ────────────────────────────────────────────────────
          {
            path: '/dashboard',
            element: <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>,
          },
          {
            path: '/library',
            element: <Suspense fallback={<PageLoader />}><LibraryPage /></Suspense>,
          },
          {
            path: '/marketplace',
            element: <Suspense fallback={<PageLoader />}><MarketplacePage /></Suspense>,
          },
          {
            path: '/my-listings',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '/favorites',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '/resources',
            element: <Suspense fallback={<PageLoader />}><ResourcesLayout /></Suspense>,
            children: [
              {
                index: true,
                element: <Suspense fallback={<PageLoader />}><ResourcesPage /></Suspense>,
              },
              {
                path: 'new',
                element: <Suspense fallback={<PageLoader />}><ResourceCreatePage /></Suspense>,
              },
              {
                path: ':id',
                element: <Suspense fallback={<PageLoader />}><ResourceDetailPage /></Suspense>,
              },
              {
                path: ':id/edit',
                element: <Suspense fallback={<PageLoader />}><ResourceEditPage /></Suspense>,
              },
              {
                path: 'study/:resourceId',
                element: <Suspense fallback={<PageLoader />}><StudyRoomPage /></Suspense>,
              },
            ],
          },
          {
            path: '/ai',
            element: <Suspense fallback={<PageLoader />}><AIChatLayout /></Suspense>,
            children: [
              {
                index: true,
                element: <Suspense fallback={<PageLoader />}><AIPage /></Suspense>,
              },
              {
                path: 'chat/:conversationId',
                element: <Suspense fallback={<PageLoader />}><AIChatPage /></Suspense>,
              },
              {
                path: 'tools',
                element: <Suspense fallback={<PageLoader />}><AIToolsPage /></Suspense>,
              },
              {
                path: 'history',
                element: <Suspense fallback={<PageLoader />}><AIHistoryPage /></Suspense>,
              },
            ],
          },
          {
            path: '/planner',
            element: <Suspense fallback={<PageLoader />}><PlannerPage /></Suspense>,
          },
          {
            path: '/tasks',
            element: <Suspense fallback={<PageLoader />}><TasksPage /></Suspense>,
          },
          {
            path: '/calendar',
            element: <Suspense fallback={<PageLoader />}><CalendarLayout /></Suspense>,
            children: [
              {
                index: true,
                element: <Navigate to="/calendar/month" replace />,
              },
              {
                path: 'day',
                element: <Suspense fallback={<PageLoader />}><CalendarDayPage /></Suspense>,
              },
              {
                path: 'week',
                element: <Suspense fallback={<PageLoader />}><CalendarWeekPage /></Suspense>,
              },
              {
                path: 'month',
                element: <Suspense fallback={<PageLoader />}><CalendarMonthPage /></Suspense>,
              },
            ],
          },


          // ── Analytics ──────────────────────────────────────────────────────
          {
            path: '/analytics',
            element: <Suspense fallback={<PageLoader />}><AnalyticsDashboard /></Suspense>,
          },
          {
            path: '/analytics/productivity',
            element: <Suspense fallback={<PageLoader />}><ProductivityAnalytics /></Suspense>,
          },
          {
            path: '/analytics/ai',
            element: <Suspense fallback={<PageLoader />}><AiAnalytics /></Suspense>,
          },
          {
            path: '/analytics/resources',
            element: <Suspense fallback={<PageLoader />}><ResourceAnalytics /></Suspense>,
          },
          {
            path: '/analytics/marketplace',
            element: <Navigate to="/dashboard" replace />,
          },

          // ── Real-Time Collaboration & Notifications ───────────────────────
          {
            path: '/notifications',
            element: <Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense>,
          },
          {
            path: '/activity',
            element: <Suspense fallback={<PageLoader />}><ActivityPage /></Suspense>,
          },
          {
            path: '/comments',
            element: <Suspense fallback={<PageLoader />}><CommentsPage /></Suspense>,
          },

          // ── Profile page ──────────────────────────────────────────────────
          // /profile — public-facing profile card (distinct from /settings/profile)
          {
            path: '/profile',
            element: <Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>,
          },

          // ── Settings (nested routes) ──────────────────────────────────────
          // SettingsLayout renders a left-nav + <Outlet />.
          // The index redirect means /settings alone always shows /settings/profile.
          {
            path: '/settings',
            element: <Suspense fallback={<PageLoader />}><SettingsLayout /></Suspense>,
            children: [
              {
                index: true,
                element: <Navigate to="/settings/profile" replace />,
              },
              {
                path: 'profile',
                element: <Suspense fallback={<PageLoader />}><ProfileSettings /></Suspense>,
              },
              {
                path: 'security',
                element: <Suspense fallback={<PageLoader />}><SecuritySettings /></Suspense>,
              },
              {
                path: 'notifications',
                element: <Suspense fallback={<PageLoader />}><NotificationsSettings /></Suspense>,
              },
              {
                path: 'appearance',
                element: <Suspense fallback={<PageLoader />}><AppearanceSettings /></Suspense>,
              },
              // Future settings sections — add new children here without router restructuring
              // { path: 'billing',    element: ... },
              // { path: 'api-keys',   element: ... },
              // { path: 'integrations', element: ... },
            ],
          },
        ],
      },
      // ── Admin Pages (Guarded by AdminGuard) ──
      {
        element: <AdminGuard />,
        children: [
          {
            element: <Suspense fallback={<PageLoader />}><AdminLayout /></Suspense>,
            children: [
              { path: '/admin', element: <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense> },
              { path: '/admin/users', element: <Suspense fallback={<PageLoader />}><AdminUsers /></Suspense> },
              { path: '/admin/resources', element: <Suspense fallback={<PageLoader />}><AdminResources /></Suspense> },
              { path: '/admin/marketplace', element: <Suspense fallback={<PageLoader />}><AdminMarketplace /></Suspense> },
              { path: '/admin/ai', element: <Suspense fallback={<PageLoader />}><AdminAi /></Suspense> },
              { path: '/admin/settings', element: <Suspense fallback={<PageLoader />}><AdminSettings /></Suspense> },
              { path: '/admin/audit', element: <Suspense fallback={<PageLoader />}><AdminAudit /></Suspense> },
              { path: '/admin/analytics', element: <Suspense fallback={<PageLoader />}><AdminAnalytics /></Suspense> },
            ],
          },
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
