import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, ExternalLink, Quote } from '@/lib/icons'
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
  snippets: string[]
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
        if (source.snippet && !existing.snippets.includes(source.snippet)) {
          existing.snippets.push(source.snippet)
        }
      } else {
        map.set(key, {
          resourceId: source.resourceId,
          documentId: source.documentId,
          title: source.title || source.filename || 'Academic Document',
          filename: source.filename,
          pageNumbers: source.pageNumber != null ? [source.pageNumber] : [],
          snippets: source.snippet ? [source.snippet] : [],
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
      navigate(`/resources/study/${group.resourceId}?page=${firstPage}${fileParam}&highlight=true`)
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
          const primarySnippet = group.snippets.length > 0 ? group.snippets[0] : null

          return (
            <div key={group.documentId || group.title} className="relative group/pill inline-block">
              <button
                onClick={() => handleSourceClick(group)}
                aria-label={accessibleLabel}
                className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/60 hover:bg-accent hover:text-accent-foreground border border-border/60 text-muted-foreground transition-all duration-150 text-left focus:outline-none focus:ring-1 focus:ring-ring"
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

              {/* Hover Popover Excerpt Tooltip */}
              {primarySnippet && (
                <div className="pointer-events-none absolute bottom-full left-0 mb-2 hidden group-hover/pill:block z-50 w-72 p-3 rounded-lg bg-popover border border-border text-popover-foreground shadow-md text-xs space-y-1.5 animate-in fade-in-0 zoom-in-95">
                  <div className="flex items-center justify-between font-semibold text-[11px] text-foreground border-b border-border/40 pb-1">
                    <span className="truncate pr-2">{group.title}</span>
                    {pageStr && <span className="font-mono text-muted-foreground">{pageStr}</span>}
                  </div>
                  <div className="flex gap-1.5 text-muted-foreground text-[11px] leading-relaxed pt-0.5">
                    <Quote className="size-3 shrink-0 text-primary/70 mt-0.5" />
                    <p className="line-clamp-4 italic bg-muted/30 p-1.5 rounded border border-border/20">{primarySnippet}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
