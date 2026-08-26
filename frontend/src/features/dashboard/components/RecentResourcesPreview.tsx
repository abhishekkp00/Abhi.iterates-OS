import { useNavigate } from 'react-router-dom'
import { useResourcesListQuery } from '@/features/resources/hooks/useResources'
import { Button } from '@/components/ui/button'
import { BookOpen, FileText, Download, ArrowRight, Loader2, AlertCircle } from '@/lib/icons'
import { API_BASE_URL } from '@/constants/app'

export function RecentResourcesPreview() {
  const navigate = useNavigate()

  const { data: resourcesData, isLoading } = useResourcesListQuery({
    page: 1,
    size: 4,
    sort: 'createdAt,desc',
  })

  const resources = resourcesData?.content || []

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'BOOK':
        return BookOpen
      default:
        return FileText
    }
  }

  const categoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'LECTURE':
        return 'badge-indigo'
      case 'BOOK':
        return 'badge-emerald'
      case 'CHEATSHEET':
        return 'badge-amber'
      case 'PAST_PAPER':
        return 'badge-rose'
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700 text-xs px-2 py-0.5 rounded-full'
    }
  }

  return (
    <div className="clean-card flex flex-col justify-between min-h-[300px]">
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4.5 text-emerald-400" />
            <h2 className="font-display text-base font-bold text-white tracking-tight">Recent Resources</h2>
          </div>
          <Button
            variant="ghost"
            size="xs"
            className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:text-white h-7 px-2"
            onClick={() => {
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: true,
                bubbles: true,
              })
              document.dispatchEvent(event)
            }}
          >
            <span>Search</span>
            <kbd className="text-[9px] font-mono opacity-80 border-l border-slate-700 pl-1 ml-0.5">⌘K</kbd>
          </Button>
        </div>

        <div>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2 font-medium text-xs">
              <Loader2 className="size-5 animate-spin text-emerald-400" />
              <span>Loading resources...</span>
            </div>
          ) : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3 border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
              <div className="p-2.5 rounded-full bg-slate-800 border border-slate-700">
                <AlertCircle className="size-5 text-emerald-400" />
              </div>
              <div className="space-y-1 px-4 text-xs">
                <p className="font-bold text-white">No resources uploaded</p>
                <p className="text-slate-400 font-medium max-w-[240px]">
                  Store notes, homework answers, and exam cheat sheets here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {resources.map((resource) => {
                const Icon = getCategoryIcon(resource.category)
                const firstAttachment = resource.attachments?.[0]
                return (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 hover:border-emerald-500/30 bg-slate-900/50 hover:bg-slate-900 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 shrink-0">
                        <Icon className="size-3.5 text-emerald-400/80 group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <div className="space-y-0.5 truncate">
                        <span
                          onClick={() => navigate('/resources')}
                          className="text-xs font-semibold text-slate-200 tracking-tight cursor-pointer hover:text-emerald-400 transition-colors block truncate"
                        >
                          {resource.title}
                        </span>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Uploaded {new Date(resource.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={categoryBadgeStyle(resource.category)}>
                        {resource.category}
                      </span>
                      {firstAttachment && (
                        <a
                          href={`${API_BASE_URL}/api/v1/resources/attachments/download/${firstAttachment.id}`}
                          download
                          className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-400 hover:text-emerald-400 transition-colors"
                          title="Download file"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 mt-4 border-t border-slate-800">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs font-bold text-slate-400 hover:text-emerald-400 justify-between group hover:bg-transparent"
          onClick={() => navigate('/resources')}
        >
          <span>View Study Library</span>
          <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  )
}
