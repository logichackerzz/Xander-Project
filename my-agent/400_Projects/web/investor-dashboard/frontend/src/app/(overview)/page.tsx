"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
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

const SLOGAN = "財報是企業的語言 難讀 但不該難懂 — Folio 就是為此而生"

const SPRING = { type: "spring", stiffness: 180, damping: 22 } as const

const REVEAL = { duration: 0.7, ease: [0.16, 1, 0.3, 1] } as const

const cardVariants = {
  hidden: { opacity: 0, y: 56, scale: 0.95 },
  show:   { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
}

const gridVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
}

const API = "http://localhost:8000/api"

let introShown = false

const CACHE_TTL = 20 * 60 * 1000 // 20 分鐘

function readCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data as T
  } catch { return null }
}

function writeCache(key: string, data: unknown) {
  try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

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

function fmtTickerPrice(price: number, yf: string): string {
  if (price >= 1000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 })
  if (yf.endsWith(".TW")) return price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 1 })
  return price.toFixed(2)
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

const FEATURES = ["財報分析", "自選股追蹤", "總經情報站", "情緒指標"]
const BARS = [38, 55, 45, 72, 60, 85, 68, 90, 78]

const TICKER_US = [
  { s: "AAPL",  n: "Apple",     c: +1.24, p: "207.32", yf: "AAPL"  },
  { s: "NVDA",  n: "NVIDIA",    c: +3.21, p: "137.58", yf: "NVDA"  },
  { s: "TSLA",  n: "Tesla",     c: -0.83, p: "227.15", yf: "TSLA"  },
  { s: "MSFT",  n: "Microsoft", c: +0.52, p: "454.88", yf: "MSFT"  },
  { s: "META",  n: "Meta",      c: +2.17, p: "608.44", yf: "META"  },
  { s: "AMZN",  n: "Amazon",    c: +0.89, p: "203.71", yf: "AMZN"  },
  { s: "GOOGL", n: "Google",    c: +1.05, p: "165.24", yf: "GOOGL" },
  { s: "AMD",   n: "AMD",       c: -1.32, p: "107.63", yf: "AMD"   },
  { s: "NFLX",  n: "Netflix",   c: +0.67, p: "1,142",  yf: "NFLX"  },
  { s: "JPM",   n: "JPMorgan",  c: +0.43, p: "264.55", yf: "JPM"   },
  { s: "GC=F",  n: "黃金",      c: +0.82, p: "3,317",  yf: "GC=F"  },
  { s: "SI=F",  n: "白銀",      c: +1.15, p: "33.24",  yf: "SI=F"  },
  { s: "CL=F",  n: "原油",      c: -0.67, p: "61.48",  yf: "CL=F"  },
]

const TICKER_TW = [
  { s: "2330",  n: "台積電",    c: +1.70, p: "955",   yf: "2330.TW"  },
  { s: "2454",  n: "聯發科",    c: -0.74, p: "1,155", yf: "2454.TW"  },
  { s: "2317",  n: "鴻海",      c: +0.55, p: "155",   yf: "2317.TW"  },
  { s: "2303",  n: "聯電",      c: -0.50, p: "48.2",  yf: "2303.TW"  },
  { s: "2412",  n: "中華電",    c: +0.25, p: "129",   yf: "2412.TW"  },
  { s: "3711",  n: "日月光",    c: +0.88, p: "148",   yf: "3711.TW"  },
  { s: "2308",  n: "台達電",    c: -0.35, p: "402",   yf: "2308.TW"  },
  { s: "2464",  n: "兆赫",      c: +0.62, p: "52.4",  yf: "2464.TW"  },
  { s: "2344",  n: "華邦電",    c: -0.35, p: "28.5",  yf: "2344.TW"  },
  { s: "6770",  n: "力積電",    c: +1.12, p: "34.8",  yf: "6770.TW"  },
  { s: "2313",  n: "華通",      c: +0.44, p: "142",   yf: "2313.TW"  },
  { s: "2408",  n: "南亞科",    c: -0.58, p: "52.3",  yf: "2408.TW"  },
  { s: "2367",  n: "燿華",      c: +0.21, p: "47.2",  yf: "2367.TW"  },
  { s: "5289",  n: "東捷",      c: -0.29, p: "35.1",  yf: "5289.TW"  },
  { s: "3481",  n: "群創",      c: +0.35, p: "17.5",  yf: "3481.TW"  },
]

