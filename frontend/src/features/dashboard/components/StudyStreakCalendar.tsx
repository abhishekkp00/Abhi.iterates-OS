import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Flame, Trophy, CalendarCheck, CheckCircle2 } from '@/lib/icons'
import { useTasks } from '@/features/productivity/hooks/useTasks'
import type { Task } from '@/types/productivity'

type DayActivity = {
  date: Date
  count: number
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
  0: 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60',
  1: 'bg-emerald-950/60 border-emerald-700/40 text-emerald-300 font-bold hover:border-emerald-500',
  2: 'bg-emerald-900/80 border-emerald-600/50 text-emerald-200 font-bold hover:border-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.2)]',
  3: 'bg-emerald-700/80 border-emerald-500/70 text-white font-bold hover:border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.35)]',
  4: 'bg-emerald-500 border-emerald-400 text-slate-950 font-extrabold hover:border-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.5)]',
}

function DayTooltip({ day, visible }: { day: DayActivity; visible: boolean }) {
  const label = day.date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const taskText =
    day.count === 0
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
          <div className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 shadow-xl text-center whitespace-nowrap">
            <p className="text-[11px] font-bold text-white">{label}</p>
            <p className="text-[10px] text-slate-300 font-medium mt-0.5">{taskText}</p>
            {day.isToday && (
              <span className="inline-block mt-0.5 text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                Today
              </span>
            )}
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-900 border-r border-b border-slate-700" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DayCell({ day }: { day: DayActivity }) {
  const [hovered, setHovered] = useState(false)
  const intensity = getIntensity(day.count)
  const dayNum = day.date.getDate()

  return (
    <div className="relative flex items-center justify-center w-full">
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`
          aspect-square w-full max-w-[36px] rounded-lg border text-xs font-medium transition-all duration-150 flex items-center justify-center relative cursor-pointer
          ${INTENSITY_CLASSES[intensity]}
          ${day.isToday ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950 font-bold text-white' : ''}
          ${!day.isCurrentMonth ? 'opacity-25 pointer-events-none' : ''}
        `}
      >
        <span>{dayNum}</span>
        {intensity > 0 && !day.isToday && (
          <span className="absolute bottom-1 size-1 rounded-full bg-emerald-400" />
        )}
      </button>

      <DayTooltip day={day} visible={hovered} />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-800/80 bg-slate-900/50">
      <div className={`p-2 rounded-lg border ${iconBg} ${iconColor} shrink-0`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 leading-tight">
          {label}
        </p>
        <p className="text-sm font-bold text-white tracking-tight mt-0.5 leading-none">
          {value}
        </p>
      </div>
    </div>
  )
}

export function StudyStreakCalendar() {
  const { tasks } = useTasks()
  const today = new Date()

  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const completionMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    const completed = (tasks as Task[]).filter((t) => t.status === 'COMPLETED')
    for (const task of completed) {
      const raw = task.updatedAt || task.createdAt
      if (!raw) continue
      const d = new Date(raw)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      map[key] = (map[key] || 0) + 1
    }
    return map
  }, [tasks])

  const calendarDays = useMemo<DayActivity[]>(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const startOffset = (firstDay.getDay() + 6) % 7
    const gridStart = new Date(firstDay)
    gridStart.setDate(gridStart.getDate() - startOffset)

    const days: DayActivity[] = []
    const current = new Date(gridStart)

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

  const { currentStreak, longestStreak, activeDaysThisMonth, totalCompleted } = useMemo(() => {
    let currentStreak = 0
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

    const hasToday = (completionMap[todayStr] || 0) > 0
    const hasYesterday = (completionMap[yesterdayStr] || 0) > 0

    if (hasToday || hasYesterday) {
      const cursor = hasToday ? new Date(today) : yesterday
      while (true) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
        if ((completionMap[key] || 0) === 0) break
        currentStreak++
        cursor.setDate(cursor.getDate() - 1)
      }
    }

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

    const activeDaysThisMonth = calendarDays.filter((d) => d.isCurrentMonth && d.count > 0).length
    const totalCompleted = (tasks as Task[]).filter((t) => t.status === 'COMPLETED').length

    return { currentStreak, longestStreak, activeDaysThisMonth, totalCompleted }
  }, [completionMap, calendarDays, tasks, today])

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const goToPrev = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const goToNext = () => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
    if (next <= today) setViewDate(next)
  }
  const isNextDisabled =
    viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear()

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()

  return (
    <div className="clean-card p-5 flex flex-col justify-between">
      <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="size-4 text-amber-500" />
          <h3 className="font-display text-base font-bold text-white tracking-tight">Study Streak Activity</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            className="p-1 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-xs font-bold text-slate-200 min-w-[100px] text-center">{monthLabel}</span>
          <button
            onClick={goToNext}
            disabled={isNextDisabled}
            className="p-1 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="py-4 space-y-3">
        <div className="grid grid-cols-7 gap-1">
          {weekdays.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 py-1"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((day, i) => (
            <DayCell key={i} day={day} />
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-medium">
          <span>Activity Level</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px]">Less</span>
            {([0, 1, 2, 3, 4] as Intensity[]).map((i) => (
              <div
                key={i}
                className={`size-3 rounded-xs border ${INTENSITY_CLASSES[i]}`}
              />
            ))}
            <span className="text-[9px]">More</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={`${currentStreak} Days`}
          iconBg="bg-amber-500/10 border-amber-500/30"
          iconColor="text-amber-400"
        />
        <StatCard
          icon={Trophy}
          label="Best Streak"
          value={`${longestStreak} Days`}
          iconBg="bg-indigo-500/10 border-indigo-500/30"
          iconColor="text-indigo-400"
        />
        <StatCard
          icon={CalendarCheck}
          label="Active Days"
          value={`${activeDaysThisMonth} / ${daysInMonth}`}
          iconBg="bg-emerald-500/10 border-emerald-500/30"
          iconColor="text-emerald-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Total Tasks"
          value={totalCompleted}
          iconBg="bg-cyan-500/10 border-cyan-500/30"
          iconColor="text-cyan-400"
        />
      </div>
    </div>
  )
}
