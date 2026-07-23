/**
 * AI Assistant — Core Type Definitions
 *
 * These types mirror the backend DTOs (Spring AI layer) and are
 * intentionally kept flat and serializable so they can be persisted
 * to localStorage without any transformation.
 */

export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM'

export type StreamingStatus = 'idle' | 'streaming' | 'done' | 'error' | 'cancelled'

// ── Individual message ──────────────────────────────────────────────────────

export interface ToolExecution {
  name: string
  arguments: string
  result?: string
  status: 'running' | 'completed' | 'failed'
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  /** ISO-8601 timestamp */
  createdAt: string
  /** True while this message is being streamed */
  isStreaming?: boolean
  /** If generation failed mid-stream */
  isError?: boolean
  /** Token count returned by the backend (optional) */
  tokenCount?: number
  /** Tool calling logs for the agent execution timeline */
  toolExecutions?: ToolExecution[]
}

// ── Conversation (session) ──────────────────────────────────────────────────

export interface Conversation {
  id: string
  title: string
  /** ISO-8601 timestamp of last message */
  updatedAt: string
  createdAt: string
  /** Snapshot of the first user message — used in sidebar preview */
  preview?: string
  messageCount: number
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[]
}

// ── API request / response shapes ───────────────────────────────────────────

export interface SendMessageRequest {
  conversationId?: string
  message: string
  /** Optional system prompt override */
  systemPrompt?: string
  /** Optional resource ID for context retrieval */
  resourceId?: string
}

export interface SendMessageResponse {
  conversationId: string
  message: ChatMessage
}

export interface CreateConversationRequest {
  title?: string
  firstMessage?: string
}

export interface UpdateConversationTitleRequest {
  title: string
}

// ── Paginated response wrapper (matches backend ApiResponse<Page<T>>) ────────

export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  last: boolean
}

// ── AI Store State ────────────────────────────────────────────────────────────

export interface AIStore {
  /** Flat list of conversations (sidebar) */
  conversations: Conversation[]
  /** Currently open conversation with full messages */
  activeConversation: ConversationDetail | null
  /** Streaming state for the current generation turn */
  streamingStatus: StreamingStatus
  /** Accumulated streaming text before it's committed to a message */
  streamingContent: string
  /** Whether sidebar is visible on desktop */
  sidebarCollapsed: boolean

  // ── Actions ─────────────────────────────────────────────────────────────
  setConversations: (conversations: Conversation[]) => void
  prependConversation: (conversation: Conversation) => void
  updateConversationInList: (id: string, patch: Partial<Conversation>) => void
  removeConversation: (id: string) => void

  setActiveConversation: (conversation: ConversationDetail | null) => void
  appendMessage: (message: ChatMessage) => void
  updateLastAssistantMessage: (content: string, done?: boolean) => void

  setStreamingStatus: (status: StreamingStatus) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  commitStreamingMessage: () => void
  appendToolStartToLastMessage: (name: string, args: string) => void
  updateToolEndInLastMessage: (name: string, result: string) => void

  toggleSidebar: () => void
}
