"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  Star,
  CalendarDays,
  Activity,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

const SPRING = { type: "spring", stiffness: 180, damping: 22 } as const

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: SPRING },
}

const gridVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const API = "http://localhost:8002/api"

let introShown = false

interface IndexData {
  symbol: string; name: string; region: string
  price: number | null; change_pct: number | null
}
interface WatchlistItem {
  symbol: string; name: string; market: string
  price: number | null; change_pct: number | null
}
interface UpcomingEvent { date: string; type: string; title: string }

function fmtIndex(price: number | null, symbol: string) {
  if (price == null) return "—"
  const dec = symbol === "^TWII" ? 0 : 2
  return price.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

const CARD_BASE = "h-full rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/60 px-5 py-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(99,102,241,0.08)]"

function IndexCard({ idx, loading }: { idx?: IndexData; loading: boolean }) {
  if (loading) return (
    <div className={CARD_BASE}>
      <div className="h-2 w-16 rounded bg-slate-200 animate-pulse" />
      <div className="animate-pulse space-y-2">
        <div className="h-6 w-24 rounded bg-slate-200" />
        <div className="h-3 w-12 rounded bg-slate-200" />
      </div>
    </div>
  )
  if (!idx) return (
    <div className={CARD_BASE}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">—</p>
      <p className="text-lg font-black text-slate-400">無資料</p>
    </div>
  )
  const up = (idx.change_pct ?? 0) >= 0
  return (
    <div className={CARD_BASE}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{idx.name}</p>
      <div>
        <p className="text-xl font-black text-[#1E1B4B] tabular-nums tracking-tight">
          {fmtIndex(idx.price, idx.symbol)}
        </p>
        {idx.change_pct != null ? (
          <div className={cn("mt-1 flex items-center gap-1 text-xs font-semibold",
            up ? "text-emerald-500" : "text-red-500")}>
            {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            <span>{up ? "+" : ""}{idx.change_pct.toFixed(2)}%</span>
          </div>
        ) : <p className="mt-1 text-xs text-slate-400">無法取得</p>}
      </div>
    </div>
  )
}

function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  return Math.ceil((new Date(dateStr).getTime() - today.getTime()) / 86400000)
}

const EVENT_COLOR: Record<string, string> = {
  fomc: "bg-red-500", macro: "bg-indigo-500", earnings: "bg-amber-500",
}

const FEATURES = ["財報分析", "自選股追蹤", "市場行事曆", "情緒指標"]
const BARS = [38, 55, 45, 72, 60, 85, 68, 90, 78]

const TICKER_STOCKS = [
  // 台股
  { s: "2330",  n: "台積電",   c: +1.70 },
  { s: "2454",  n: "聯發科",   c: -0.74 },
  { s: "2317",  n: "鴻海",     c: +0.55 },
  { s: "2881",  n: "富邦金",   c: +0.30 },
  { s: "2882",  n: "國泰金",   c: -0.22 },
  // 台股 ETF
  { s: "0050",  n: "元大台50", c: +1.12 },
  { s: "0056",  n: "高股息",   c: +0.48 },
  // 美股
  { s: "AAPL",  n: "Apple",   c: +1.24 },
  { s: "NVDA",  n: "NVIDIA",  c: +3.21 },
  { s: "TSLA",  n: "Tesla",   c: -0.83 },
  { s: "MSFT",  n: "Microsoft", c: +0.52 },
  { s: "META",  n: "Meta",    c: +2.17 },
  // 美股 ETF
  { s: "SPY",   n: "S&P 500", c: +0.45 },
  { s: "QQQ",   n: "Nasdaq",  c: +0.78 },
  { s: "VOO",   n: "Vanguard", c: +0.43 },
]

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: "AAPL",    name: "Apple Inc.",     market: "US", price: null, change_pct: null },
  { symbol: "NVDA",    name: "NVIDIA",         market: "US", price: null, change_pct: null },
  { symbol: "TSLA",    name: "Tesla",          market: "US", price: null, change_pct: null },
  { symbol: "2330.TW", name: "台積電",         market: "TW", price: null, change_pct: null },
  { symbol: "MSFT",    name: "Microsoft",      market: "US", price: null, change_pct: null },
]

