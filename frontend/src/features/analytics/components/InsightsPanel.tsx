import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Zap } from '@/lib/icons'

interface InsightsPanelProps {
  insights: string[]
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  return (
    <Card className="bg-card/60 backdrop-blur-md border border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Brain className="size-4.5 text-primary" />
          AI Productivity Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No insights available yet. Schedule more study events or complete tasks to trigger personalized recommendations.
          </p>
        ) : (
          <ul className="space-y-3.5">
            {insights.map((insight, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground p-3 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <div className="p-1 rounded-lg bg-primary/10 mt-0.5">
                  <Zap className="size-3.5 text-primary" />
                </div>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
