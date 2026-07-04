import { EmptyState } from '@/components/ui/feedback'
import { Sparkles } from '@/lib/icons'

export default function DashboardPage() {
  return (
    <div className="page-container">
      <EmptyState
        icon={<Sparkles className="size-6" />}
        title="Dashboard"
        description="This section is coming soon. Foundation is ready."
      />
    </div>
  )
}
