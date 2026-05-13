"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

// ── Types ──────────────────────────────────────────────────────────────────
export type EventType = "fomc" | "macro" | "earnings" | "conference"

export interface CalEvent {
  date: string
  type: EventType
  title: string
  prev: string | null
  forecast: string | null
  unit: string | null
}

interface CalendarViewProps {
  events: CalEvent[]
  loading: boolean
  year: number
  month: number
  onYearChange: (y: number) => void
  onMonthChange: (m: number) => void
}

// ── Design tokens ──────────────────────────────────────────────────────────
const TYPE_META: Record<EventType, {
  label: string
  dot: string
  badge: string
  badgeSolid: string
  border: string
  glow: string
}> = {
  fomc:       {
    label: "央行會議",
    dot:   "bg-red-400",
    badge: "bg-red-400/15 text-red-500 border-red-400/30",
    badgeSolid: "bg-red-400/25 text-red-600 border-red-400/40",
    border: "border-l-red-400",
    glow:  "shadow-[0_4px_20px_rgba(248,113,113,0.18)]",
  },
  macro:      {
    label: "總經數據",
    dot:   "bg-indigo-400",
    badge: "bg-indigo-400/15 text-indigo-500 border-indigo-400/30",
    badgeSolid: "bg-indigo-400/25 text-indigo-600 border-indigo-400/40",
    border: "border-l-indigo-400",
    glow:  "shadow-[0_4px_20px_rgba(99,102,241,0.18)]",
  },
  earnings:   {
    label: "企業財報",
    dot:   "bg-amber-400",
    badge: "bg-amber-400/15 text-amber-500 border-amber-400/30",
    badgeSolid: "bg-amber-400/25 text-amber-600 border-amber-400/40",
    border: "border-l-amber-400",
    glow:  "shadow-[0_4px_20px_rgba(251,191,36,0.18)]",
  },
  conference: {
    label: "法說會",
    dot:   "bg-emerald-400",
    badge: "bg-emerald-400/15 text-emerald-500 border-emerald-400/30",
    badgeSolid: "bg-emerald-400/25 text-emerald-600 border-emerald-400/40",
    border: "border-l-emerald-400",
    glow:  "shadow-[0_4px_20px_rgba(52,211,153,0.18)]",
  },
}

const EASE = [0.16, 1, 0.3, 1] as const

const GLASS     = "bg-white/80 backdrop-blur-xl border border-slate-200/70 shadow-[0_4px_24px_rgba(99,102,241,0.10)]"
const GLASS_SM  = "bg-white/75 backdrop-blur-sm border border-slate-200/60 shadow-[0_2px_12px_rgba(99,102,241,0.07)]"
const GLASS_LG  = "bg-white/90 backdrop-blur-2xl border border-slate-200/80 shadow-[0_8px_32px_rgba(99,102,241,0.14)]"

// ── Animated number ────────────────────────────────────────────────────────
function AnimNum({ value, className, delay = 0 }: { value: string; className?: string; delay?: number }) {
  return (
    <motion.p
      key={value}
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: EASE }}
    >
      {value}
    </motion.p>
  )
}

// ── Legend ─────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {(Object.entries(TYPE_META) as [EventType, (typeof TYPE_META)[EventType]][]).map(([, meta]) => (
        <span key={meta.label} className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className={cn("inline-block size-2 rounded-full", meta.dot)} />
          {meta.label}
        </span>
      ))}
    </div>
  )
}

