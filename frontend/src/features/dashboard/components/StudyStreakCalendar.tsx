import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Flame, Star, Zap, CheckCircle2 } from '@/lib/icons'
import { useTasks } from '@/features/productivity/hooks/useTasks'
import type { Task } from '@/types/productivity'

// ─── Day Cell Intensity ───────────────────────────────────────────────────────
type DayActivity = {
  date: Date
  count: number       // number of tasks completed that day
  isToday: boolean
  isCurrentMonth: boolean
}

type Intensity = 0 | 1 | 2 | 3 | 4

function getIntensity(count: number): Intensity {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

const INTENSITY_CLASSES: Record<Intensity, string> = {
  0: 'bg-muted/30 border-border/20 text-muted-foreground/40',
  1: 'bg-violet-500/15 border-violet-500/25 text-violet-400',
  2: 'bg-violet-500/30 border-violet-500/40 text-violet-300',
  3: 'bg-violet-500/55 border-violet-500/60 text-violet-200',
  4: 'bg-violet-500/85 border-violet-400/80 text-white shadow-[0_0_8px_rgba(139,92,246,0.5)]',
}

const INTENSITY_GLOW: Record<Intensity, string> = {
  0: '',
  1: '',
  2: '',
  3: 'shadow-[0_0_6px_rgba(139,92,246,0.3)]',
  4: 'shadow-[0_0_12px_rgba(139,92,246,0.6)]',
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function DayTooltip({ day, visible }: { day: DayActivity; visible: boolean }) {
  const label = day.date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const taskText = day.count === 0
    ? 'No tasks completed'
    : day.count === 1
      ? '1 task completed'
      : `${day.count} tasks completed`

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.94 }}
          transition={{ duration: 0.15 }}
          className="absolute -top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-popover border border-border/80 rounded-lg px-2.5 py-1.5 shadow-xl text-center whitespace-nowrap">
            <p className="text-[10px] font-bold text-foreground">{label}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{taskText}</p>
            {day.isToday && (
              <span className="inline-block mt-0.5 text-[8px] font-bold text-violet-400 uppercase tracking-wider">Today</span>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-popover border-r border-b border-border/80 rounded-sm" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────
function DayCell({ day }: { day: DayActivity }) {
  const [hovered, setHovered] = useState(false)
  const intensity = getIntensity(day.count)
  const dayNum = day.date.getDate()

  return (
    <div className="relative flex items-center justify-center">
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.92 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={[
          'relative w-8 h-8 rounded-lg border text-[11px] font-semibold transition-all duration-150 cursor-pointer',
          INTENSITY_CLASSES[intensity],
          INTENSITY_GLOW[intensity],
          day.isToday ? 'ring-2 ring-violet-400/70 ring-offset-1 ring-offset-background' : '',
          !day.isCurrentMonth ? 'opacity-30' : '',
        ].join(' ')}
      >
        {dayNum}

        {/* Streak dot — shown for active days */}
        {intensity > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-violet-400 border border-background" />
        )}
      </motion.button>

      <DayTooltip day={day} visible={hovered} />
    </div>
  )
}

// ─── Streak Stat Pill ─────────────────────────────────────────────────────────
function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border/60 ${color}`}>
      <Icon className="size-3.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground leading-none">{label}</p>
        <p className="text-sm font-extrabold text-foreground leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function StudyStreakCalendar() {
  const { tasks } = useTasks()
  const today = new Date()

  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  // Build a map: "YYYY-MM-DD" → count of completed tasks that day
  const completionMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    const completed = (tasks as Task[]).filter(t => t.status === 'COMPLETED')
    for (const task of completed) {
      // Use updatedAt as proxy for "when it was completed"
      const raw = task.updatedAt || task.createdAt
      if (!raw) continue
      const d = new Date(raw)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      map[key] = (map[key] || 0) + 1
    }
    return map
  }, [tasks])

  // Build calendar grid for current view month
  const calendarDays = useMemo<DayActivity[]>(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    // First day of the month
    const firstDay = new Date(year, month, 1)

    // Start from Monday of the week that contains the first day
    const startOffset = (firstDay.getDay() + 6) % 7 // Mon=0
    const gridStart = new Date(firstDay)
    gridStart.setDate(gridStart.getDate() - startOffset)

    const days: DayActivity[] = []
    const current = new Date(gridStart)

    // 6 weeks × 7 days = 42 cells
    for (let i = 0; i < 42; i++) {
      const d = new Date(current)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      days.push({
        date: d,
        count: completionMap[key] || 0,
        isToday: d.toDateString() === today.toDateString(),
        isCurrentMonth: d.getMonth() === month,
      })
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [viewDate, completionMap, today])

  // Compute streak stats
  const { currentStreak, longestStreak, activeDaysThisMonth, totalCompleted } = useMemo(() => {
    // Current streak: consecutive days back from today with at least 1 completion
    let currentStreak = 0
    const cursor = new Date(today)
    while (true) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
      if ((completionMap[key] || 0) === 0) break
      currentStreak++
      cursor.setDate(cursor.getDate() - 1)
    }

    // Longest streak: scan all available keys in sorted order
    const allKeys = Object.keys(completionMap).sort()
    let longestStreak = 0
    let tempStreak = 0
    let prevDate: Date | null = null
    for (const key of allKeys) {
      const d = new Date(key)
      if (prevDate) {
        const diff = (d.getTime() - prevDate.getTime()) / 86_400_000
        if (diff === 1) {
          tempStreak++
        } else {
          tempStreak = 1
        }
      } else {
        tempStreak = 1
      }
      longestStreak = Math.max(longestStreak, tempStreak)
      prevDate = d
    }

    // Active days this month
    const activeDaysThisMonth = calendarDays
      .filter(d => d.isCurrentMonth && d.count > 0)
      .length

    const totalCompleted = (tasks as Task[]).filter(t => t.status === 'COMPLETED').length

    return { currentStreak, longestStreak, activeDaysThisMonth, totalCompleted }
  }, [completionMap, calendarDays, viewDate, tasks, today])

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const goToPrev = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const goToNext = () => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
    if (next <= today) setViewDate(next)
  }
  const isNextDisabled = viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear()

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Flame className="size-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground">Study Streak</h3>
            <p className="text-[10px] text-muted-foreground font-medium">Daily activity heatmap</p>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToPrev}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-xs font-bold text-foreground min-w-[100px] text-center">{monthLabel}</span>
          <button
            onClick={goToNext}
            disabled={isNextDisabled}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="px-5 py-4">
        {/* Weekday Labels */}
        <div className="grid grid-cols-7 mb-2">
          {weekdays.map(d => (
            <div key={d} className="text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {d}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <motion.div
          key={monthLabel}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-1"
        >
          {calendarDays.map((day, i) => (
            <div key={i} className="flex justify-center">
              <DayCell day={day} />
            </div>
          ))}
        </motion.div>

        {/* Intensity Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-3 pt-3 border-t border-border/30">
          <span className="text-[9px] text-muted-foreground/60 font-medium mr-0.5">Less</span>
          {([0, 1, 2, 3, 4] as Intensity[]).map(i => (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm border ${INTENSITY_CLASSES[i]}`}
            />
          ))}
          <span className="text-[9px] text-muted-foreground/60 font-medium ml-0.5">More</span>
        </div>
      </div>

      {/* Stat Pills */}
      <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatPill
          icon={Flame}
          label="Current Streak"
          value={`${currentStreak}d`}
          color="text-orange-500"
        />
        <StatPill
          icon={Star}
          label="Best Streak"
          value={`${longestStreak}d`}
          color="text-amber-500"
        />
        <StatPill
          icon={CheckCircle2}
          label="Active Days"
          value={`${activeDaysThisMonth} / ${new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()}`}
          color="text-violet-400"
        />
        <StatPill
          icon={Zap}
          label="Total Done"
          value={totalCompleted}
          color="text-emerald-500"
        />
      </div>
    </div>
  )
}
