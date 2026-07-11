import { EmptyState } from '@/components/ui/feedback'
import { Sparkles } from '@/lib/icons'

export default function SettingsPage() {
  return (
    <div className="page-container">
      <EmptyState
        icon={<Sparkles className="size-6" />}
        title="Settings"
        description="This section is coming soon. Foundation is ready."
      />
    </div>
  )
}
