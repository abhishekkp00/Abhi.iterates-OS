import { Outlet } from 'react-router-dom'
import { AIChatSidebar } from '@/features/ai/components/AIChatSidebar'

/**
 * AIChatLayout
 *
 * Full-viewport layout for the AI assistant. It completely overrides the
 * standard DashboardLayout scrollable content area by filling h-screen with
 * a two-column flex: sidebar | chat area.
 *
 * Routing:
 *   /ai               → AIEmptyState (no conversation selected)
 *   /ai/chat/:id      → active ChatPage rendered via <Outlet />
 */
export function AIChatLayout() {

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Conversation Sidebar ─────────────────────────────────────────── */}
      <AIChatSidebar />

      {/* ── Main chat area ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
