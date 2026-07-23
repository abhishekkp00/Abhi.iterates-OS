import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Upload, Sparkles, Plus, ShoppingBag, Calendar, Search } from '@/lib/icons'
import { Card, CardContent } from '@/components/ui/card'

interface QuickActionItem {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  action: () => void
}

export function QuickActions() {
  const navigate = useNavigate()

  // Dispatch custom keyboard event to toggle CommandMenu
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
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      action: () => navigate('/resources'),
    },
    {
      title: 'Open AI Workspace',
      description: 'Consult with the RAG study assistant',
      icon: Sparkles,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      action: () => navigate('/ai'),
    },
    {
      title: 'Add Task',
      description: 'Record a new planner item',
      icon: Plus,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      action: () => navigate('/planner'),
    },
    {
      title: 'Browse Marketplace',
      description: 'Explore active campus offers',
      icon: ShoppingBag,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      action: () => navigate('/marketplace'),
    },
    {
      title: 'Open Planner',
      description: 'Review your calendar & agenda',
      icon: Calendar,
      color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
      action: () => navigate('/planner'),
    },
    {
      title: 'Search Resources',
      description: 'Search files using command menu',
      icon: Search,
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      action: triggerGlobalSearch,
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Quick Actions</h2>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {items.map((item, idx) => {
          const Icon = item.icon
          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Card
                className="cursor-pointer overflow-hidden border border-border/60 hover:border-border/100 hover:shadow-md transition-all duration-200 bg-card/45 backdrop-blur-sm select-none"
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
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl border ${item.color} shrink-0`}>
                    <Icon className="size-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-semibold text-foreground tracking-tight">{item.title}</h3>
                    <p className="text-xs text-muted-foreground font-medium leading-normal">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
