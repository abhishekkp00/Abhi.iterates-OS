import { EmptyState } from '@/components/ui/feedback'
import { Sparkles } from '@/lib/icons'

export default function AIWorkspacePage() {
  return (
    <div className="page-container">
      <EmptyState
        icon={<Sparkles className="size-6" />}
        title="AIWorkspace"
        description="This section is coming soon. Foundation is ready."
      />
    </div>
  )
}