// ── Detail Card ────────────────────────────────────────────────────────────
function EventDetailCard({ events, onClose }: { events: CalEvent[]; onClose: () => void }) {
  if (events.length === 0) return null
  return (
    <motion.div
      className={cn(GLASS_LG, "rounded-2xl p-5 space-y-4 shadow-[0_8px_32px_rgba(99,102,241,0.12)]")}
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0,   scale: 1    }}
      exit={{    opacity: 0, y: -6,  scale: 0.98 }}
      transition={{ duration: 0.28, ease: EASE }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          {events[0].date.replace(/-/g, " / ")}
        </p>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-300 hover:bg-slate-100/60 hover:text-slate-500 transition-colors"
        >
          ✕
        </button>
      </div>

      {events.map((ev, i) => {
        const meta = TYPE_META[ev.type]
        return (
          <div key={i} className={cn("border-l-2 pl-4 space-y-3", meta.border)}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", meta.badgeSolid)}>
                {meta.label}
              </span>
              <p className="text-sm font-semibold text-[#1E1B4B]">{ev.title}</p>
            </div>
            {(ev.prev !== null || ev.forecast !== null) && (
              <div className="flex gap-10">
                {ev.prev !== null && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">上期實際</p>
                    <AnimNum value={ev.prev} className="text-xl font-black tabular-nums text-[#1E1B4B]" delay={0.22} />
                    {ev.unit && <p className="text-[10px] text-slate-400 mt-0.5">{ev.unit}</p>}
                  </div>
                )}
                {ev.forecast !== null && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">市場預期</p>
                    <AnimNum value={ev.forecast} className="text-xl font-black tabular-nums text-amber-500" delay={0.28} />
                    {ev.unit && <p className="text-[10px] text-slate-400 mt-0.5">{ev.unit}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </motion.div>
  )
}

// ── List Item ──────────────────────────────────────────────────────────────
function ListItem({ ev }: { ev: CalEvent }) {
  const meta = TYPE_META[ev.type]
  const [open, setOpen] = useState(false)
  const hasData = ev.prev !== null || ev.forecast !== null
  return (
    <div
      className={cn(
        GLASS_SM,
        "rounded-2xl px-5 py-3.5 cursor-pointer transition-all duration-200 border-l-2",
        meta.border,
        meta.glow,
        "hover:bg-white/75"
      )}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-12 text-right text-xs tabular-nums text-slate-400 shrink-0 font-medium">
            {ev.date.slice(5).replace("-", "/")}
          </span>
          <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shrink-0", meta.badge)}>
            {meta.label}
          </span>
          <span className="text-sm font-medium text-[#1E1B4B]">{ev.title}</span>
        </div>
        {hasData && (
          <motion.span
            className="text-xs text-slate-300 shrink-0"
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            ▼
          </motion.span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && hasData && (
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{    height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: EASE }}
          >
            <div className="mt-4 flex gap-10 pl-[5.25rem]">
              {ev.prev !== null && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">上期實際</p>
                  <AnimNum value={ev.prev} className="text-base font-black tabular-nums text-[#1E1B4B]" delay={0.22} />
                  {ev.unit && <p className="text-[10px] text-slate-400 mt-0.5">{ev.unit}</p>}
                </div>
              )}
              {ev.forecast !== null && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">市場預期</p>
                  <AnimNum value={ev.forecast} className="text-base font-black tabular-nums text-amber-500" delay={0.28} />
                  {ev.unit && <p className="text-[10px] text-slate-400 mt-0.5">{ev.unit}</p>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Month Grid ─────────────────────────────────────────────────────────────
function MonthGrid({
  year, month, events, onDayClick, selectedDate,
}: {
  year: number; month: number; events: CalEvent[]
  onDayClick: (d: string) => void; selectedDate: string | null
}) {
  const today = new Date().toISOString().slice(0, 10)

  const byDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {}
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    }
    return map
  }, [events])

  const firstDay    = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"]

  return (
    <div className={cn(GLASS, "rounded-3xl p-4")}>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-1.5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1 rounded-2xl bg-slate-100/60 p-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="min-h-[82px] rounded-xl bg-transparent" />

          const dateStr  = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const evs      = byDate[dateStr] || []
          const isToday  = dateStr === today
          const isSelected = dateStr === selectedDate
          const hasEvents  = evs.length > 0

          return (
            <div
              key={idx}
              onClick={() => hasEvents && onDayClick(dateStr)}
              className={cn(
                "min-h-[82px] rounded-xl p-2 flex flex-col gap-1 transition-all duration-200",
                hasEvents ? "cursor-pointer" : "",
                isSelected
                  ? "bg-indigo-100/80 ring-1 ring-indigo-400/60 shadow-[0_2px_8px_rgba(99,102,241,0.18)]"
                  : hasEvents
                    ? "bg-white/85 hover:bg-white shadow-sm"
                    : "bg-white/60",
              )}
            >
              <span className={cn(
                "inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold self-start transition-colors",
                isToday
                  ? "bg-indigo-500 text-white shadow-[0_2px_8px_rgba(99,102,241,0.4)]"
                  : "text-slate-600",
              )}>
                {day}
              </span>
              <div className="space-y-0.5">
                {evs.slice(0, 2).map((ev, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] leading-tight truncate border font-medium",
                      TYPE_META[ev.type].badge,
                    )}
                  >
                    {ev.title.length > 8 ? ev.title.slice(0, 8) + "…" : ev.title}
                  </div>
                ))}
                {evs.length > 2 && (
                  <div className="text-[10px] text-slate-400 pl-1 font-medium">+{evs.length - 2}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export function CalendarView({ events, loading, year, month, onYearChange, onMonthChange }: CalendarViewProps) {
  const [view, setView]           = useState<"calendar" | "list">("calendar")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [filterType, setFilterType]     = useState<EventType | "all">("all")

  function prevMonth() {
    if (month === 1) { onYearChange(year - 1); onMonthChange(12) }
    else onMonthChange(month - 1)
    setSelectedDate(null)
  }
  function nextMonth() {
    if (month === 12) { onYearChange(year + 1); onMonthChange(1) }
    else onMonthChange(month + 1)
    setSelectedDate(null)
  }

  const monthEvents = useMemo(() => {
    const prefix = `${year}-${String(month).padStart(2, "0")}`
    return events
      .filter(e => e.date.startsWith(prefix))
      .filter(e => filterType === "all" || e.type === filterType)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [events, year, month, filterType])

  const selectedEvents = useMemo(
    () => selectedDate ? monthEvents.filter(e => e.date === selectedDate) : [],
    [selectedDate, monthEvents]
  )

  const MONTH_ZH = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"]

  return (
    <div className="space-y-5">

      {/* ── Toolbar ── */}
      <div className={cn(GLASS_SM, "rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-[0_4px_20px_rgba(99,102,241,0.08)]")}>
        {/* Month nav */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/60 hover:text-slate-600 transition-all"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="w-36 text-center text-sm font-bold text-[#1E1B4B]">
            {year} · {MONTH_ZH[month - 1]}
          </span>
          <button
            onClick={nextMonth}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/60 hover:text-slate-600 transition-all"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterType("all")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                filterType === "all"
                  ? "bg-indigo-500/20 text-indigo-600 border-indigo-400/40"
                  : "border-white/50 text-slate-400 hover:text-slate-600 bg-white/30"
              )}
            >全部</button>
            {(Object.entries(TYPE_META) as [EventType, (typeof TYPE_META)[EventType]][]).map(([type, meta]) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                  filterType === type ? meta.badgeSolid : "border-white/50 text-slate-400 hover:text-slate-600 bg-white/30"
                )}
              >
                {meta.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className={cn(GLASS_SM, "flex rounded-xl overflow-hidden")}>
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all",
                view === "calendar" ? "bg-white/60 text-[#1E1B4B]" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <CalendarDays className="size-3.5" /> 月曆
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 border-l border-white/40 px-3 py-1.5 text-xs font-semibold transition-all",
                view === "list" ? "bg-white/60 text-[#1E1B4B]" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <List className="size-3.5" /> 清單
            </button>
          </div>
        </div>
      </div>

      <Legend />

      {/* Loading skeleton */}
      {loading && (
        <div className={cn(GLASS, "rounded-3xl h-[520px] animate-pulse")} />
      )}

      {/* Calendar view */}
      {!loading && view === "calendar" && (
        <div className="space-y-4">
          <MonthGrid
            year={year} month={month}
            events={monthEvents}
            onDayClick={d => setSelectedDate(d === selectedDate ? null : d)}
            selectedDate={selectedDate}
          />
          <AnimatePresence mode="wait">
            {selectedDate && (
              <EventDetailCard
                key={selectedDate}
                events={selectedEvents}
                onClose={() => setSelectedDate(null)}
              />
            )}
          </AnimatePresence>
          {monthEvents.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">本月無事件</p>
          )}
        </div>
      )}

      {/* List view */}
      {!loading && view === "list" && (
        <div className="space-y-2">
          {monthEvents.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">本月無事件</p>
          )}
          {monthEvents.map((ev, i) => <ListItem key={i} ev={ev} />)}
        </div>
      )}
    </div>
  )
}
