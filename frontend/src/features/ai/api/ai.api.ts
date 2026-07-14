/**
 * AI API Service
 *
 * All REST calls go through the shared `api` Axios instance (which handles
 * JWT refresh automatically). SSE streaming is handled separately via the
 * native EventSource API since Axios does not support streaming.
 */
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth.store'
import { API_BASE_URL, API_PREFIX } from '@/constants/app'
import type {
  Conversation,
  ConversationDetail,
  SendMessageRequest,
  SendMessageResponse,
  UpdateConversationTitleRequest,
  PagedResponse,
} from '@/types/ai'

const BASE = '/ai'

// ── Conversation CRUD ────────────────────────────────────────────────────────

export const aiApi = {
  /** List all conversations for the current user (paginated) */
  listConversations: (page = 0, size = 50) =>
    api
      .get<{ data: PagedResponse<Conversation> }>(`${BASE}/conversations`, {
        params: { page, size, sort: 'updatedAt,desc' },
      })
      .then((r) => r.data.data),

  /** Fetch a single conversation with full message history */
  getConversation: (id: string) =>
    api
      .get<{ data: ConversationDetail }>(`${BASE}/conversations/${id}`)
      .then((r) => r.data.data),

  /** Create a new blank conversation */
  createConversation: (title?: string) =>
    api
      .post<{ data: Conversation }>(`${BASE}/conversations`, { title: title ?? 'New Chat' })
      .then((r) => r.data.data),

  /** Rename a conversation */
  updateTitle: (id: string, body: UpdateConversationTitleRequest) =>
    api
      .patch<{ data: Conversation }>(`${BASE}/conversations/${id}/title`, body)
      .then((r) => r.data.data),

  /** Delete a conversation */
  deleteConversation: (id: string) =>
    api.delete(`${BASE}/conversations/${id}`),

  /** Non-streaming: send a message and get the full response at once */
  sendMessage: (body: SendMessageRequest) =>
    api
      .post<{ data: SendMessageResponse }>(`${BASE}/chat`, body)
      .then((r) => r.data.data),
}

// ── SSE Streaming ────────────────────────────────────────────────────────────

export interface StreamCallbacks {
  onToken: (chunk: string) => void
  onConversationId: (id: string) => void
  onToolStart?: (name: string, args: string) => void
  onToolEnd?: (name: string, result: string) => void
  onDone: () => void
  onError: (err: Error) => void
}

/**
 * streamChat — opens a Server-Sent Events connection to the streaming endpoint.
 *
 * Returns a `cancel()` function that the caller can invoke to abort mid-stream
 * (e.g. when the user clicks "Stop generating").
 *
 * The backend emits events of the form:
 *   data: {"type":"token","content":"Hello"}
 *   data: {"type":"conversationId","content":"<uuid>"}
 *   data: {"type":"done"}
 *   data: {"type":"error","content":"<message>"}
 */
export function streamChat(
  body: SendMessageRequest,
  callbacks: StreamCallbacks
): () => void {
  const token = useAuthStore.getState().accessToken
  const controller = new AbortController()
  let cancelled = false

  const url = `${API_BASE_URL}${API_PREFIX}/ai/chat/stream`

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      if (!response.body) {
        throw new Error('Response body is null — streaming not supported')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (!cancelled) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()
          if (!data || data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data) as {
              type: 'token' | 'conversationId' | 'done' | 'error' | 'tool_start' | 'tool_end'
              content?: string
              name?: string
              arguments?: string
              result?: string
            }
            if (parsed.type === 'token' && parsed.content) {
              callbacks.onToken(parsed.content)
            } else if (parsed.type === 'conversationId' && parsed.content) {
              callbacks.onConversationId(parsed.content)
            } else if (parsed.type === 'tool_start' && parsed.name && parsed.arguments) {
              callbacks.onToolStart?.(parsed.name, parsed.arguments)
            } else if (parsed.type === 'tool_end' && parsed.name && parsed.result) {
              callbacks.onToolEnd?.(parsed.name, parsed.result)
            } else if (parsed.type === 'done') {
              callbacks.onDone()
              return
            } else if (parsed.type === 'error') {
              callbacks.onError(new Error(parsed.content ?? 'Stream error'))
              return
            }
          } catch {
            // Non-JSON line — skip silently
          }
        }
      }

      if (!cancelled) callbacks.onDone()
    })
    .catch((err: Error) => {
      if (err.name === 'AbortError' || cancelled) return
      callbacks.onError(err)
    })

  return () => {
    cancelled = true
    controller.abort()
  }
}
