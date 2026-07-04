import { EmptyState } from '@/components/ui/feedback'
import { Sparkles } from '@/lib/icons'

export default function ResourcesPage() {
  return (
    <div className="page-container">
      <EmptyState
        icon={<Sparkles className="size-6" />}
        title="Resources"
        description="This section is coming soon. Foundation is ready."
      />
    </div>
  )
}
