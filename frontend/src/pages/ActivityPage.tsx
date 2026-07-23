import { useState } from 'react'
import { motion } from 'framer-motion'
import { ListTodo, ShoppingBag, FolderOpen, Sparkles, Filter, Clock, RefreshCw } from '@/lib/icons'
import { Button } from '@/components/ui/button'

type ActivityItem = {
  id: string
  category: 'TASK' | 'MARKETPLACE' | 'RESOURCE' | 'AI'
  title: string
  description: string
  timestamp: string
  user: string
}

export default function ActivityPage() {
  const [filter, setFilter] = useState<'ALL' | 'TASK' | 'MARKETPLACE' | 'RESOURCE' | 'AI'>('ALL')
  const [activities] = useState<ActivityItem[]>([
    {
      id: '1',
      category: 'RESOURCE',
      title: 'Uploaded Study Notes',
      description: 'Uploaded "Calculus II Midterm Cheat Sheet.pdf" to mathematics folder.',
      timestamp: new Date().toISOString(),
      user: 'Abhishek'
    },
    {
      id: '2',
      category: 'TASK',
      title: 'Task Completed',
      description: 'Completed high-priority task "Study Algorithms Chapter 5".',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      user: 'Abhishek'
    },
    {
      id: '3',
      category: 'MARKETPLACE',
      title: 'New Listing Added',
      description: 'Listed "Calculus Textbook (11th Edition)" for $15.',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      user: 'Abhishek'
    },
    {
      id: '4',
      category: 'AI',
      title: 'Generated Summary',
      description: 'Generated learning objectives summary for "Operating Systems lecture notes".',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      user: 'Abhishek'
    }
  ])

  const filtered = activities.filter(act => filter === 'ALL' || act.category === filter)

  const getIcon = (category: string) => {
    switch (category) {
      case 'TASK':
        return <ListTodo className="size-3 text-amber-400" />
      case 'MARKETPLACE':
        return <ShoppingBag className="size-3 text-emerald-400" />
      case 'RESOURCE':
        return <FolderOpen className="size-3 text-blue-400" />
      case 'AI':
        return <Sparkles className="size-3 text-purple-400" />
      default:
        return <Clock className="size-3 text-muted-foreground" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'TASK':
        return 'bg-amber-400/10 border-amber-400/20 text-amber-400'
      case 'MARKETPLACE':
        return 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
      case 'RESOURCE':
        return 'bg-blue-400/10 border-blue-400/20 text-blue-400'
      case 'AI':
        return 'bg-purple-400/10 border-purple-400/20 text-purple-400'
      default:
        return 'bg-muted border-border text-muted-foreground'
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <RefreshCw className="size-6 text-primary" />
            Activity Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track all changes, updates, and events occurring on your profile.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(['ALL', 'RESOURCE', 'TASK', 'MARKETPLACE', 'AI'] as const).map((cat) => (
          <Button
            key={cat}
            variant={filter === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(cat)}
            className="rounded-full text-xs"
          >
            {cat === 'ALL' && <Filter className="size-3 mr-1" />}
            {cat.charAt(0) + cat.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {/* Feed Timeline */}
      <div className="relative border-l border-border/60 ml-4 pl-6 space-y-8 py-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center ml-[-24px]">
            <p className="text-sm text-muted-foreground">No matching activities found.</p>
          </div>
        ) : (
          filtered.map((act) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              {/* Timeline Indicator Dot */}
              <div className={`absolute left-[-37px] top-1 size-7 rounded-full border-4 border-background flex items-center justify-center shadow-sm ${getCategoryColor(act.category)} bg-background`}>
                {getIcon(act.category)}
              </div>

              {/* Card */}
              <div className="bg-card/30 border border-border/50 rounded-xl p-4 space-y-2 hover:bg-card/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{act.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getCategoryColor(act.category)}`}>
                      {act.category}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {act.description}
                </p>
                <div className="flex items-center gap-2 pt-1 border-t border-border/20 text-[10px] text-muted-foreground/70">
                  <span>Actor: {act.user}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
