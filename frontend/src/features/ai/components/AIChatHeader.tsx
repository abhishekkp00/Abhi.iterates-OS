import { Bot, StopCircle, PanelLeftOpen } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { useAIStore } from '@/features/ai/store/ai.store'

interface AIChatHeaderProps {
  title: string
  isStreaming: boolean
  onStop: () => void
}

export function AIChatHeader({ title, isStreaming, onStop }: AIChatHeaderProps) {
  const sidebarCollapsed = useAIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAIStore((s) => s.toggleSidebar)

  return (
    <header className="flex items-center justify-between gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 shrink-0">
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
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Bot className="size-4 text-primary" />
        </div>
        <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
        {isStreaming && (
          <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Generating…
          </span>
        )}
      </div>

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
    </header>
  )
}
