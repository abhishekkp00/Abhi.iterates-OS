import { useNavigate } from 'react-router-dom'
import { useAIStore } from '@/features/ai/store/ai.store'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, ArrowRight, Sparkles, Plus, AlertCircle } from '@/lib/icons'

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
      // Navigate to AI workspace with initial prompt state
      navigate('/ai', { state: { initialPrompt: prompt } })
    } else {
      navigate('/ai')
    }
  }

  return (
    <Card className="border border-border/60 bg-card/45 backdrop-blur-sm flex flex-col justify-between min-h-[300px]">
      <div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4.5 text-purple-500" />
            <CardTitle className="text-base font-bold tracking-tight">AI Assistant</CardTitle>
          </div>
          <Button
            size="xs"
            onClick={() => handleStartChat()}
            className="text-[10px] font-bold gap-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg h-7"
          >
            <Plus className="size-3" />
            <span>New Chat</span>
          </Button>
        </CardHeader>

        <CardContent className="pt-2 space-y-4">
          {/* Suggested Prompts */}
          <div className="space-y-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Suggested Prompts</span>
            <div className="flex flex-col gap-1.5">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStartChat(s.prompt)}
                  className="text-left text-xs font-semibold p-2.5 rounded-xl border border-border/40 hover:border-purple-500/30 hover:bg-purple-500/5 text-foreground hover:text-purple-400 transition-all duration-150 flex items-center gap-2"
                >
                  <Sparkles className="size-3 shrink-0 text-purple-500/70" />
                  <span className="truncate">{s.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="space-y-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Recent Sessions</span>
            {recentChats.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-border/40 bg-muted/10 text-muted-foreground">
                <AlertCircle className="size-4 shrink-0" />
                <span className="text-xs font-medium">No recent conversations.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {recentChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => navigate(`/ai/chat/${chat.id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-border/80 bg-background/30 hover:bg-background/60 transition-all duration-150 group cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-card border border-border/40 shrink-0">
                      <MessageSquare className="size-4 text-purple-500/70 group-hover:text-purple-500 transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {chat.title || 'Untitled Chat'}
                      </h4>
                      <p className="text-[9px] text-muted-foreground font-medium">
                        Last active {new Date(chat.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-2 border-t border-border/40">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs font-bold text-muted-foreground hover:text-foreground justify-between group"
          onClick={() => navigate('/ai')}
        >
          <span>Open AI Workspace</span>
          <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  )
}
