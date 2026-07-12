import { useRef, useState, useCallback, useEffect } from 'react'
import { Send, StopCircle, Mic, Paperclip } from '@/lib/icons'
import { Button } from '@/components/ui/button'

interface PromptComposerProps {
  onSend: (message: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
}

const MAX_CHARS = 4000

/**
 * PromptComposer — auto-growing textarea with:
 * - Shift+Enter for newline, Enter to send
 * - Character counter (shows when > 80% full)
 * - Send / Stop button
 * - Mic + Attachment placeholders (future)
 */
export function PromptComposer({ onSend, onStop, isStreaming, disabled }: PromptComposerProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow the textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
  }

  const charCount = value.length
  const showCounter = charCount > MAX_CHARS * 0.8
  const overLimit = charCount > MAX_CHARS

  return (
    <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur-sm p-3">
      <div
        className={`flex flex-col gap-2 rounded-2xl border bg-card shadow-sm transition-colors ${
          overLimit ? 'border-destructive/50' : 'border-border focus-within:border-primary/50'
        }`}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id="ai-prompt-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={isStreaming ? 'AI is responding…' : 'Ask anything… (Enter to send, Shift+Enter for newline)'}
          rows={1}
          maxLength={MAX_CHARS + 100}
          aria-label="Message input"
          aria-multiline="true"
          className="w-full resize-none bg-transparent px-4 pt-3 pb-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 min-h-[44px] max-h-[200px] leading-relaxed"
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between gap-2 px-3 pb-2.5">
          {/* Left: placeholder action icons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              title="Attach file (coming soon)"
              aria-label="Attach file (coming soon)"
              className="rounded-lg p-1.5 text-muted-foreground opacity-40 cursor-not-allowed"
            >
              <Paperclip className="size-4" />
            </button>
            <button
              type="button"
              disabled
              title="Voice input (coming soon)"
              aria-label="Voice input (coming soon)"
              className="rounded-lg p-1.5 text-muted-foreground opacity-40 cursor-not-allowed"
            >
              <Mic className="size-4" />
            </button>
          </div>

          {/* Right: char counter + send/stop */}
          <div className="flex items-center gap-2">
            {showCounter && (
              <span
                className={`text-[10px] font-mono tabular-nums ${
                  overLimit ? 'text-destructive' : 'text-muted-foreground'
                }`}
                aria-live="polite"
              >
                {charCount}/{MAX_CHARS}
              </span>
            )}

            {isStreaming ? (
              <Button
                id="ai-composer-stop-btn"
                type="button"
                size="sm"
                variant="outline"
                onClick={onStop}
                className="gap-1.5 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 cursor-pointer h-8 px-3"
                aria-label="Stop AI generation"
              >
                <StopCircle className="size-3.5" />
                Stop
              </Button>
            ) : (
              <Button
                id="ai-send-btn"
                type="button"
                size="sm"
                onClick={handleSend}
                disabled={!value.trim() || disabled || overLimit}
                className="gap-1.5 rounded-xl cursor-pointer h-8 px-3"
                aria-label="Send message"
              >
                <Send className="size-3.5" />
                Send
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">
        Press <kbd className="rounded border border-border bg-muted px-1 text-[9px] font-mono">Enter</kbd> to send ·{' '}
        <kbd className="rounded border border-border bg-muted px-1 text-[9px] font-mono">Shift+Enter</kbd> for newline
      </p>
    </div>
  )
}
