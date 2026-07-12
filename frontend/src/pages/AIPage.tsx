import { useNavigate } from 'react-router-dom'
import { useAIStore } from '@/features/ai/store/ai.store'
import { AIEmptyState } from '@/features/ai/components/AIEmptyState'

/**
 * AIPage — rendered at /ai (index route inside AIChatLayout).
 * Shows the empty state / suggestion prompts.
 * When the user picks a suggestion or clicks "New Chat",
 * we start a new conversation inline.
 */
export default function AIPage() {
  const navigate = useNavigate()
  const prependConversation = useAIStore((s) => s.prependConversation)
  const setActiveConversation = useAIStore((s) => s.setActiveConversation)

  const handleNewChat = async (initialPrompt?: string) => {
    // Create a temporary optimistic conversation and navigate to the chat page.
    // The actual conversation will be created by AIChatPage on first message send.
    const tempId = `new-${Date.now()}`
    const now = new Date().toISOString()

    const newConv = {
      id: tempId,
      title: initialPrompt ? initialPrompt.slice(0, 40) : 'New Chat',
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      preview: initialPrompt ?? '',
    }

    prependConversation(newConv)
    setActiveConversation({ ...newConv, messages: [] })

    // Navigate and pass initial prompt via state
    navigate(`/ai/chat/${tempId}`, {
      state: { initialPrompt },
    })
  }

  return <AIEmptyState onNewChat={handleNewChat} />
}