export default function DashboardPage() {
  const [ready, setReady]     = useState(introShown)
  const [indices, setIndices] = useState<IndexData[]>([])
  const [indicesLoading, setIndicesLoading] = useState(true)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [upcoming, setUpcoming]   = useState<UpcomingEvent[]>([])
  const [cpi, setCpi] = useState<{ yoy: number; mom: number; period: string; prev_yoy: number } | null>(null)

  useEffect(() => {
    if (!introShown) {
      const t = setTimeout(() => { setReady(true); introShown = true }, 1500)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    fetch(`${API}/market/indices`).then(r => r.ok ? r.json() : [])
      .then(d => setIndices(Array.isArray(d) ? d : [])).catch(() => {})
      .finally(() => setIndicesLoading(false))
    fetch(`${API}/watchlist`).then(r => r.ok ? r.json() : [])
      .then(d => setWatchlist(Array.isArray(d) && d.length > 0 ? d : DEFAULT_WATCHLIST)).catch(() => {})
    fetch(`${API}/market/cpi`).then(r => r.ok ? r.json() : null)
      .then(d => d && setCpi(d)).catch(() => {})
    fetch(`${API}/calendar/upcoming?days=14`).then(r => r.ok ? r.json() : { events: [] })
      .then(d => setUpcoming(d.events ?? [])).catch(() => {})
  }, [])

  const nasdaq = indices.find(i => i.symbol === "^IXIC")
  const sp500  = indices.find(i => i.symbol === "^GSPC")
  const twii   = indices.find(i => i.symbol === "^TWII")

  return (
    <>
      {/* ── 背景色球 ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl"
          style={{ animation: "blob-float-1 11s ease-in-out infinite, color-indigo 7s ease-in-out infinite" }} />
        <div className="absolute top-1/3 -right-28 h-80 w-80 rounded-full blur-3xl"
          style={{ animation: "blob-float-2 14s ease-in-out infinite, color-cyan 9s ease-in-out infinite" }} />
        <div className="absolute bottom-16 left-1/4 h-72 w-72 rounded-full blur-3xl"
          style={{ animation: "blob-float-3 12s ease-in-out infinite, color-violet 8s ease-in-out infinite" }} />
        <div className="absolute bottom-24 right-1/4 h-64 w-64 rounded-full blur-3xl"
          style={{ animation: "blob-float-4 15s ease-in-out infinite, color-orange 11s ease-in-out infinite" }} />
      </div>

      {/* ══ Intro 動畫（Folio 縮小飛往左上角） ══ */}
      <AnimatePresence>
        {!ready && (
          <motion.div
            key="intro"
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: "linear-gradient(to bottom, #F5F3FF, #EEF2FF)" }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
          >
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.12, x: "-40vw", y: "-44vh",
                transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <h1 className="text-9xl text-[#1E1B4B]"
                style={{ fontFamily: "var(--font-dancing-script)" }}>
                Folio
              </h1>
              <p className="text-base text-slate-400"
                style={{ fontFamily: "var(--font-dancing-script)" }}>
                Markets, made readable.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          Section 1 — Hero（迎賓 + 風格展示）
      ══════════════════════════════════════ */}
      <section className="relative flex h-screen flex-col overflow-hidden">

        {/* ── Slogan：左上，D&L 同款位置 ── */}
        <div className="w-full px-10 pt-[13vh]">
          <motion.h1
            className="font-extrabold leading-[1.0] tracking-tight text-[#1E1B4B] whitespace-nowrap"
            style={{
              fontFamily: "var(--font-urbanist)",
              fontSize: "clamp(3.5rem, 8.5vw, 11rem)",
            }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            From noise to signal,<br />
            from data to decision.
          </motion.h1>
        </div>

        {/* ── 底部橫列：左介紹 + 右跑馬燈 ── */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 px-10 pb-12 flex items-end justify-between gap-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.65 }}
        >
          {/* 左：介紹 + CTA */}
          <div className="shrink-0">
            <p className="text-base leading-relaxed text-slate-600 max-w-[260px]"
              style={{ fontFamily: "var(--font-lora)" }}>
              財報是企業對外說話的語言<br />
              Folio 把它翻譯成你能行動的資訊
            </p>
            <Link
              href="/financials"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1E1B4B] px-5 py-2
                text-sm font-semibold text-white/90 transition-all hover:bg-indigo-700"
            >
              開始使用 <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          {/* 捲動提示 — 置中自然出現 */}
          <motion.div
            className="flex flex-col items-center gap-1.5 pb-1"
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          >
            <ChevronDown className="size-4 text-slate-300" />
          </motion.div>

          {/* 右：橫向股票跑馬燈 */}
          <div
            className="shrink-0"
            style={{
              width: "400px",
              overflow: "hidden",
              maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
            }}
          >
            <div
              className="flex gap-3"
              style={{ width: "max-content", animation: "ticker-ltr 30s linear infinite" }}
            >
              {[...TICKER_STOCKS, ...TICKER_STOCKS].map((stock, i) => (
                <div
                  key={i}
                  className="w-[76px] h-[76px] shrink-0 rounded-2xl flex flex-col justify-between
                    bg-white/65 backdrop-blur-sm border border-slate-200/50 px-3 py-3"
                >
                  <p className="text-[9px] text-slate-400 leading-tight truncate">{stock.n}</p>
                  <div>
                    <p className="text-sm font-black text-[#1E1B4B] leading-none">{stock.s}</p>
                    <p className={`text-[11px] font-semibold mt-0.5 tabular-nums ${stock.c >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {stock.c >= 0 ? "+" : ""}{stock.c}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </motion.div>

      </section>

      {/* ══════════════════════════════════════
          Section 2 — Dashboard 內容
      ══════════════════════════════════════ */}
      <div className="relative pb-20">
        <div className="w-full px-10 pt-28">

          {/* Section 2 Header */}
          <motion.div
            className="mb-6 flex items-baseline gap-3"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...SPRING }}
          >
            <h2
              className="text-5xl leading-none text-[#1E1B4B]"
              style={{ fontFamily: "var(--font-dancing-script)" }}
            >
              Folio
            </h2>
            <span className="h-4 w-px self-center bg-slate-300 shrink-0" />
            <p className="text-sm text-slate-400" style={{ fontFamily: "var(--font-dancing-script)" }}>
              Markets, made readable.
            </p>
          </motion.div>

          {/* 自選股 + 即將事件 快看列 */}
          {(watchlist.length > 0 || upcoming.length > 0) && (
            <motion.div
              className="mb-6 w-full overflow-x-auto no-scrollbar"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ ...SPRING }}
            >
              <div className="flex items-center gap-2 pb-0.5">
                {watchlist.map(item => {
                  const up = (item.change_pct ?? 0) >= 0
                  return (
                    <Link key={item.symbol} href="/watchlist"
                      className="flex-shrink-0 flex items-center gap-2 rounded-xl
                        bg-white/55 backdrop-blur-sm border border-slate-200/55
                        px-3.5 py-2 hover:bg-white/75 transition-all
                        shadow-[0_2px_8px_rgba(99,102,241,0.07)]">
                      <span className="text-xs font-bold text-slate-700">{item.symbol}</span>
                      {item.change_pct != null
                        ? <span className={cn("text-xs font-semibold tabular-nums",
                            up ? "text-emerald-600" : "text-red-500")}>
                            {up ? "+" : ""}{item.change_pct.toFixed(2)}%
                          </span>
                        : <span className="text-xs text-slate-400">—</span>}
                    </Link>
                  )
                })}
                {watchlist.length > 0 && upcoming.length > 0 &&
                  <div className="h-4 w-px bg-slate-300/70 shrink-0 mx-0.5" />}
                {upcoming.slice(0, 5).map(ev => {
                  const days = daysUntil(ev.date)
                  return (
                    <Link key={ev.date + ev.title} href="/calendar"
                      className="flex-shrink-0 flex items-center gap-2 rounded-xl
                        bg-white/55 backdrop-blur-sm border border-slate-200/55
                        px-3.5 py-2 hover:bg-white/75 transition-all
                        shadow-[0_2px_8px_rgba(99,102,241,0.06)]">
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

          {/* Bento Grid */}
          <motion.div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(5, 1fr)", gridTemplateRows: "220px 150px 120px" }}
            variants={gridVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.05 }}
          >
            {/* 財報分析 縮至 2×2 */}
            <motion.div className="col-span-2 row-span-2" variants={cardVariants}>
              <Link href="/financials"
                className="group relative h-full w-full overflow-hidden rounded-3xl
                  bg-indigo-500/18 backdrop-blur-2xl border border-indigo-300/40
                  p-7 flex flex-col justify-between cursor-pointer
                  shadow-[0_20px_60px_rgba(99,102,241,0.22)]
                  transition-all duration-300 hover:scale-[1.01] hover:bg-indigo-500/25 hover:shadow-[0_30px_80px_rgba(99,102,241,0.34)]">
                <BarChart2 className="absolute -bottom-6 -right-6 size-44 text-indigo-400/15 rotate-6" strokeWidth={1} />
                <div>
                  <span className="inline-block rounded-full bg-indigo-100/60 border border-indigo-300/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-600">核心功能</span>
                  <h2 className="mt-3 text-4xl font-black text-indigo-900 leading-none tracking-tight">財報分析</h2>
                </div>
                <div>
                  <p className="text-indigo-700 text-sm leading-relaxed mb-3">一眼看穿企業真實面貌，<br />不用當會計師也能讀懂財報。</p>
                  <div className="flex items-center gap-1.5 text-indigo-800 text-sm font-semibold">
                    <span>開始分析</span>
                    <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Row 1 右側：自選股 3 欄寬（較寬，220px 高） */}
            <motion.div className="col-span-3" variants={cardVariants}>
              <Link href="/watchlist"
                className="group h-full w-full overflow-hidden rounded-3xl
                  bg-sky-500/18 backdrop-blur-2xl border border-sky-300/40
                  px-8 py-6 flex items-center justify-between cursor-pointer
                  shadow-[0_12px_40px_rgba(14,165,233,0.20)]
                  transition-all duration-300 hover:scale-[1.01] hover:bg-sky-500/25">
                <div>
                  <Star className="size-7 text-sky-500 mb-3" fill="currentColor" />
                  <h3 className="text-3xl font-black text-sky-900">自選股</h3>
                  <p className="text-sky-600 text-sm mt-1">緊盯愛股，不錯過任何時機。</p>
                </div>
                <div className="space-y-2 text-right">
                  {[
                    { s: "AAPL", v: "+1.2%", up: true  },
                    { s: "NVDA", v: "+3.2%", up: true  },
                    { s: "TSLA", v: "-0.8%", up: false },
                    { s: "MSFT", v: "+0.5%", up: true  },
                  ].map(({ s, v, up }) => (
                    <div key={s} className="flex items-center gap-4 justify-end">
                      <span className="text-sm font-bold text-slate-600">{s}</span>
                      <span className={`text-sm font-semibold tabular-nums w-14 text-right ${up ? "text-emerald-600" : "text-red-500"}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </Link>
            </motion.div>

            {/* Row 2 中：CPI 總經數據（1 欄，150px 高） */}
            <motion.div className="col-span-1" variants={cardVariants}>
              <div className="h-full rounded-2xl bg-white/65 backdrop-blur-sm border border-slate-200/60
                px-4 py-4 flex flex-col justify-between
                shadow-[0_4px_20px_rgba(99,102,241,0.08)]">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-rose-400">CPI</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">美國消費者物價</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#1E1B4B]">
                    {cpi ? `${cpi.yoy}%` : "—"}
                  </p>
                  {cpi && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-xs font-semibold ${cpi.mom <= 0 ? "text-emerald-500" : "text-red-400"}`}>
                        {cpi.mom > 0 ? "↑" : "↓"} {Math.abs(cpi.mom)}%
                      </span>
                      <span className="text-[10px] text-slate-400">vs 上月</span>
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-slate-400">{cpi?.period ?? "—"}</p>
              </div>
            </motion.div>

            {/* Row 2 右：行事曆 2 欄（150px 高，偏右不對齊自選股） */}
            <motion.div className="col-span-2" variants={cardVariants}>
              <Link href="/calendar"
                className="group h-full w-full overflow-hidden rounded-2xl
                  bg-amber-500/18 backdrop-blur-2xl border border-amber-300/40
                  px-6 py-4 flex items-center gap-4 cursor-pointer
                  shadow-[0_12px_40px_rgba(245,158,11,0.20)]
                  transition-all duration-300 hover:scale-[1.015] hover:bg-amber-500/25">
                <CalendarDays className="size-8 text-amber-600 shrink-0" />
                <div>
                  <h3 className="text-xl font-black text-amber-900">市場行事曆</h3>
                  <p className="text-amber-700 text-sm mt-0.5 leading-snug">提前佈局重要事件，不再措手不及。</p>
                </div>
              </Link>
            </motion.div>

            <motion.div className="col-span-2" variants={cardVariants}>
              <Link href="/sentiment"
                className="group h-full w-full overflow-hidden rounded-2xl
                  bg-emerald-500/18 backdrop-blur-2xl border border-emerald-300/40
                  px-6 py-4 flex items-center gap-4 cursor-pointer
                  shadow-[0_12px_40px_rgba(16,185,129,0.20)]
                  transition-all duration-300 hover:scale-[1.02] hover:bg-emerald-500/25 hover:shadow-[0_20px_50px_rgba(16,185,129,0.30)]">
                <Activity className="size-9 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-lg font-black text-emerald-900">市場情緒</h3>
                  <p className="text-emerald-700 text-sm mt-0.5 leading-snug">感受市場溫度，掌握進出場時機。</p>
                </div>
              </Link>
            </motion.div>

            <motion.div variants={cardVariants}><IndexCard idx={nasdaq} loading={indicesLoading} /></motion.div>
            <motion.div variants={cardVariants}><IndexCard idx={sp500}  loading={indicesLoading} /></motion.div>
            <motion.div variants={cardVariants}><IndexCard idx={twii}   loading={indicesLoading} /></motion.div>
          </motion.div>

          {/* About */}
          <motion.section className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ ...SPRING }}>
            <div className="rounded-3xl bg-white/70 border border-slate-200/60 shadow-sm px-8 py-7">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400">About Folio</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-500" style={{ fontFamily: "var(--font-lora)" }}>
                投資最大的困境，不是缺少數據，而是看不懂數據。
                財報是企業對外說話的語言——而 Folio 就是你的翻譯。
                我們把密密麻麻的財務數字轉化為直覺圖表，讓你不需要財務背景，
                也能讀懂一間公司的真實樣貌。
                整合了<span className="font-medium text-slate-700">自選股追蹤</span>、
                <span className="font-medium text-slate-700">市場行事曆</span>與
                <span className="font-medium text-slate-700">情緒指標</span>，
                Folio 讓你在每一個關鍵時刻都不措手不及。
              </p>
            </div>
          </motion.section>

          {/* Footer */}
          <footer className="mt-8 border-t border-slate-200/60 pt-4 pb-6">
            <div className="flex flex-col items-center gap-1.5 text-[11px] text-slate-400">
              <span style={{ fontFamily: "var(--font-dancing-script)", fontSize: "16px" }} className="text-slate-500">Folio</span>
              <span>所有數據僅供資訊參考，不構成投資建議</span>
              <span>公開市場數據 · © 2026</span>
            </div>
          </footer>

        </div>
      </div>
    </>
  )
}
