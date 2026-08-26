import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Upload, Sparkles, Plus, ShoppingBag, Calendar, Search } from '@/lib/icons'

interface QuickActionItem {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  badgeText: string
  color: string
  borderColor: string
  action: () => void
}

export function QuickActions() {
  const navigate = useNavigate()

  const triggerGlobalSearch = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  const items: QuickActionItem[] = [
    {
      title: 'Upload Resource',
      description: 'Add textbooks, notes, or papers',
      icon: Upload,
      badgeText: 'DOC_ADD',
      color: 'text-emerald-400 bg-emerald-500/10',
      borderColor: 'border-emerald-500/30 hover:border-emerald-400',
      action: () => navigate('/resources'),
    },
    {
      title: 'Open AI Workspace',
      description: 'Consult with the RAG study assistant',
      icon: Sparkles,
      badgeText: 'AI_RAG',
      color: 'text-cyan-400 bg-cyan-500/10',
      borderColor: 'border-cyan-500/30 hover:border-cyan-400',
      action: () => navigate('/ai'),
    },
    {
      title: 'Add Task',
      description: 'Record a new planner item',
      icon: Plus,
      badgeText: 'TASK_NEW',
      color: 'text-amber-400 bg-amber-500/10',
      borderColor: 'border-amber-500/30 hover:border-amber-400',
      action: () => navigate('/planner'),
    },
    {
      title: 'Browse Marketplace',
      description: 'Explore active campus offers',
      icon: ShoppingBag,
      badgeText: 'STORE',
      color: 'text-purple-400 bg-purple-500/10',
      borderColor: 'border-purple-500/30 hover:border-purple-400',
      action: () => navigate('/marketplace'),
    },
    {
      title: 'Open Planner',
      description: 'Review your calendar & agenda',
      icon: Calendar,
      badgeText: 'CALENDAR',
      color: 'text-pink-400 bg-pink-500/10',
      borderColor: 'border-pink-500/30 hover:border-pink-400',
      action: () => navigate('/planner'),
    },
    {
      title: 'Search Resources',
      description: 'Search files using command menu',
      icon: Search,
      badgeText: 'CMD_K',
      color: 'text-teal-400 bg-teal-500/10',
      borderColor: 'border-teal-500/30 hover:border-teal-400',
      action: triggerGlobalSearch,
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between font-mono text-2xs uppercase tracking-widest text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="text-amber-400 font-bold">&gt;</span>
          <span>QUICK_MODULE_ACTIONS</span>
        </span>
        <span className="text-slate-500">[6 COMMANDS]</span>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {items.map((item, idx) => {
          const Icon = item.icon
          return (
            <motion.div key={idx} variants={itemVariants}>
              <div
                className={`retro-card cursor-pointer ${item.borderColor} relative group select-none p-4 flex items-start gap-4 hover:translate-x-[1px] hover:translate-y-[1px]`}
                onClick={item.action}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    item.action()
                  }
                }}
              >
                <div className={`p-2.5 rounded border border-white/10 ${item.color} shrink-0`}>
                  <Icon className="size-4.5" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors">
                      {item.title}
                    </h3>
                    <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-slate-400 font-semibold">
                      [{item.badgeText}]
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-sans truncate">{item.description}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
