import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAIStore } from '@/features/ai/store/ai.store'
import { aiApi } from '@/features/ai/api/ai.api'
import { ConversationItem } from './ConversationItem'
import { Button } from '@/components/ui/button'
import {
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bot,
} from '@/lib/icons'

/**
 * AIChatSidebar
 *
 * - Shows conversation list (from Zustand, persisted)
 * - New chat button
 * - Search conversations
 * - Collapse/expand on desktop
 */
export function AIChatSidebar() {
  const navigate = useNavigate()
  const { conversationId } = useParams()
  const [search, setSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const conversations = useAIStore((s) => s.conversations)
  const setConversations = useAIStore((s) => s.setConversations)
  const sidebarCollapsed = useAIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAIStore((s) => s.toggleSidebar)
  const removeConversation = useAIStore((s) => s.removeConversation)
  const updateConversationInList = useAIStore((s) => s.updateConversationInList)

  // Fetch conversations on mount
  useEffect(() => {
    aiApi.listConversations(0, 50)
      .then((res) => {
        setConversations(res.content)
      })
      .catch((err) => {
        console.error('Failed to load conversations:', err)
      })
  }, [setConversations])

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleNewChat = useCallback(async () => {
    setIsCreating(true)
    try {
      navigate('/ai')
    } finally {
      setIsCreating(false)
    }
  }, [navigate])

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await aiApi.deleteConversation(id)
        removeConversation(id)
        if (conversationId === id) navigate('/ai')
        toast.success('Conversation deleted')
      } catch {
        toast.error('Failed to delete conversation')
      }
    },
    [conversationId, navigate, removeConversation]
  )

  const handleRename = useCallback(
    async (id: string, title: string) => {
      try {
        await aiApi.updateTitle(id, { title })
        updateConversationInList(id, { title })
        toast.success('Conversation renamed')
      } catch {
        toast.error('Failed to rename conversation')
      }
    },
    [updateConversationInList]
  )

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 0 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex flex-col overflow-hidden border-r border-border bg-sidebar-background shrink-0"
      style={{ minWidth: sidebarCollapsed ? 0 : 260 }}
    >
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="size-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">AI Assistant</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 cursor-pointer"
                onClick={toggleSidebar}
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </div>

            {/* New Chat */}
            <div className="p-2">
              <Button
                id="ai-new-chat-btn"
                onClick={handleNewChat}
                disabled={isCreating}
                className="w-full gap-2 rounded-xl cursor-pointer"
                size="sm"
              >
                <MessageSquarePlus className="size-4" />
                New Chat
              </Button>
            </div>

            {/* Search */}
            <div className="px-2 pb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted/50 py-2 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  aria-label="Search conversations"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto px-1 pb-2 space-y-0.5">
              {filtered.length === 0 ? (
                <p className="px-3 py-8 text-center text-xs text-muted-foreground">
                  {search ? 'No matching conversations' : 'No conversations yet'}
                </p>
              ) : (
                filtered.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === conversationId}
                    onDelete={() => handleDelete(conv.id)}
                    onRename={(title) => handleRename(conv.id, title)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed toggle button */}
      {sidebarCollapsed && (
        <div className="flex flex-col items-center pt-3 gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={handleNewChat}
            aria-label="New chat"
          >
            <MessageSquarePlus className="size-4" />
          </Button>
        </div>
      )}
    </motion.aside>
  )
}
