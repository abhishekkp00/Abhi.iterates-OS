import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AIStore,
  ChatMessage,
  Conversation,
  ConversationDetail,
  StreamingStatus,
} from '@/types/ai'

/**
 * useAIStore — global state for the AI assistant.
 *
 * The conversation *list* (metadata only) is persisted to localStorage so
 * the sidebar survives a page refresh without a network round-trip.
 * Full message history is NOT persisted — it is always fetched from the API
 * when a conversation is opened, keeping the store lean.
 */
export const useAIStore = create<AIStore>()(
  persist(
    (set) => ({
      conversations: [],
      activeConversation: null,
      streamingStatus: 'idle' as StreamingStatus,
      streamingContent: '',
      sidebarCollapsed: false,

      // ── Conversation list mutations ────────────────────────────────────────

      setConversations: (conversations: Conversation[]) =>
        set({ conversations }),

      prependConversation: (conversation: Conversation) =>
        set((state) => ({
          conversations: [conversation, ...state.conversations],
        })),

      updateConversationInList: (id: string, patch: Partial<Conversation>) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),

      removeConversation: (id: string) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversation:
            state.activeConversation?.id === id ? null : state.activeConversation,
        })),

      // ── Active conversation ────────────────────────────────────────────────

      setActiveConversation: (conversation: ConversationDetail | null) =>
        set({ activeConversation: conversation }),

      appendMessage: (message: ChatMessage) =>
        set((state) => {
          if (!state.activeConversation) return state
          return {
            activeConversation: {
              ...state.activeConversation,
              messages: [...state.activeConversation.messages, message],
              messageCount: state.activeConversation.messageCount + 1,
            },
          }
        }),

      updateLastAssistantMessage: (content: string, done = false) =>
        set((state) => {
          if (!state.activeConversation) return state
          const messages = [...state.activeConversation.messages]
          const lastIdx = messages.length - 1
          if (lastIdx < 0) return state
          const msg = messages[lastIdx]!
          messages[lastIdx] = {
            ...msg,
            content,
            isStreaming: !done,
          }
          return {
            activeConversation: { ...state.activeConversation, messages },
          }
        }),

      // ── Streaming ─────────────────────────────────────────────────────────

      setStreamingStatus: (streamingStatus: StreamingStatus) =>
        set({ streamingStatus }),

      setStreamingContent: (streamingContent: string) =>
        set({ streamingContent }),

      appendStreamingContent: (chunk: string) =>
        set((state) => {
          const newContent = state.streamingContent + chunk
          const activeConversation = state.activeConversation
          if (!activeConversation) return { streamingContent: newContent }

          const messages = [...activeConversation.messages]
          const lastIdx = messages.length - 1
          const lastMsg = messages[lastIdx]
          if (lastIdx >= 0 && lastMsg && lastMsg.role === 'ASSISTANT') {
            messages[lastIdx] = {
              ...lastMsg,
              content: newContent,
              isStreaming: true,
            }
          }
          return {
            streamingContent: newContent,
            activeConversation: { ...activeConversation, messages },
          }
        }),

       commitStreamingMessage: () =>
        set((state) => {
          const activeConversation = state.activeConversation
          if (!activeConversation) return { streamingContent: '', streamingStatus: 'done' as StreamingStatus }

          const messages = [...activeConversation.messages]
          const lastIdx = messages.length - 1
          const lastMsg = messages[lastIdx]
          if (lastIdx >= 0 && lastMsg && lastMsg.role === 'ASSISTANT') {
            messages[lastIdx] = {
              ...lastMsg,
              content: state.streamingContent || lastMsg.content,
              isStreaming: false,
            }
          }
          return {
            streamingContent: '',
            streamingStatus: 'done' as StreamingStatus,
            activeConversation: { ...activeConversation, messages },
          }
        }),

      appendToolStartToLastMessage: (toolName: string, args: string) =>
        set((state) => {
          if (!state.activeConversation) return state
          const messages = [...state.activeConversation.messages]
          const lastIdx = messages.length - 1
          if (lastIdx < 0) return state
          const lastMsg = messages[lastIdx]!
          const toolExecutions = lastMsg.toolExecutions ? [...lastMsg.toolExecutions] : []
          
          toolExecutions.push({
            name: toolName,
            arguments: args,
            status: 'running'
          })
          
          messages[lastIdx] = {
            ...lastMsg,
            toolExecutions
          }
          return {
            activeConversation: { ...state.activeConversation, messages }
          }
        }),

      updateToolEndInLastMessage: (toolName: string, result: string) =>
        set((state) => {
          if (!state.activeConversation) return state
          const messages = [...state.activeConversation.messages]
          const lastIdx = messages.length - 1
          if (lastIdx < 0) return state
          const lastMsg = messages[lastIdx]!
          if (!lastMsg.toolExecutions) return state
          
          const toolExecutions = lastMsg.toolExecutions.map((t) => {
            if (t.name === toolName && t.status === 'running') {
              return {
                ...t,
                result,
                status: 'completed' as const
              }
            }
            return t
          })
          
          messages[lastIdx] = {
            ...lastMsg,
            toolExecutions
          }
          return {
            activeConversation: { ...state.activeConversation, messages }
          }
        }),

      // ── UI ────────────────────────────────────────────────────────────────

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'abhi-os-ai-conversations',
      // Only persist the conversation list and sidebar preference — not messages
      partialize: (state) => ({
        conversations: state.conversations,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
