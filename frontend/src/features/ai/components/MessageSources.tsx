import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, ExternalLink } from '@/lib/icons'
import type { AiSource } from '@/types/ai'

interface MessageSourcesProps {
  sources?: AiSource[]
}

interface GroupedSource {
  resourceId?: string
  documentId: string
  title: string
  filename?: string
  pageNumbers: number[]
}

export function MessageSources({ sources }: MessageSourcesProps) {
  const navigate = useNavigate()

  const groupedSources = useMemo(() => {
    if (!sources || sources.length === 0) return []

    const map = new Map<string, GroupedSource>()

    for (const source of sources) {
      const key = source.resourceId || source.documentId || source.title
      const existing = map.get(key)

      if (existing) {
        if (source.pageNumber != null && !existing.pageNumbers.includes(source.pageNumber)) {
          existing.pageNumbers.push(source.pageNumber)
        }
      } else {
        map.set(key, {
          resourceId: source.resourceId,
          documentId: source.documentId,
          title: source.title || source.filename || 'Academic Document',
          filename: source.filename,
          pageNumbers: source.pageNumber != null ? [source.pageNumber] : [],
        })
      }
    }

    // Sort page numbers for each group
    const result = Array.from(map.values())
    for (const group of result) {
      group.pageNumbers.sort((a, b) => a - b)
    }

    return result
  }, [sources])

  if (!groupedSources || groupedSources.length === 0) {
    return null
  }

  const handleSourceClick = (group: GroupedSource) => {
    if (group.resourceId) {
      const firstPage = group.pageNumbers.length > 0 ? group.pageNumbers[0] : 1
      const fileParam = group.filename ? `&file=${encodeURIComponent(group.filename)}` : ''
      navigate(`/resources/study/${group.resourceId}?page=${firstPage}${fileParam}`)
    } else {
      navigate('/resources')
    }
  }

  const formatPages = (pages: number[]) => {
    if (pages.length === 0) return null
    if (pages.length === 1) return `p. ${pages[0]}`
    
    // Check for continuous range
    let isContinuous = true
    for (let i = 1; i < pages.length; i++) {
      if (pages[i] !== pages[i - 1]! + 1) {
        isContinuous = false
        break
      }
    }
    if (isContinuous && pages.length > 2) {
      return `p. ${pages[0]}–${pages[pages.length - 1]}`
    }
    return `p. ${pages.join(', ')}`
  }

  return (
    <div className="mt-3 pt-2.5 border-t border-border/50 text-xs">
      <div className="flex items-center gap-1.5 mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        <FileText className="size-3.5 text-primary/70" />
        <span>Sources</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {groupedSources.map((group) => {
          const pageStr = formatPages(group.pageNumbers)
          const accessibleLabel = `Open ${group.title}${pageStr ? `, ${pageStr}` : ''}`

          return (
            <button
              key={group.documentId || group.title}
              onClick={() => handleSourceClick(group)}
              aria-label={accessibleLabel}
              title={accessibleLabel}
              className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/60 hover:bg-accent hover:text-accent-foreground border border-border/60 text-muted-foreground transition-all duration-150 text-left focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <span className="font-medium truncate max-w-[200px] text-foreground text-xs">
                {group.title}
              </span>
              {pageStr && (
                <span className="inline-flex items-center rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground border border-border/40">
                  {pageStr}
                </span>
              )}
              <ExternalLink className="size-3 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
