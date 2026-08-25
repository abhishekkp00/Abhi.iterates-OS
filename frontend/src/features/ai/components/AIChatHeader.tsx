import { Bot, StopCircle, PanelLeftOpen, GradCap, Sparkles } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { useAIStore } from '@/features/ai/store/ai.store'
import type { TutorMode } from '@/types/ai'

interface AIChatHeaderProps {
  title: string
  isStreaming: boolean
  onStop: () => void
  topicId?: string
  tutorMode?: TutorMode
  onModeChange?: (mode: TutorMode) => void
}

const TUTOR_MODES: { value: TutorMode; label: string }[] = [
  { value: 'EXPLAIN', label: 'Explain' },
  { value: 'SUMMARY', label: 'Summary' },
  { value: 'DEEP_DIVE', label: 'Deep Dive' },
  { value: 'REVISION', label: 'Revision' },
  { value: 'QUESTION', label: 'Question' },
]

export function AIChatHeader({
  title,
  isStreaming,
  onStop,
  topicId,
  tutorMode = 'EXPLAIN',
  onModeChange,
}: AIChatHeaderProps) {
  const sidebarCollapsed = useAIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAIStore((s) => s.toggleSidebar)

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        {sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 cursor-pointer"
            onClick={toggleSidebar}
            aria-label="Open sidebar"
          >
            <PanelLeftOpen className="size-4" />
          </Button>
        )}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100">
          <Bot className="size-4 text-indigo-600" />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
          {topicId && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-medium text-[10px] rounded-full uppercase tracking-wider flex items-center space-x-1 shrink-0">
              <Sparkles className="size-3 inline text-indigo-600" />
              <span>Topic Tutor</span>
            </span>
          )}
        </div>
        {isStreaming && (
          <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Generating…
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        {/* Tutor Mode Selector */}
        {topicId && onModeChange && (
          <div className="flex items-center space-x-1.5 bg-slate-100 px-2 py-1 rounded-lg text-xs">
            <GradCap className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={tutorMode}
              onChange={(e) => onModeChange(e.target.value as TutorMode)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              {TUTOR_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  Mode: {m.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {isStreaming && (
          <Button
            id="ai-stop-btn"
            variant="outline"
            size="sm"
            onClick={onStop}
            className="gap-1.5 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
            aria-label="Stop AI generation"
          >
            <StopCircle className="size-4" />
            Stop
          </Button>
        )}
      </div>
    </header>
  )
}
