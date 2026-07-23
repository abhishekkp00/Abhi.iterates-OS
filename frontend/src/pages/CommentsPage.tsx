import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Trash2, Send, CornerDownRight, User } from '@/lib/icons'
import { Button } from '@/components/ui/button'

type CommentThread = {
  id: string
  resourceTitle: string
  author: string
  content: string
  timestamp: string
  replies: Array<{
    id: string
    author: string
    content: string
    timestamp: string
  }>
}

export default function CommentsPage() {
  const [threads, setThreads] = useState<CommentThread[]>([
    {
      id: '1',
      resourceTitle: 'Advanced Algorithms Study Guide',
      author: 'Alex Rivera',
      content: 'This guide was extremely helpful for my exam preparation. Thanks for sharing!',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      replies: [
        {
          id: '1-1',
          author: 'Abhishek',
          content: 'Glad you found it useful! Let me know if you want the sample practice questions.',
          timestamp: new Date(Date.now() - 1800000).toISOString()
        }
      ]
    },
    {
      id: '2',
      resourceTitle: 'Database Schema Design Notes',
      author: 'Sarah Chen',
      content: 'Could you explain why the user table structure has indexes on both user_id and email fields?',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      replies: []
    }
  ])

  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})

  const handleReplySubmit = (threadId: string) => {
    const text = replyInputs[threadId]?.trim()
    if (!text) return

    setThreads(prev =>
      prev.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            replies: [
              ...t.replies,
              {
                id: `${threadId}-${t.replies.length + 1}`,
                author: 'Abhishek',
                content: text,
                timestamp: new Date().toISOString()
              }
            ]
          }
        }
        return t
      })
    )

    setReplyInputs(prev => ({ ...prev, [threadId]: '' }))
  }

  const deleteThread = (threadId: string) => {
    setThreads(prev => prev.filter(t => t.id !== threadId))
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare className="size-6 text-primary" />
            Comments & Discussions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Engage in conversations, answer questions, and reply to comments on shared resources.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border/60 rounded-xl bg-card/20">
            <div className="size-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground mb-4">
              <MessageSquare className="size-6" />
            </div>
            <h3 className="font-semibold text-lg">No comments yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Comments on your study resources or replies to your messages will appear here.
            </p>
          </div>
        ) : (
          threads.map((thread) => (
            <motion.div
              layout
              key={thread.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/40 border border-border/60 rounded-xl p-5 space-y-4 hover:border-border/80 transition-all"
            >
              {/* Header: Resource Title & Actions */}
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Topic: {thread.resourceTitle}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => deleteThread(thread.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {/* Main Comment */}
              <div className="flex gap-3">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="size-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground">{thread.author}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(thread.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{thread.content}</p>
                </div>
              </div>

              {/* Replies */}
              {thread.replies.length > 0 && (
                <div className="space-y-3 pl-8 border-l border-border/40">
                  {thread.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-3 relative">
                      <CornerDownRight className="size-4 text-muted-foreground/50 absolute left-[-20px] top-1" />
                      <div className="size-7 rounded-full bg-muted/60 flex items-center justify-center shrink-0">
                        <User className="size-3.5 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground">{reply.author}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(reply.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Reply Form */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={replyInputs[thread.id] ?? ''}
                  onChange={(e) => setReplyInputs(prev => ({ ...prev, [thread.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleReplySubmit(thread.id)
                  }}
                  className="flex-1 bg-background/50 border border-border/60 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <Button
                  size="sm"
                  onClick={() => handleReplySubmit(thread.id)}
                  className="h-8 px-3"
                >
                  <Send className="size-3.5 mr-1" />
                  Reply
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
