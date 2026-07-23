import { useNavigate } from 'react-router-dom'
import { useResourcesListQuery } from '@/features/resources/hooks/useResources'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText, Download, ArrowRight, Loader2, AlertCircle } from '@/lib/icons'
import { API_BASE_URL } from '@/constants/app'

export function RecentResourcesPreview() {
  const navigate = useNavigate()

  // Fetch the latest 4 resources
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

  const categoryColor = (category: string) => {
    switch (category) {
      case 'LECTURE':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'BOOK':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'CHEATSHEET':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'PAST_PAPER':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border/40'
    }
  }

  return (
    <Card className="border border-border/60 bg-card/45 backdrop-blur-sm flex flex-col justify-between min-h-[300px]">
      <div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4.5 text-primary" />
            <CardTitle className="text-base font-bold tracking-tight">Recent Resources</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="xs"
            className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 border border-border/40 bg-background/50 hover:bg-muted"
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
            <kbd className="text-[9px] font-mono opacity-80 border-l border-border/60 pl-1 ml-0.5">⌘K</kbd>
          </Button>
        </CardHeader>

        <CardContent className="pt-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs font-semibold">Loading resources...</span>
            </div>
          ) : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3 border border-dashed border-border/40 rounded-xl bg-muted/10">
              <div className="p-3 rounded-full bg-muted border border-border/30">
                <AlertCircle className="size-5 text-muted-foreground" />
              </div>
              <div className="space-y-1 px-4">
                <p className="text-sm font-bold text-foreground">No resources uploaded</p>
                <p className="text-xs text-muted-foreground font-medium max-w-[240px]">
                  Store notes, homework answers, and exam cheat sheets here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {resources.map((resource) => {
                const Icon = getCategoryIcon(resource.category)
                const firstAttachment = resource.attachments?.[0]
                return (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/40 hover:border-border/80 bg-background/30 hover:bg-background/60 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-card border border-border/40 shrink-0">
                        <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="space-y-0.5 truncate">
                        <span
                          onClick={() => navigate('/resources')}
                          className="text-sm font-semibold text-foreground tracking-tight cursor-pointer hover:text-primary transition-colors block truncate"
                        >
                          {resource.title}
                        </span>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          Uploaded {new Date(resource.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[9px] font-bold py-0 px-2 rounded-lg border ${categoryColor(resource.category)}`}>
                        {resource.category}
                      </Badge>
                      {firstAttachment && (
                        <a
                          href={`${API_BASE_URL}/api/v1/resources/attachments/download/${firstAttachment.id}`}
                          download
                          className="p-1.5 rounded-lg border border-border/40 hover:border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150"
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
        </CardContent>
      </div>

      <CardFooter className="pt-2 border-t border-border/40">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs font-bold text-muted-foreground hover:text-foreground justify-between group"
          onClick={() => navigate('/resources')}
        >
          <span>View Study Library</span>
          <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  )
}
