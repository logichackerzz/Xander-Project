"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react"
import { cn } from "@/lib/utils"

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

// ── Color map ──────────────────────────────────────────────────────────────
const TYPE_META: Record<EventType, { label: string; dot: string; badge: string; border: string }> = {
  fomc:       { label: "央行會議", dot: "bg-red-500",     badge: "bg-red-500/10 text-red-400 border-red-500/20",         border: "border-l-red-500"     },
  macro:      { label: "總經數據", dot: "bg-blue-500",    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",       border: "border-l-blue-500"    },
  earnings:   { label: "企業財報", dot: "bg-amber-400",   badge: "bg-amber-400/10 text-amber-400 border-amber-400/20",    border: "border-l-amber-400"   },
  conference: { label: "法說會",   dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", border: "border-l-emerald-500" },
}

// ── Legend ─────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {(Object.entries(TYPE_META) as [EventType, (typeof TYPE_META)[EventType]][]).map(([type, meta]) => (
        <span key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {events[0].date.replace(/-/g, " / ")}
        </p>
        <button onClick={onClose} className="text-xs text-muted-foreground/50 hover:text-foreground">✕</button>
      </div>
      {events.map((ev, i) => {
        const meta = TYPE_META[ev.type]
        return (
          <div key={i} className={cn("border-l-2 pl-4 space-y-2", meta.border)}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", meta.badge)}>
                {meta.label}
              </span>
              <p className="text-sm font-semibold">{ev.title}</p>
            </div>
            {(ev.prev !== null || ev.forecast !== null) && (
              <div className="flex gap-8">
                {ev.prev !== null && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">上期實際</p>
                    <p className="text-base font-bold tabular-nums">{ev.prev}</p>
                    {ev.unit && <p className="text-[10px] text-muted-foreground/60">{ev.unit}</p>}
                  </div>
                )}
                {ev.forecast !== null && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">市場預期</p>
                    <p className="text-base font-bold tabular-nums text-amber-400">{ev.forecast}</p>
                    {ev.unit && <p className="text-[10px] text-muted-foreground/60">{ev.unit}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── List Item ──────────────────────────────────────────────────────────────
function ListItem({ ev }: { ev: CalEvent }) {
  const meta = TYPE_META[ev.type]
  const [open, setOpen] = useState(false)
  return (
    <div
      className={cn(
        "cursor-pointer rounded-xl border border-border bg-card/60 px-4 py-3 transition-colors hover:bg-card border-l-2",
        meta.border
      )}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-12 text-right text-xs tabular-nums text-muted-foreground shrink-0">
            {ev.date.slice(5).replace("-", "/")}
          </span>
          <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium shrink-0", meta.badge)}>
            {meta.label}
          </span>
          <span className="text-sm font-medium">{ev.title}</span>
        </div>
        {(ev.prev !== null || ev.forecast !== null) && (
          <span className="text-xs text-muted-foreground/40 shrink-0">{open ? "▲" : "▼"}</span>
        )}
      </div>
      {open && (ev.prev !== null || ev.forecast !== null) && (
        <div className="mt-3 flex gap-8 pl-[5.25rem]">
          {ev.prev !== null && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">上期實際</p>
              <p className="text-sm font-bold tabular-nums">{ev.prev}</p>
              {ev.unit && <p className="text-[10px] text-muted-foreground/60">{ev.unit}</p>}
            </div>
          )}
          {ev.forecast !== null && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">市場預期</p>
              <p className="text-sm font-bold tabular-nums text-amber-400">{ev.forecast}</p>
              {ev.unit && <p className="text-[10px] text-muted-foreground/60">{ev.unit}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Month Grid ─────────────────────────────────────────────────────────────
function MonthGrid({
  year, month, events, onDayClick, selectedDate,
}: {
  year: number
  month: number
  events: CalEvent[]
  onDayClick: (d: string) => void
  selectedDate: string | null
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

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"]

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-1 text-center text-[11px] font-medium text-muted-foreground/50">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="bg-background/30 min-h-[80px]" />

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const evs = byDate[dateStr] || []
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate

          return (
            <div
              key={idx}
              onClick={() => evs.length > 0 && onDayClick(dateStr)}
              className={cn(
                "bg-background min-h-[80px] p-2 flex flex-col gap-1 transition-colors",
                evs.length > 0 ? "cursor-pointer hover:bg-card" : "",
                isSelected ? "bg-card ring-1 ring-inset ring-ring" : "",
              )}
            >
              <span className={cn(
                "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium self-start",
                isToday ? "bg-blue-600 text-white" : "text-foreground/80",
              )}>
                {day}
              </span>
              <div className="space-y-0.5">
                {evs.slice(0, 2).map((ev, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded px-1 py-0.5 text-[10px] leading-tight truncate border",
                      TYPE_META[ev.type].badge,
                    )}
                  >
                    {ev.title.length > 9 ? ev.title.slice(0, 9) + "…" : ev.title}
                  </div>
                ))}
                {evs.length > 2 && (
                  <div className="text-[10px] text-muted-foreground/50 pl-1">+{evs.length - 2} 更多</div>
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
export function CalendarView({
  events, loading, year, month, onYearChange, onMonthChange,
}: CalendarViewProps) {
  const [view, setView] = useState<"calendar" | "list">("calendar")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<EventType | "all">("all")

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
    () => (selectedDate ? monthEvents.filter(e => e.date === selectedDate) : []),
    [selectedDate, monthEvents]
  )

  const MONTH_ZH = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-card hover:text-foreground">
            <ChevronLeft className="size-4" />
          </button>
          <span className="w-32 text-center text-sm font-semibold">
            {year} · {MONTH_ZH[month - 1]}
          </span>
          <button onClick={nextMonth} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-card hover:text-foreground">
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterType("all")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                filterType === "all" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              全部
            </button>
            {(Object.entries(TYPE_META) as [EventType, (typeof TYPE_META)[EventType]][]).map(([type, meta]) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  filterType === type ? cn("border", meta.badge) : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {meta.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors",
                view === "calendar" ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays className="size-3.5" /> 月曆
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 border-l border-border px-3 py-1.5 text-xs transition-colors",
                view === "list" ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="size-3.5" /> 清單
            </button>
          </div>
        </div>
      </div>

      <Legend />

      {/* Loading */}
      {loading && <div className="animate-pulse rounded-2xl border border-border bg-card/50 h-96" />}

      {/* Calendar view */}
      {!loading && view === "calendar" && (
        <div className="space-y-4">
          <MonthGrid
            year={year} month={month}
            events={monthEvents}
            onDayClick={d => setSelectedDate(d === selectedDate ? null : d)}
            selectedDate={selectedDate}
          />
          {selectedDate && <EventDetailCard events={selectedEvents} onClose={() => setSelectedDate(null)} />}
          {monthEvents.length === 0 && !loading && (
            <p className="py-8 text-center text-sm text-muted-foreground/40">本月無事件</p>
          )}
        </div>
      )}

      {/* List view */}
      {!loading && view === "list" && (
        <div className="space-y-2">
          {monthEvents.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground/40">本月無事件</p>
          )}
          {monthEvents.map((ev, i) => <ListItem key={i} ev={ev} />)}
        </div>
      )}
    </div>
  )
}
