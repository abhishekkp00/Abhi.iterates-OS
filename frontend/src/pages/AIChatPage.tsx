import { useEffect, useRef, useCallback, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { useAIStore } from '@/features/ai/store/ai.store'
import { aiApi, streamChat } from '@/features/ai/api/ai.api'
import { AIChatHeader } from '@/features/ai/components/AIChatHeader'
import { MessageBubble } from '@/features/ai/components/MessageBubble'
import { TypingIndicator } from '@/features/ai/components/TypingIndicator'
import { PromptComposer } from '@/features/ai/components/PromptComposer'
import type { ChatMessage } from '@/types/ai'

/**
 * AIChatPage — rendered at /ai/chat/:conversationId
 *
 * Lifecycle:
 *  1. On mount: load conversation from API (or use optimistic store data)
 *  2. User types + sends prompt
 *  3. Optimistically append user message to UI
 *  4. Open SSE stream to backend → append tokens to AI message
 *  5. On stream done → commit message, update conversation list
 *  6. Stop button → cancel() stream, mark message done
 */
export default function AIChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const location = useLocation()

  const activeConversation = useAIStore((s) => s.activeConversation)
  const streamingStatus = useAIStore((s) => s.streamingStatus)
  const appendMessage = useAIStore((s) => s.appendMessage)
  const setActiveConversation = useAIStore((s) => s.setActiveConversation)
  const setStreamingStatus = useAIStore((s) => s.setStreamingStatus)
  const appendStreamingContent = useAIStore((s) => s.appendStreamingContent)
  const commitStreamingMessage = useAIStore((s) => s.commitStreamingMessage)
  const setStreamingContent = useAIStore((s) => s.setStreamingContent)
  const updateConversationInList = useAIStore((s) => s.updateConversationInList)
  const prependConversation = useAIStore((s) => s.prependConversation)

  const [isLoading, setIsLoading] = useState(false)

  const cancelStreamRef = useRef<(() => void) | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Real conversation ID (may start as temp ID "new-xxx")
  const [realConversationId, setRealConversationId] = useState<string | null>(
    conversationId?.startsWith('new-') ? null : conversationId ?? null
  )

  // ── Load conversation on mount ───────────────────────────────────────────

  useEffect(() => {
    if (!conversationId) return
    if (conversationId.startsWith('new-')) {
      // Brand-new optimistic chat — don't fetch from API
      return
    }

    // Only fetch if not already the active conversation
    if (activeConversation?.id === conversationId) return

    setIsLoading(true)
    aiApi
      .getConversation(conversationId)
      .then((conv) => setActiveConversation(conv))
      .catch(() => toast.error('Failed to load conversation'))
      .finally(() => setIsLoading(false))
  }, [conversationId]) // eslint-disable-line

  // ── Send initial prompt from navigation state (suggestion chips) ─────────

  useEffect(() => {
    const initialPrompt = (location.state as { initialPrompt?: string })?.initialPrompt
    if (initialPrompt && activeConversation?.messages.length === 0) {
      handleSend(initialPrompt)
    }
  }, []) // eslint-disable-line

  // ── Auto-scroll to bottom ─────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages.length, streamingStatus])

  // ── Send message ──────────────────────────────────────────────────────────

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || streamingStatus === 'streaming') return

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'USER',
        content,
        createdAt: new Date().toISOString(),
      }

      const assistantPlaceholder: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'ASSISTANT',
        content: '',
        createdAt: new Date().toISOString(),
        isStreaming: true,
      }

      appendMessage(userMsg)
      appendMessage(assistantPlaceholder)
      setStreamingStatus('streaming')
      setStreamingContent('')

      let resolvedConvId = realConversationId

      const cancel = streamChat(
        {
          conversationId: resolvedConvId ?? undefined,
          message: content,
        },
        {
          onToken: (chunk) => appendStreamingContent(chunk),
          onConversationId: (id) => {
            resolvedConvId = id
            setRealConversationId(id)

            // Update the URL if we were on a temp ID
            if (conversationId?.startsWith('new-')) {
              window.history.replaceState(null, '', `/ai/chat/${id}`)
            }

            // Ensure it's in the sidebar list
            const now = new Date().toISOString()
            const existingConvs = useAIStore.getState().conversations
            if (!existingConvs.find((c) => c.id === id)) {
              prependConversation({
                id,
                title: content.slice(0, 50),
                createdAt: now,
                updatedAt: now,
                messageCount: 1,
                preview: content,
              })
            } else {
              updateConversationInList(id, { updatedAt: now })
            }
          },
          onDone: () => {
            commitStreamingMessage()
            cancelStreamRef.current = null
          },
          onError: (err) => {
            setStreamingStatus('error')
            cancelStreamRef.current = null
            toast.error(`AI error: ${err.message}`)
          },
        }
      )

      cancelStreamRef.current = cancel
    },
    [
      streamingStatus,
      realConversationId,
      conversationId,
      appendMessage,
      appendStreamingContent,
      commitStreamingMessage,
      setStreamingStatus,
      setStreamingContent,
      prependConversation,
      updateConversationInList,
    ]
  )

  const handleStop = useCallback(() => {
    cancelStreamRef.current?.()
    cancelStreamRef.current = null
    commitStreamingMessage()
    setStreamingStatus('cancelled')
    toast.info('Generation stopped')
  }, [commitStreamingMessage, setStreamingStatus])

  const handleRegenerate = useCallback(() => {
    const msgs = activeConversation?.messages
    if (!msgs || msgs.length < 2) return
    // Find the last user message
    const lastUser = [...msgs].reverse().find((m) => m.role === 'USER')
    if (lastUser) handleSend(lastUser.content)
  }, [activeConversation, handleSend])

  // ── Render ────────────────────────────────────────────────────────────────

  const messages = activeConversation?.messages ?? []
  const isStreaming = streamingStatus === 'streaming'

  return (
    <div className="flex flex-1 flex-col overflow-hidden h-full">
      {/* Header */}
      <AIChatHeader
        title={activeConversation?.title ?? 'Chat'}
        isStreaming={isStreaming}
        onStop={handleStop}
      />

      {/* Message list */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6 space-y-2"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-muted animate-pulse"
                style={{ width: `${60 + i * 10}%` }}
              />
            ))}
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isLast={idx === messages.length - 1}
              onRegenerate={
                msg.role === 'ASSISTANT' && idx === messages.length - 1
                  ? handleRegenerate
                  : undefined
              }
            />
          ))
        )}

        {/* Typing indicator — shown while streaming before first token */}
        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <TypingIndicator />
        )}

        <div ref={bottomRef} aria-hidden />
      </div>

      {/* Prompt composer */}
      <PromptComposer
        onSend={handleSend}
        onStop={handleStop}
        isStreaming={isStreaming}
        disabled={isLoading}
      />
    </div>
  )
}
