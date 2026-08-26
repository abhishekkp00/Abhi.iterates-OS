import { useNavigate } from 'react-router-dom'
import { useAIStore } from '@/features/ai/store/ai.store'
import { Button } from '@/components/ui/button'
import { MessageSquare, ArrowRight, Sparkles, Plus, Bot } from '@/lib/icons'

export function AiWorkspacePreview() {
  const navigate = useNavigate()
  const conversations = useAIStore((s) => s.conversations)

  const recentChats = conversations.slice(0, 2)

  const suggestions = [
    { text: 'Explain quantum superposition', prompt: 'Explain quantum superposition in simple terms' },
    { text: 'Help me debug a React hook', prompt: 'Help me debug a React useEffect hook memory leak' },
  ]

  const handleStartChat = (prompt?: string) => {
    if (prompt) {
      navigate('/ai', { state: { initialPrompt: prompt } })
    } else {
      navigate('/ai')
    }
  }

  return (
    <div className="clean-card flex flex-col justify-between min-h-[300px]">
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4.5 text-cyan-400" />
            <h2 className="font-display text-base font-bold text-white tracking-tight">AI Study Assistant</h2>
          </div>
          <Button
            size="xs"
            onClick={() => handleStartChat()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-2.5 h-7 rounded-lg gap-1"
          >
            <Plus className="size-3" />
            <span>New Chat</span>
          </Button>
        </div>

        <div className="space-y-4">
          {/* Suggested Prompts */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Suggested Prompts
            </span>
            <div className="flex flex-col gap-1.5">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStartChat(s.prompt)}
                  className="text-left text-xs font-medium p-2.5 rounded-xl border border-slate-800/80 hover:border-cyan-500/30 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-cyan-400 transition-all duration-150 flex items-center gap-2.5 group"
                >
                  <Bot className="size-3.5 shrink-0 text-cyan-400/80 group-hover:text-cyan-400" />
                  <span className="truncate">{s.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Recent Sessions
            </span>
            {recentChats.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-slate-400 text-xs">
                <MessageSquare className="size-4 shrink-0 text-slate-500" />
                <span>No recent conversations.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {recentChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => navigate(`/ai/chat/${chat.id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-800/80 hover:border-cyan-500/30 bg-slate-900/50 hover:bg-slate-900 transition-all duration-150 group cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 shrink-0">
                      <MessageSquare className="size-3.5 text-cyan-400/80 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-400 transition-colors">
                        {chat.title || 'Untitled Chat'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Last active {new Date(chat.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-3 mt-4 border-t border-slate-800">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs font-bold text-slate-400 hover:text-cyan-400 justify-between group hover:bg-transparent"
          onClick={() => navigate('/ai')}
        >
          <span>Open AI Workspace</span>
          <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  )
}
