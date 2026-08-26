import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Upload, Sparkles, Plus, ShoppingBag, Calendar, Search } from '@/lib/icons'

interface QuickActionItem {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
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
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      action: () => navigate('/resources'),
    },
    {
      title: 'Open AI Workspace',
      description: 'Consult with the RAG study assistant',
      icon: Sparkles,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      action: () => navigate('/ai'),
    },
    {
      title: 'Add Task',
      description: 'Record a new planner item',
      icon: Plus,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      action: () => navigate('/planner'),
    },
    {
      title: 'Browse Marketplace',
      description: 'Explore active campus offers',
      icon: ShoppingBag,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      action: () => navigate('/marketplace'),
    },
    {
      title: 'Open Planner',
      description: 'Review your calendar & agenda',
      icon: Calendar,
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
      action: () => navigate('/planner'),
    },
    {
      title: 'Search Resources',
      description: 'Search files using command menu',
      icon: Search,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
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
      <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span>Quick Study Actions</span>
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
                className="clean-card cursor-pointer group p-4 flex items-start gap-4 hover:-translate-y-1 transition-all duration-200"
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
                <div className={`p-2.5 rounded-xl border ${item.color} shrink-0`}>
                  <Icon className="size-4.5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h3 className="font-display text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium truncate">{item.description}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