const TICKER_ETF = [
  { s: "0050",   n: "元大台50",   c: +0.72, p: "97.0",  yf: "0050.TW"   },
  { s: "0056",   n: "高股息",     c: +0.29, p: "44.85", yf: "0056.TW"   },
  { s: "00878",  n: "國泰永續",   c: +0.25, p: "27.82", yf: "00878.TW"  },
  { s: "00940",  n: "台灣價值",   c: +0.62, p: "15.08", yf: "00940.TW"  },
  { s: "00919",  n: "精選高息",   c: +0.16, p: "25.47", yf: "00919.TW"  },
  { s: "006208", n: "富邦台50",   c: +1.10, p: "224.3", yf: "006208.TW" },
  { s: "00981A", n: "統一增長",   c: +2.27, p: "28.91", yf: "00981A.TW" },
  { s: "0052",   n: "富邦科技",   c: +0.78, p: "57.10", yf: "0052.TW"   },
  { s: "00937B", n: "群益ESG債",  c: +0.34, p: "14.77", yf: "00937B.TWO"},
  { s: "00679B", n: "元大美債",   c: +0.37, p: "26.71", yf: "00679B.TWO"},
  { s: "00751B", n: "元大公司債", c: +0.41, p: "31.53", yf: "00751B.TWO"},
  { s: "00687B", n: "國泰美債",   c: +0.32, p: "27.78", yf: "00687B.TWO"},
  { s: "SPY",    n: "S&P 500",   c: +0.45, p: "579",   yf: "SPY"       },
  { s: "QQQ",    n: "Nasdaq",    c: +0.78, p: "491",   yf: "QQQ"       },
  { s: "VOO",    n: "Vanguard",  c: +0.43, p: "534",   yf: "VOO"       },
  { s: "IWM",    n: "Russell",   c: -0.21, p: "209",   yf: "IWM"       },
  { s: "GLD",    n: "Gold",      c: +0.15, p: "309",   yf: "GLD"       },
  { s: "TLT",    n: "Bond",      c: -0.38, p: "88.4",  yf: "TLT"       },
]

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: "AAPL",    name: "Apple Inc.",     market: "US", price: null, change_pct: null },
  { symbol: "NVDA",    name: "NVIDIA",         market: "US", price: null, change_pct: null },
  { symbol: "TSLA",    name: "Tesla",          market: "US", price: null, change_pct: null },
  { symbol: "2330.TW", name: "台積電",         market: "TW", price: null, change_pct: null },
  { symbol: "MSFT",    name: "Microsoft",      market: "US", price: null, change_pct: null },
]

