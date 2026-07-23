import { Card, CardContent } from '@/components/ui/card'

export function TaskSkeleton() {
  return (
    <Card className="w-full bg-card/50 border-border/40 animate-pulse">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="size-5 rounded bg-muted mt-1 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="flex gap-2 pt-2">
            <div className="h-5 bg-muted rounded w-16" />
            <div className="h-5 bg-muted rounded w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
