import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Clock, Sparkles, ShoppingBag } from '@/lib/icons'

interface OverviewCardsProps {
  completedTasks: number
  taskCompletionRate: number
  totalStudyHours: number
  totalAiTokens: number
  activeListings: number
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  completedTasks,
  taskCompletionRate,
  totalStudyHours,
  totalAiTokens,
  activeListings,
}) => {
  const cards = [
    {
      title: 'Tasks Completed',
      value: completedTasks,
      description: `${Math.round(taskCompletionRate)}% completion rate`,
      icon: <CheckCircle2 className="size-5 text-blue-500" />,
      borderColor: 'hover:border-blue-500/30',
      bgColor: 'bg-blue-500/5',
    },
    {
      title: 'Total Study Time',
      value: `${totalStudyHours.toFixed(1)} hrs`,
      description: 'Logged study sessions',
      icon: <Clock className="size-5 text-purple-400" />,
      borderColor: 'hover:border-purple-500/30',
      bgColor: 'bg-purple-500/5',
    },
    {
      title: 'AI Tokens Consumed',
      value: totalAiTokens.toLocaleString(),
      description: 'AI chat & planning context',
      icon: <Sparkles className="size-5 text-cyan-400" />,
      borderColor: 'hover:border-cyan-500/30',
      bgColor: 'bg-cyan-500/5',
    },
    {
      title: 'Marketplace listings',
      value: activeListings,
      description: 'Active sell items',
      icon: <ShoppingBag className="size-5 text-emerald-400" />,
      borderColor: 'hover:border-emerald-500/30',
      bgColor: 'bg-emerald-500/5',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <Card
          key={idx}
          className={`bg-card/60 backdrop-blur-md border border-border/60 transition-all duration-300 ${card.borderColor}`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {card.title}
              </p>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{card.value}</h3>
              <p className="text-[10px] text-muted-foreground">{card.description}</p>
            </div>
            <div className={`p-3 rounded-2xl ${card.bgColor}`}>{card.icon}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
