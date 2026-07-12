import { Bot } from '@/lib/icons'

/** Three-dot animated typing indicator shown before first token arrives */
export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3" aria-label="AI is typing" role="status">
      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
        <Bot className="size-3.5 text-primary" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 shadow-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-muted-foreground/60"
            style={{
              animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
