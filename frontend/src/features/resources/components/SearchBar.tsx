import { useState, useEffect, useRef } from 'react'
import { useResourcesStore } from '../store/resources.store'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Search, X, Clock, Sparkles } from '@/lib/icons'

// Sample suggestions
const SUGGESTIONS = ['Cheat Sheet', 'Lecture Slides', 'Past Paper', 'Algorithms', 'Organic Chemistry']

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useResourcesStore()
  const [inputValue, setInputValue] = useState(searchQuery)
  const [isOpen, setIsOpen] = useState(false)
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('abhi-os-search-history')
    return saved ? JSON.parse(saved) : []
  })

  const containerRef = useRef<HTMLDivElement>(null)

  // 1. Debounce input value change to store
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue)
      // Save search term to history if it has content
      if (inputValue.trim().length > 1) {
        saveToHistory(inputValue.trim())
      }
    }, 450)

    return () => clearTimeout(timer)
  }, [inputValue, setSearchQuery])

  // Sync state if store query changes externally
  useEffect(() => {
    setInputValue(searchQuery)
  }, [searchQuery])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const saveToHistory = (term: string) => {
    setHistory((prev) => {
      const filtered = prev.filter((t) => t.toLowerCase() !== term.toLowerCase())
      const updated = [term, ...filtered].slice(0, 5) // cap history list to 5 items
      localStorage.setItem('abhi-os-search-history', JSON.stringify(updated))
      return updated
    })
  }

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation()
    setHistory([])
    localStorage.removeItem('abhi-os-search-history')
  }

  const handleRemoveHistoryItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation()
    setHistory((prev) => {
      const updated = prev.filter((t) => t !== item)
      localStorage.setItem('abhi-os-search-history', JSON.stringify(updated))
      return updated
    })
  }

  const handleSelectTerm = (term: string) => {
    setInputValue(term)
    setIsOpen(false)
  }

  const handleClearInput = () => {
    setInputValue('')
    setSearchQuery('')
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search resources by title, description or tag..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 h-10 rounded-xl border-border bg-background/50 focus-visible:ring-1 focus-visible:ring-primary"
        />
        {inputValue && (
          <button
            onClick={handleClearInput}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
            title="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Suggestion Popover Dropdown */}
      {isOpen && (history.length > 0 || inputValue.trim() === '') && (
        <Card className="absolute left-0 right-0 mt-2 z-50 p-3 border border-border/80 bg-card/95 backdrop-blur-md shadow-xl rounded-xl space-y-3.5">
          {/* Recent Searches */}
          {history.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                <span>Recent Searches</span>
                <button
                  onClick={handleClearHistory}
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-0.5">
                {history.map((term, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectTerm(term)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span>{term}</span>
                    </div>
                    <button
                      onClick={(e) => handleRemoveHistoryItem(e, term)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-background rounded-md text-muted-foreground hover:text-foreground transition-all"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Prompts */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 block">Suggestions</span>
            <div className="flex flex-wrap gap-1.5 px-1">
              {SUGGESTIONS.map((term, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectTerm(term)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="size-3 text-primary/70" />
                  <span>{term}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
