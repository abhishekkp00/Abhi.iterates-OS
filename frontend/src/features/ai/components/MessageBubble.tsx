import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Bot, User, Copy, RotateCcw, Check } from '@/lib/icons'
import type { ChatMessage } from '@/types/ai'
import { StreamingCursor } from './StreamingCursor'

interface MessageBubbleProps {
  message: ChatMessage
  isLast: boolean
  onRegenerate?: () => void
}

export function MessageBubble({ message, isLast, onRegenerate }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'USER'
  const isStreaming = message.isStreaming

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }, [message.content])

  const timeStr = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 group ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar — AI only */}
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
          <Bot className="size-3.5 text-primary" />
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-card border border-border text-foreground rounded-tl-sm shadow-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ children, className }) {
                    const isInline = !className
                    const language = className?.replace('language-', '') ?? 'text'
                    if (isInline) {
                      return (
                        <code className="rounded bg-muted px-1 py-0.5 text-[0.8em] font-mono text-foreground">
                          {children}
                        </code>
                      )
                    }
                    return (
                      <div className="relative my-2 rounded-lg overflow-hidden border border-border">
                        <div className="flex items-center justify-between bg-muted/80 px-3 py-1.5 text-[10px] text-muted-foreground font-mono">
                          <span>{language}</span>
                          <button
                            onClick={handleCopy}
                            className="hover:text-foreground transition-colors"
                            aria-label="Copy code"
                          >
                            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                          </button>
                        </div>
                        <pre className="overflow-x-auto p-3 text-xs font-mono bg-muted/40">
                          <code>{children}</code>
                        </pre>
                      </div>
                    )
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 hover:text-primary/80"
                      >
                        {children}
                      </a>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && <StreamingCursor />}
            </div>
          )}
        </div>

        {/* Timestamp + actions */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-muted-foreground">{timeStr}</span>

          {/* Action buttons — only shown on hover for AI messages */}
          {!isUser && !isStreaming && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Copy response"
                title="Copy"
              >
                {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
              </button>
              {isLast && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Regenerate response"
                  title="Regenerate"
                >
                  <RotateCcw className="size-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Avatar — User only */}
      {isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted border border-border">
          <User className="size-3.5 text-muted-foreground" />
        </div>
      )}
    </motion.div>
  )
}
