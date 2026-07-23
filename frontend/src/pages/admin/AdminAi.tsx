import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useAdminAiConversationsQuery,
  useAdminAiConversationDetailQuery,
} from '@/features/admin/hooks/useAdmin'
import {
  Loader2,
  Cpu,
  Brain,
  MessageSquare,
  X,
  User,
  Bot,
} from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AdminAi() {
  const { data: conversations, isLoading } = useAdminAiConversationsQuery()
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)

  // Fetch detail for active modal conversation
  const { data: chatDetail, isLoading: isLoadingDetail } =
    useAdminAiConversationDetailQuery(selectedConvId)

  const activeConv = conversations?.find((c) => c.id === selectedConvId)

  // Calculate aggregates
  const totalTokensUsed = conversations?.reduce((sum, c) => sum + (c.totalTokens || 0), 0) || 0
  const totalCostEstimated = conversations?.reduce((sum, c) => sum + (c.estimatedCost || 0), 0) || 0

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Brain className="size-5.5 text-primary" />
          AI Conversation Audit Logs
        </h1>
        <p className="text-xs text-muted-foreground">
          Inspect student interactions with the AI tutor, track token consumption, and evaluate API costs.
        </p>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Total Logs
              </p>
              <h3 className="text-lg font-bold text-foreground mt-1">
                {conversations?.length || 0}
              </h3>
            </div>
            <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <MessageSquare className="size-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Tokens Consumed
              </p>
              <h3 className="text-lg font-bold text-foreground mt-1">
                {totalTokensUsed.toLocaleString()}
              </h3>
            </div>
            <div className="size-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Cpu className="size-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Est. API Costs
              </p>
              <h3 className="text-lg font-bold text-foreground mt-1">
                ${totalCostEstimated.toFixed(4)}
              </h3>
            </div>
            <div className="size-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <span className="font-bold text-xs">$</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations List Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/60">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Gathering AI tutor log indexes…</p>
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="text-center py-20 text-xs text-muted-foreground">
              No historical AI tutor conversations recorded.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Chat Session Title</th>
                  <th className="py-3 px-4 w-[120px]">Student</th>
                  <th className="py-3 px-4 w-[110px]">LLM Model</th>
                  <th className="py-3 px-4 w-[100px]">Messages</th>
                  <th className="py-3 px-4 w-[120px]">Token Cost</th>
                  <th className="py-3 px-4 w-[120px]">Last Turn</th>
                  <th className="py-3 px-4 text-right w-[110px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conv) => (
                  <tr
                    key={conv.id}
                    className="border-b border-border/40 hover:bg-muted/10 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {conv.title || 'Untitled Session'}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-medium">
                      @{conv.username}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="text-[9px] font-mono border-border/80 text-[10px]">
                        {conv.model}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      {conv.messageCount} turns
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground leading-normal text-[10px]">
                      <div className="font-mono">{conv.totalTokens} tokens</div>
                      <div className="text-[9px] text-emerald-400">${conv.estimatedCost.toFixed(4)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground text-[10px]">
                      {new Date(conv.updatedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        className="text-[10px] h-7 font-semibold"
                        onClick={() => setSelectedConvId(conv.id)}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Message Audit Timeline Drawer */}
      <AnimatePresence>
        {selectedConvId && activeConv && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedConvId(null)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 cursor-pointer"
            />
            {/* Drawer */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border/60 shadow-2xl p-6 z-50 flex flex-col space-y-4 focus:outline-none"
              role="dialog"
              aria-modal="true"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-4 shrink-0">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-foreground truncate max-w-[280px]">
                    {activeConv.title}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    Logs for student @{activeConv.username} • {activeConv.model}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSelectedConvId(null)}
                  className="rounded-full hover:bg-muted"
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Chat turns scroll view */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-2 text-xs">
                {isLoadingDetail ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-2">
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <p className="text-[10px] text-muted-foreground">Decrypting chat timelines…</p>
                  </div>
                ) : !chatDetail || chatDetail.length === 0 ? (
                  <div className="text-center py-20 text-[10px] text-muted-foreground">
                    No message turns found.
                  </div>
                ) : (
                  chatDetail.map((msg, index) => {
                    const isUser = msg.role === 'USER'
                    return (
                      <div
                        key={index}
                        className={`flex gap-3 max-w-[85%] ${
                          isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`size-6.5 rounded-full flex items-center justify-center text-[10px] shrink-0 border ${
                            isUser
                              ? 'bg-primary/10 border-primary/20 text-primary'
                              : 'bg-muted border-border text-muted-foreground'
                          }`}
                        >
                          {isUser ? <User className="size-3" /> : <Bot className="size-3" />}
                        </div>

                        {/* Content bubble */}
                        <div className="space-y-1">
                          <div
                            className={`p-3 rounded-xl leading-relaxed whitespace-pre-wrap ${
                              isUser
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'bg-muted/40 border border-border/60 text-foreground'
                            }`}
                          >
                            {msg.content}
                          </div>
                          {msg.tokenCount && (
                            <span className="block text-[8px] text-muted-foreground text-right font-mono">
                              {msg.tokenCount} tokens
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
