import { motion } from 'framer-motion'
import { Sparkles, MessageSquarePlus, BookOpen, ShoppingBag, WandSparkles } from '@/lib/icons'
import { Button } from '@/components/ui/button'

const SUGGESTION_PROMPTS = [
  {
    icon: <BookOpen className="size-4 text-primary" />,
    label: 'Summarise my study plan',
    prompt: 'Can you help me create a structured study plan for this semester?',
  },
  {
    icon: <WandSparkles className="size-4 text-warning" />,
    label: 'Explain a concept',
    prompt: 'Explain the concept of Big-O notation with simple examples.',
  },
  {
    icon: <ShoppingBag className="size-4 text-success" />,
    label: 'Marketplace listing tips',
    prompt: 'What are some tips for writing a compelling campus marketplace listing?',
  },
  {
    icon: <Sparkles className="size-4 text-info" />,
    label: 'Brainstorm project ideas',
    prompt: 'Give me 5 creative final-year project ideas in the field of AI and education.',
  },
]

interface AIEmptyStateProps {
  onNewChat: (prompt?: string) => void
}

export function AIEmptyState({ onNewChat }: AIEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6 text-center">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
        {/* Glowing orb */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/80 to-primary shadow-lg">
            <Sparkles className="size-8 text-primary-foreground" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Hi, I'm your AI Assistant
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Ask me anything — from study tips and concept explanations to campus life advice.
          </p>
        </div>

        <Button
          id="ai-start-chat-btn"
          onClick={() => onNewChat()}
          size="lg"
          className="gap-2 rounded-xl cursor-pointer"
        >
          <MessageSquarePlus className="size-4" />
          Start a New Chat
        </Button>
      </motion.div>

      {/* Suggestion chips */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full"
      >
        {SUGGESTION_PROMPTS.map((s) => (
          <button
            key={s.label}
            onClick={() => onNewChat(s.prompt)}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm cursor-pointer"
            aria-label={`Suggested prompt: ${s.label}`}
          >
            <div className="mt-0.5 shrink-0">{s.icon}</div>
            <div>
              <p className="text-xs font-semibold text-foreground">{s.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{s.prompt}</p>
            </div>
          </button>
        ))}
      </motion.div>
    </div>
  )
}
