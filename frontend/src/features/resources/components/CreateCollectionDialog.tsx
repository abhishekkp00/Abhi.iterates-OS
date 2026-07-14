import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, BookOpen, Clock, Tag, X } from '@/lib/icons'

interface CreateCollectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, icon: string, color: string) => void
}

const ICON_OPTIONS = [
  { name: 'Sparkles', icon: Sparkles },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Clock', icon: Clock },
  { name: 'Tag', icon: Tag },
]

const COLOR_OPTIONS = [
  { name: 'purple', class: 'text-purple-400 bg-purple-500/10' },
  { name: 'emerald', class: 'text-emerald-400 bg-emerald-500/10' },
  { name: 'amber', class: 'text-amber-400 bg-amber-500/10' },
  { name: 'blue', class: 'text-blue-400 bg-blue-500/10' },
]

export function CreateCollectionDialog({ isOpen, onClose, onCreate }: CreateCollectionDialogProps) {
  const [name, setName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('Sparkles')
  const [selectedColor, setSelectedColor] = useState('text-purple-400')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreate(name.trim(), selectedIcon, selectedColor)
    setName('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border/80 rounded-xl shadow-xl w-full max-w-sm overflow-hidden relative p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold tracking-tight">Create Collection</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Collection Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Collection Name
            </label>
            <Input
              placeholder="e.g. Midterm Preparation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border-border bg-background/50 h-10"
              required
            />
          </div>

          {/* Icon Picker */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Choose Icon
            </label>
            <div className="flex gap-2">
              {ICON_OPTIONS.map((item) => {
                const Icon = item.icon
                const isSelected = selectedIcon === item.name
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedIcon(item.name)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 bg-background hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="size-4.5" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Color Theme Picker */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Choose Color Theme
            </label>
            <div className="flex gap-2.5">
              {COLOR_OPTIONS.map((color) => {
                const colorPrefix = color.class.split(' ')[0]
                const isSelected = selectedColor === colorPrefix
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(colorPrefix || 'text-purple-400')}
                    className={`size-6 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : ''
                    } ${color.class.split(' ')[1]}`}
                  >
                    <span className={`size-3 rounded-full ${colorPrefix}`} style={{ backgroundColor: 'currentColor' }} />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl text-xs font-bold cursor-pointer"
              disabled={!name.trim()}
            >
              Create Collection
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
