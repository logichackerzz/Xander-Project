"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  Star,
  CalendarDays,
  Activity,
  ArrowUpRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const SPRING = { type: "spring", stiffness: 180, damping: 22 } as const

const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: SPRING },
}

const gridVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.18 } },
}

const API = "http://localhost:8002/api"

interface IndexData {
  symbol: string
  name:   string
  region: string
  price:  number | null
  change_pct: number | null
}

interface WatchlistItem {
  symbol: string
  name: string
  market: string
  price: number | null
  change_pct: number | null
}

interface UpcomingEvent {
  date: string
  type: string
  title: string
}

function fmtIndex(price: number | null, symbol: string) {
  if (price == null) return "—"
  const dec = symbol === "^TWII" ? 0 : 2
  return price.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

const CARD_BASE = "h-full rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/60 px-5 py-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(99,102,241,0.08)]"

function IndexCard({ idx, loading }: { idx?: IndexData; loading: boolean }) {
  if (loading) {
    return (
      <div className={CARD_BASE}>
        <div className="h-2 w-16 rounded bg-slate-200 animate-pulse" />
        <div className="animate-pulse space-y-2">
          <div className="h-6 w-24 rounded bg-slate-200" />
          <div className="h-3 w-12 rounded bg-slate-200" />
        </div>
      </div>
    )
  }
  if (!idx) {
    return (
      <div className={CARD_BASE}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">—</p>
        <p className="text-lg font-black text-slate-400">無資料</p>
      </div>
    )
  }
  const up = (idx.change_pct ?? 0) >= 0
  return (
    <div className={CARD_BASE}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        {idx.name}
      </p>
      <div>
        <p className="text-xl font-black text-[#1E1B4B] tabular-nums tracking-tight">
          {fmtIndex(idx.price, idx.symbol)}
        </p>
        {idx.change_pct != null ? (
          <div className={cn(
            "mt-1 flex items-center gap-1 text-xs font-semibold",
            up ? "text-emerald-500" : "text-red-500"
          )}>
            {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            <span>{up ? "+" : ""}{idx.change_pct.toFixed(2)}%</span>
          </div>
        ) : (
          <p className="mt-1 text-xs text-slate-400">無法取得</p>
        )}
      </div>
    </div>
  )
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((new Date(dateStr).getTime() - today.getTime()) / 86400000)
}

const EVENT_COLOR: Record<string, string> = {
  fomc:     "bg-red-500",
  macro:    "bg-indigo-500",
  earnings: "bg-amber-500",
}

export default function DashboardPage() {
  const [indices, setIndices]               = useState<IndexData[]>([])
  const [indicesLoading, setIndicesLoading] = useState(true)
  const [watchlist, setWatchlist]           = useState<WatchlistItem[]>([])
  const [upcoming, setUpcoming]             = useState<UpcomingEvent[]>([])

  useEffect(() => {
    fetch(`${API}/market/indices`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setIndices(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setIndicesLoading(false))

    fetch(`${API}/watchlist`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setWatchlist(Array.isArray(d) ? d : []))
      .catch(() => {})

    fetch(`${API}/calendar/upcoming?days=14`)
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d) => setUpcoming(d.events ?? []))
      .catch(() => {})
  }, [])

  const nasdaq = indices.find((i) => i.symbol === "^IXIC")
  const sp500  = indices.find((i) => i.symbol === "^GSPC")
  const twii   = indices.find((i) => i.symbol === "^TWII")

  return (
    <div className="relative py-10 pb-16">

      {/* ── 背景色球（漸變色 + 漂浮動畫，各球週期不同步） ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div
          className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl"
          style={{ animation: "blob-float-1 11s ease-in-out infinite, color-indigo 7s ease-in-out infinite" }}
        />
        <div
          className="absolute top-1/3 -right-28 h-80 w-80 rounded-full blur-3xl"
          style={{ animation: "blob-float-2 14s ease-in-out infinite, color-cyan 9s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-16 left-1/4 h-72 w-72 rounded-full blur-3xl"
          style={{ animation: "blob-float-3 12s ease-in-out infinite, color-violet 8s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-24 right-1/4 h-64 w-64 rounded-full blur-3xl"
          style={{ animation: "blob-float-4 15s ease-in-out infinite, color-orange 11s ease-in-out infinite" }}
        />
      </div>

      <div className="mx-auto max-w-5xl px-8">

        {/* Header */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, stiffness: 200, damping: 24 }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            散戶投資儀表板
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[#1E1B4B]">今天，從哪裡開始？</h1>
        </motion.div>

        {/* 自選股 + 即將事件 合併快看列 */}
        {(watchlist.length > 0 || upcoming.length > 0) && (
          <motion.div
            className="mb-5 w-full overflow-x-auto no-scrollbar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.1 }}
          >
          <div className="flex items-center gap-2 pb-0.5">

            {watchlist.map((item) => {
              const up = (item.change_pct ?? 0) >= 0
              return (
                <Link
                  key={item.symbol}
                  href="/watchlist"
                  className="flex-shrink-0 flex items-center gap-2 rounded-xl
                    bg-white/55 backdrop-blur-sm border border-slate-200/55
                    px-3.5 py-2 hover:bg-white/75 transition-all
                    shadow-[0_2px_8px_rgba(99,102,241,0.07)]"
                >
                  <span className="text-xs font-bold text-slate-700">{item.symbol}</span>
                  {item.change_pct != null ? (
                    <span className={cn("text-xs font-semibold tabular-nums",
                      up ? "text-emerald-600" : "text-red-500")}>
                      {up ? "+" : ""}{item.change_pct.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </Link>
              )
            })}

            {watchlist.length > 0 && upcoming.length > 0 && (
              <div className="h-4 w-px bg-slate-300/70 shrink-0 mx-0.5" />
            )}

            {upcoming.slice(0, 5).map((ev) => {
              const days = daysUntil(ev.date)
              return (
                <Link
                  key={ev.date + ev.title}
                  href="/calendar"
                  className="flex-shrink-0 flex items-center gap-2 rounded-xl
                    bg-white/55 backdrop-blur-sm border border-slate-200/55
                    px-3.5 py-2 hover:bg-white/75 transition-all
                    shadow-[0_2px_8px_rgba(99,102,241,0.06)]"
                >
                  <span className={cn("size-1.5 rounded-full shrink-0", EVENT_COLOR[ev.type] ?? "bg-slate-400")} />
                  <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{ev.title}</span>
                  <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                    {days <= 0 ? "今天" : `${days}d`}
                  </span>
                </Link>
              )
            })}

          </div>
          </motion.div>
        )}

        {/*
          Bento Grid — 5 欄 × 3 排（高度遞減）
          ┌──────────────────┬─────────────┐  220px
          │  財報分析  3×2   │  自選股 2×1 │
          │                  ├─────────────┤  150px
          │                  │  行事曆 2×1 │
          ├────────┬─────────┼──────┬──────┤  120px
          │情緒 2×1│  道瓊   │ S&P  │ 台股 │
          └────────┴─────────┴──────┴──────┘
        */}
        <motion.div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(5, 1fr)",
            gridTemplateRows: "220px 150px 120px",
          }}
          variants={gridVariants}
          initial="hidden"
          animate="show"
        >

          {/* 財報分析 — Indigo 玻璃卡，3cols × 2rows */}
          <motion.div className="col-span-3 row-span-2" variants={cardVariants}>
            <Link
              href="/financials"
              className="group relative h-full w-full overflow-hidden rounded-3xl
                bg-indigo-500/18 backdrop-blur-2xl border border-indigo-300/40
                p-8 flex flex-col justify-between cursor-pointer
                shadow-[0_20px_60px_rgba(99,102,241,0.22)]
                transition-all duration-300 hover:scale-[1.01] hover:bg-indigo-500/25 hover:shadow-[0_30px_80px_rgba(99,102,241,0.34)]"
            >
              <BarChart2
                className="absolute -bottom-6 -right-6 size-52 text-indigo-400/15 rotate-6"
                strokeWidth={1}
              />
              <div>
                <span className="inline-block rounded-full bg-indigo-100/60 border border-indigo-300/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-600">
                  核心功能
                </span>
                <h2 className="mt-4 text-5xl font-black text-indigo-900 leading-none tracking-tight">
                  財報分析
                </h2>
              </div>
              <div>
                <p className="text-indigo-700 text-base leading-relaxed mb-4">
                  一眼看穿企業真實面貌，<br />
                  不用當會計師也能讀懂財報。
                </p>
                <div className="flex items-center gap-1.5 text-indigo-800 text-sm font-semibold">
                  <span>開始分析</span>
                  <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* 自選股 — Sky 玻璃卡，2cols × 1row */}
          <motion.div className="col-span-2" variants={cardVariants}>
            <Link
              href="/watchlist"
              className="group h-full w-full overflow-hidden rounded-3xl
                bg-sky-500/18 backdrop-blur-2xl border border-sky-300/40
                px-7 py-5 flex flex-col justify-between cursor-pointer
                shadow-[0_12px_40px_rgba(14,165,233,0.20)]
                transition-all duration-300 hover:scale-[1.015] hover:bg-sky-500/25 hover:shadow-[0_20px_50px_rgba(14,165,233,0.32)]"
            >
              <Star className="size-8 text-sky-500" fill="currentColor" />
              <div>
                <h3 className="text-2xl font-black text-sky-900">自選股</h3>
                <p className="text-sky-600 text-sm mt-1 leading-snug">
                  緊盯愛股，不錯過任何時機。
                </p>
              </div>
            </Link>
          </motion.div>

          {/* 市場行事曆 — Amber 玻璃卡，2cols × 1row */}
          <motion.div className="col-span-2" variants={cardVariants}>
            <Link
              href="/calendar"
              className="group h-full w-full overflow-hidden rounded-2xl
                bg-amber-500/18 backdrop-blur-2xl border border-amber-300/40
                px-6 py-4 flex items-center gap-5 cursor-pointer
                shadow-[0_12px_40px_rgba(245,158,11,0.20)]
                transition-all duration-300 hover:scale-[1.015] hover:bg-amber-500/25 hover:shadow-[0_20px_50px_rgba(245,158,11,0.30)]"
            >
              <CalendarDays className="size-9 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-xl font-black text-amber-900">市場行事曆</h3>
                <p className="text-amber-700 text-sm mt-0.5 leading-snug">
                  提前佈局重要事件，不再措手不及。
                </p>
              </div>
            </Link>
          </motion.div>

          {/* 市場情緒 — Emerald 玻璃卡，2cols × 1row */}
          <motion.div className="col-span-2" variants={cardVariants}>
            <Link
              href="/sentiment"
              className="group h-full w-full overflow-hidden rounded-2xl
                bg-emerald-500/18 backdrop-blur-2xl border border-emerald-300/40
                px-6 py-4 flex items-center gap-4 cursor-pointer
                shadow-[0_12px_40px_rgba(16,185,129,0.20)]
                transition-all duration-300 hover:scale-[1.02] hover:bg-emerald-500/25 hover:shadow-[0_20px_50px_rgba(16,185,129,0.30)]"
            >
              <Activity className="size-9 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-lg font-black text-emerald-900">市場情緒</h3>
                <p className="text-emerald-700 text-sm mt-0.5 leading-snug">
                  感受市場溫度，掌握進出場時機。
                </p>
              </div>
            </Link>
          </motion.div>

          {/* NASDAQ */}
          <motion.div variants={cardVariants}>
            <IndexCard idx={nasdaq} loading={indicesLoading} />
          </motion.div>

          {/* S&P 500 */}
          <motion.div variants={cardVariants}>
            <IndexCard idx={sp500} loading={indicesLoading} />
          </motion.div>

          {/* 台股加權 */}
          <motion.div variants={cardVariants}>
            <IndexCard idx={twii} loading={indicesLoading} />
          </motion.div>

        </motion.div>

        {/* 說明區 */}
        <motion.section
          className="mt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.55 }}
        >
          <div className="rounded-3xl bg-white/70 border border-slate-200/60 shadow-sm px-6 py-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400">
              關於這個儀表板
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-[#1E1B4B]">
              把複雜財報，變成你能看懂的語言
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 max-w-2xl">
              整合財報分析、自選股追蹤、市場行事曆與情緒指標，把專業投資人才看得懂的資料，
              翻譯成你能馬上行動的資訊。美股、台股、加密貨幣即時串接，免費、免登入、開啟即用。
            </p>
          </div>
        </motion.section>

      </div>
    </div>
  )
}