export default function DashboardPage() {
  const [ready, setReady]         = useState(introShown)
  const [heroVisible, setHeroVisible] = useState(true)
  const currentSection = useRef<"hero" | "dashboard" | "egg">("hero")
  const [indices, setIndices] = useState<IndexData[]>([])
  const [indicesLoading, setIndicesLoading] = useState(true)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(DEFAULT_WATCHLIST)
  const [upcoming, setUpcoming]   = useState<UpcomingEvent[]>([])
  const [cpi, setCpi] = useState<{ yoy: number; mom: number; period: string; prev_yoy: number } | null>(null)
  const [livePrices, setLivePrices] = useState<Map<string, { price: number | null; change_pct: number | null }>>(new Map())
  const [eggInView, setEggInView] = useState(false)

  useEffect(() => {
    const el = document.getElementById("easter-egg")
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { setEggInView(e.isIntersecting) },
      { threshold: 0.3 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const [dashboardInView, setDashboardInView] = useState(false)

  useEffect(() => {
    const el = document.getElementById("dashboard")
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { setDashboardInView(e.isIntersecting) },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

useEffect(() => {
    if (!introShown) {
      const t = setTimeout(() => { setReady(true); introShown = true }, 1500)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    // hydration 完成後才讀 sessionStorage，避免 server/client 不一致
    const cachedUpcoming = readCache<UpcomingEvent[]>("folio_upcoming")
    if (cachedUpcoming) setUpcoming(cachedUpcoming)

    const cachedCpi = readCache<{ yoy: number; mom: number; period: string; prev_yoy: number }>("folio_cpi")
    if (cachedCpi) setCpi(cachedCpi)

    const cachedIndices = readCache<IndexData[]>("folio_indices")
    if (cachedIndices) { setIndices(cachedIndices); setIndicesLoading(false) }

    const cachedPrices = readCache<Record<string, { price: number | null; change_pct: number | null }>>("folio_prices")
    if (cachedPrices) setLivePrices(new Map(Object.entries(cachedPrices)))

    // 背景 fetch 刷新
    fetch(`${API}/market/indices`).then(r => r.ok ? r.json() : [])
      .then(d => { const v = Array.isArray(d) ? d : []; setIndices(v); writeCache("folio_indices", v) })
      .catch(() => {}).finally(() => setIndicesLoading(false))

    const allSymbols = [...TICKER_US, ...TICKER_TW, ...TICKER_ETF].map(t => t.yf).join(",")
    fetch(`${API}/market/prices?symbols=${encodeURIComponent(allSymbols)}`)
      .then(r => r.ok ? r.json() : {})
      .then((data: Record<string, { price: number | null; change_pct: number | null }>) => {
        setLivePrices(new Map(Object.entries(data)))
        writeCache("folio_prices", data)
      }).catch(() => {})

    fetch(`${API}/watchlist`).then(r => r.ok ? r.json() : [])
      .then(d => setWatchlist(Array.isArray(d) && d.length > 0 ? d : DEFAULT_WATCHLIST)).catch(() => {})

    fetch(`${API}/market/cpi`).then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setCpi(d); writeCache("folio_cpi", d) } }).catch(() => {})

    fetch(`${API}/calendar/upcoming?days=14`).then(r => r.ok ? r.json() : { events: [] })
      .then(d => { const ev = d.events ?? []; setUpcoming(ev); writeCache("folio_upcoming", ev) }).catch(() => {})
  }, [])

  const mainRef = useRef<HTMLElement | null>(null)
  useEffect(() => { mainRef.current = document.querySelector("main") }, [])
  const { scrollY } = useScroll({ container: mainRef as React.RefObject<HTMLElement> })
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])

  useEffect(() => {
    if (!ready) return
    const main = document.querySelector("main") as HTMLElement | null
    if (!main) return

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return
      const scrollTop = main.scrollTop

      if (e.deltaY > 0) {
        // ↓ Section 1 → Section 2
        if (scrollTop < 80) {
          e.preventDefault()
          currentSection.current = "dashboard"
          setHeroVisible(false)
          document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" })
          return
        }
        // ↓ Section 2 → Section 3
        const eggEl = document.getElementById("easter-egg")
        if (eggEl && scrollTop > 200) {
          const eggTop = eggEl.getBoundingClientRect().top
          if (eggTop > 0 && eggTop < window.innerHeight * 1.5) {
            e.preventDefault()
            currentSection.current = "egg"
            eggEl.scrollIntoView({ behavior: "smooth" })
          }
        }
      } else {
        // ↑ Section 3 → Section 2
        if (currentSection.current === "egg") {
          e.preventDefault()
          currentSection.current = "dashboard"
          document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" })
          return
        }
        // ↑ Section 2 → Section 1
        if (currentSection.current === "dashboard") {
          e.preventDefault()
          currentSection.current = "hero"
          setHeroVisible(true)
          main.scrollTo({ top: 0, behavior: "smooth" })
          return
        }
      }
    }

    main.addEventListener("wheel", onWheel, { passive: false })
    return () => main.removeEventListener("wheel", onWheel)
  }, [ready])

  const nasdaq = indices.find(i => i.symbol === "^IXIC")
  const sp500  = indices.find(i => i.symbol === "^GSPC")
  const twii   = indices.find(i => i.symbol === "^TWII")

  return (
    <>
      {/* ══ Intro 動畫（Folio 縮小飛往左上角） ══ */}
      <AnimatePresence>
        {!ready && (
          <motion.div
            key="intro"
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: "#F4F3FF" }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
          >
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.18,
                transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
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

        {/* ── 標題區：英文大標 + 中文副標 ── */}
        <div className="w-full px-10 pt-[13vh]">
          <h1
            className="font-extrabold leading-[1.0] tracking-tight text-[#1E1B4B]"
            style={{ fontFamily: "var(--font-urbanist)", fontSize: "clamp(3.5rem, 8.5vw, 11rem)" }}
          >
            <motion.span
              className="block pb-[0.15em]"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={ready && heroVisible ? { clipPath: "inset(0 0% 0 0)" } : { clipPath: "inset(0 100% 0 0)" }}
              transition={{ duration: heroVisible ? 0.9 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ willChange: "clip-path" }}
            >
              From noise to signal,
            </motion.span>
            <motion.span
              className="block pb-[0.15em]"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={ready && heroVisible ? { clipPath: "inset(0 0% 0 0)" } : { clipPath: "inset(0 100% 0 0)" }}
              transition={{ duration: heroVisible ? 0.9 : 0.22, delay: ready && heroVisible ? 0.14 : 0, ease: [0.16, 1, 0.3, 1] }}
              style={{ willChange: "clip-path" }}
            >
              from data to decision.
            </motion.span>
          </h1>

          <motion.p
            className="mt-2 text-slate-400 font-normal pl-8"
            style={{ fontFamily: "var(--font-urbanist)", fontSize: "clamp(0.82rem, 1.1vw, 1rem)" }}
            initial={{ opacity: 0 }}
            animate={ready && heroVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: heroVisible ? 0.7 : 0.15, delay: ready && heroVisible ? 0.45 : 0, ease: "easeOut" }}
          >
            {SLOGAN}
          </motion.p>
        </div>

        {/* ── 底部橫列：左介紹 + 右跑馬燈 ── */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 px-10 pb-12 flex items-end justify-between gap-10"
          initial={{ opacity: 0, y: 60 }}
          animate={ready && heroVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
          transition={{ duration: heroVisible ? 0.85 : 0.15, delay: ready && heroVisible ? 0.3 : 0, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* 左：CTA */}
          <div className="shrink-0">
            <button
              onClick={() => {
                currentSection.current = "dashboard"
                setHeroVisible(false)
                document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="group relative inline-flex items-center rounded-full overflow-hidden
                bg-[#1E1B4B] border border-white/10 px-6 py-2.5
                text-sm font-semibold cursor-pointer select-none
                active:scale-95 transition-transform duration-75"
            >
              {/* 左至右色填 */}
              <span
                className="absolute inset-0 origin-left scale-x-0 bg-indigo-600
                  transition-transform duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)]
                  group-hover:scale-x-100"
              />
              {/* 文字 + icon */}
              <span className="relative z-10 flex items-center gap-2
                text-white/75 transition-colors duration-150 group-hover:text-white">
                探索 Folio
                <span className="transition-transform duration-[220ms] ease-out
                  group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="size-3.5" />
                </span>
              </span>
            </button>
          </div>

          {/* 捲動提示 — 置中自然出現 */}
          <motion.div
            className="flex flex-col items-center gap-1.5 pb-1"
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          >
            <ChevronDown className="size-4 text-slate-300" />
          </motion.div>

          {/* 右：三列交錯股票跑馬燈 */}
          <div className="shrink-0 flex flex-col gap-1.5" style={{ width: "1120px" }}>
            {([
              { stocks: TICKER_US,  label: "美股", dir: "ltr", speed: "32s" },
              { stocks: TICKER_TW,  label: "台股", dir: "rtl", speed: "28s" },
              { stocks: TICKER_ETF, label: "ETF",  dir: "ltr", speed: "36s" },
            ] as const).map(({ stocks, label, dir, speed }) => (
              <div key={label} className="flex items-center">
                <div
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
                  }}
                >
                  <div
                    className="flex gap-2"
                    style={{ width: "max-content", animation: `ticker-${dir} ${speed} linear infinite`, willChange: "transform" }}
                  >
                    {[...stocks, ...stocks].map((stock, i) => {
                      const live = livePrices.get(stock.yf)
                      const displayPrice  = live?.price      != null ? fmtTickerPrice(live.price, stock.yf) : stock.p
                      const displayChange = live?.change_pct != null ? live.change_pct : stock.c
                      return (
                        <div
                          key={i}
                          className="w-[80px] h-[80px] shrink-0 rounded-xl flex flex-col justify-between
                            bg-white/65 backdrop-blur-sm border border-slate-200/50 px-2.5 py-2.5"
                        >
                          <p className="text-[8px] text-slate-400 leading-tight truncate">{stock.n}</p>
                          <div>
                            <p className="text-[13px] font-black text-[#1E1B4B] leading-none tabular-nums">{displayPrice}</p>
                            <div className="flex items-baseline justify-between mt-0.5">
                              <p className="text-[9px] text-slate-500 leading-none truncate">{stock.s}</p>
                              <p className={`text-[9px] font-semibold tabular-nums ${displayChange >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {displayChange >= 0 ? "+" : ""}{displayChange.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </motion.div>

      </section>

      {/* ══════════════════════════════════════
          Section 2 — Dashboard 內容
      ══════════════════════════════════════ */}
      <div id="dashboard" className="relative pb-20">
        <div className="w-full px-10 pt-12">

          {/* Section 2 Header */}
          <div className="mb-6 flex items-baseline gap-3">
            <h2
              className="text-5xl leading-none text-[#1E1B4B] overflow-hidden"
              style={{ fontFamily: "var(--font-dancing-script)" }}
            >
              <motion.span
                className="block pb-[0.1em]"
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                whileInView={{ clipPath: "inset(0 0% 0 0)" }}
                viewport={{ once: false }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              >
                Folio
              </motion.span>
            </h2>
            <motion.span
              className="h-4 w-px self-center bg-slate-300 shrink-0"
              initial={{ opacity: 0, scaleY: 0 }}
              whileInView={{ opacity: 1, scaleY: 1 }}
              viewport={{ once: false }}
              transition={{ duration: 0.35, delay: 0.5, ease: "easeOut" }}
            />
            <motion.p
              className="text-sm text-slate-400"
              style={{ fontFamily: "var(--font-dancing-script)" }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false }}
              transition={{ duration: 0.5, delay: 0.55, ease: "easeOut" }}
            >
              Markets, made readable.
            </motion.p>
          </div>

          {/* 自選股 + 即將事件 快看列（容器固定佔位，避免資料載入時版面跳動） */}
          <div className="mb-6 min-h-[44px] w-full overflow-x-auto no-scrollbar">
            {(watchlist.length > 0 || upcoming.length > 0) && (
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
                      <span className={cn(
                        "text-xs font-semibold tabular-nums w-[54px] text-right shrink-0",
                        item.change_pct != null
                          ? (up ? "text-emerald-600" : "text-red-500")
                          : "text-slate-400"
                      )}>
                        {item.change_pct != null
                          ? `${up ? "+" : ""}${item.change_pct.toFixed(2)}%`
                          : "—"}
                      </span>
                    </Link>
                  )
                })}
                <AnimatePresence>
                  {watchlist.length > 0 && upcoming.length > 0 && (
                    <motion.div
                      key="divider"
                      className="h-4 w-px bg-slate-300/70 shrink-0 mx-0.5"
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                </AnimatePresence>
                {upcoming.slice(0, 5).map((ev, i) => {
                  const days = daysUntil(ev.date)
                  return (
                    <motion.div
                      key={ev.date + ev.title}
                      className="flex-shrink-0 overflow-hidden"
                      initial={{ maxWidth: 0, opacity: 0 }}
                      animate={{ maxWidth: 300, opacity: 1 }}
                      transition={{ duration: 0.32, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link href="/calendar"
                        className="flex items-center gap-2 rounded-xl whitespace-nowrap
                          bg-white/55 backdrop-blur-sm border border-slate-200/55
                          px-3.5 py-2 hover:bg-white/75 transition-all
                          shadow-[0_2px_8px_rgba(99,102,241,0.06)]">
                        <span className={cn("size-1.5 rounded-full shrink-0", EVENT_COLOR[ev.type] ?? "bg-slate-400")} />
                        <span className="text-xs font-semibold text-slate-700">{ev.title}</span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {days <= 0 ? "今天" : `${days}d`}
                        </span>
                      </Link>
                    </motion.div>
                  )
                })}
            </div>
            )}
          </div>

          {/* Bento Grid */}
          <motion.div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(5, 1fr)", gridTemplateRows: "220px 150px 120px" }}
            variants={gridVariants}
            initial="hidden"
            animate={dashboardInView ? "show" : "hidden"}
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
                  <h3 className="text-xl font-black text-amber-900">總經情報站</h3>
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
                  <h3 className="text-lg font-black text-emerald-900">總經&amp;情緒</h3>
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
            initial={{ opacity: 0, y: 56, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
            <div className="rounded-3xl bg-white/70 border border-slate-200/60 shadow-sm px-8 py-7">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400">About Folio</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-500" style={{ fontFamily: "var(--font-lora)" }}>
                投資最大的困境，不是缺少數據，而是看不懂數據。
                財報是企業對外說話的語言——而 Folio 就是你的翻譯。
                我們把密密麻麻的財務數字轉化為直覺圖表，讓你不需要財務背景，
                也能讀懂一間公司的真實樣貌。
                整合了<span className="font-medium text-slate-700">自選股追蹤</span>、
                <span className="font-medium text-slate-700">總經情報站</span>與
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

      {/* ══ Section 3 — Easter Egg ══ */}
      <section id="easter-egg" className="h-screen flex flex-col items-center justify-center bg-[#07070F]">
        <motion.div
          className="flex flex-col items-center gap-8 px-8 max-w-2xl"
          initial="hidden"
          animate={eggInView ? "show" : "hidden"}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.22, delayChildren: 0.1 } } }}
        >
          {[
            ["財報是企業的語言 難讀 但不該難懂 —", "Folio", "就是為此而生"],
            ["From noise to signal, from data to decision. —", "Folio", ""],
            ["Markets, made readable. —", "Folio", ""],
            ["投資最大的困境不是缺少數據，而是看不懂數據 —", "Folio", "替你解讀"],
            ["讓你在每一個關鍵時刻都不措手不及 —", "Folio", ""],
          ].map(([pre, keyword, post], i) => (
            <motion.p
              key={i}
              className="text-center text-lg leading-relaxed"
              style={{ fontFamily: "var(--font-urbanist)" }}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
              }}
            >
              <span className="text-white/20">{pre} </span>
              <motion.span
                className="font-black text-indigo-400"
                style={{ textShadow: "0 0 32px rgba(99,102,241,0.75)" }}
                animate={eggInView ? { opacity: [1, 0.55, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut", delay: i * 0.2 }}
              >{keyword}</motion.span>
              {post && <span className="text-white/20"> {post}</span>}
            </motion.p>
          ))}
        </motion.div>
      </section>
    </>
  )
}
