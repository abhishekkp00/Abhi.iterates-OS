import { useNavigate } from 'react-router-dom'
import { useAIStore } from '@/features/ai/store/ai.store'
import { Button } from '@/components/ui/button'
import { MessageSquare, ArrowRight, Sparkles, Plus, Terminal } from '@/lib/icons'

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
    <div className="retro-card-teal flex flex-col justify-between min-h-[300px]">
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 font-mono text-2xs uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-cyan-400" />
            <span className="font-display text-sm font-bold text-white tracking-tight lowercase first-letter:uppercase">AI RAG Assistant</span>
          </div>
          <Button
            size="xs"
            onClick={() => handleStartChat()}
            className="font-mono text-2xs font-bold gap-1 bg-cyan-500/20 border border-cyan-500/50 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 rounded h-6 px-2 shadow-[2px_2px_0px_0px_rgba(6,182,212,0.3)] transition-all"
          >
            <Plus className="size-3" />
            <span>[NEW_CHAT]</span>
          </Button>
        </div>

        <div className="space-y-4">
          {/* Suggested Prompts */}
          <div className="space-y-2">
            <span className="font-mono text-2xs uppercase tracking-widest text-slate-500 font-bold block">
              &gt; SUGGESTED_PROMPTS
            </span>
            <div className="flex flex-col gap-1.5">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStartChat(s.prompt)}
                  className="text-left font-mono text-xs font-semibold p-2.5 rounded border border-slate-800 hover:border-cyan-500/40 bg-slate-950/60 text-slate-300 hover:text-cyan-400 transition-all duration-150 flex items-center gap-2 group"
                >
                  <Terminal className="size-3 shrink-0 text-cyan-400/80 group-hover:text-cyan-400" />
                  <span className="truncate">{s.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="space-y-2">
            <span className="font-mono text-2xs uppercase tracking-widest text-slate-500 font-bold block">
              &gt; RECENT_SESSIONS
            </span>
            {recentChats.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded border border-dashed border-slate-800 bg-slate-900/40 text-slate-400 font-mono text-xs">
                <Terminal className="size-3.5 shrink-0 text-slate-500" />
                <span>[NO ACTIVE SESSIONS]</span>
              </div>
            ) : (
              <div className="space-y-2">
                {recentChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => navigate(`/ai/chat/${chat.id}`)}
                    className="flex items-center gap-3 p-3 rounded border border-slate-800 hover:border-cyan-500/40 bg-slate-950/60 hover:bg-slate-900 transition-all duration-150 group cursor-pointer"
                  >
                    <div className="p-1.5 rounded border border-slate-800 bg-slate-900 shrink-0">
                      <MessageSquare className="size-3.5 text-cyan-400/70 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5 font-mono">
                      <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-400 transition-colors">
                        {chat.title || 'Untitled Chat'}
                      </h4>
                      <p className="text-2xs text-slate-500">
                        LAST_ACTIVE: {new Date(chat.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
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
          className="w-full font-mono text-xs font-bold text-slate-400 hover:text-cyan-400 justify-between group hover:bg-transparent"
          onClick={() => navigate('/ai')}
        >
          <span>&gt; OPEN_RAG_WORKSPACE</span>
          <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  )
}
