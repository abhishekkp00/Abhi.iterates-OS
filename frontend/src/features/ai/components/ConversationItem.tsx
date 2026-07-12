import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trash2, PenLine, MoreHorizontal, MessageCircle, Check, X } from '@/lib/icons'
import type { Conversation } from '@/types/ai'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onDelete: () => void
  onRename: (title: string) => void
}

/**
 * ConversationItem — single row in the sidebar list.
 * Supports inline rename (double-click title or click pencil icon).
 */
export function ConversationItem({
  conversation,
  isActive,
  onDelete,
  onRename,
}: ConversationItemProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(conversation.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const commitRename = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== conversation.title) onRename(trimmed)
    setEditing(false)
  }

  const cancelRename = () => {
    setEditValue(conversation.title)
    setEditing(false)
  }

  const timeLabel = new Date(conversation.updatedAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`group relative flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-foreground hover:bg-muted'
      }`}
      onClick={() => !editing && navigate(`/ai/chat/${conversation.id}`)}
      role="button"
      aria-current={isActive ? 'page' : undefined}
      aria-label={`Conversation: ${conversation.title}`}
    >
      <MessageCircle className="size-3.5 shrink-0 text-muted-foreground" />

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') cancelRename()
              }}
              className="flex-1 min-w-0 rounded border border-primary/50 bg-background px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Rename conversation"
            />
            <button onClick={commitRename} className="text-success hover:text-success/80" aria-label="Save rename">
              <Check className="size-3" />
            </button>
            <button onClick={cancelRename} className="text-muted-foreground hover:text-destructive" aria-label="Cancel rename">
              <X className="size-3" />
            </button>
          </div>
        ) : (
          <>
            <p className="truncate text-xs font-medium leading-tight">{conversation.title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{timeLabel}</p>
          </>
        )}
      </div>

      {/* Context menu button — visible on hover or when active */}
      {!editing && (
        <div
          className="relative opacity-0 group-hover:opacity-100 transition-opacity"
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded p-1 hover:bg-muted-foreground/10"
            aria-label="Conversation options"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal className="size-3.5 text-muted-foreground" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-card shadow-lg overflow-hidden text-xs">
              <button
                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                onClick={() => { setEditing(true); setMenuOpen(false) }}
              >
                <PenLine className="size-3.5 text-muted-foreground" />
                Rename
              </button>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-destructive/10 text-destructive transition-colors"
                onClick={() => { onDelete(); setMenuOpen(false) }}
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
