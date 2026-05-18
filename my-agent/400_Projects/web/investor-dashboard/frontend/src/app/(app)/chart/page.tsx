"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { TrendingUp, TrendingDown, BarChart2, AlertTriangle } from "lucide-react"
import { FinancialsSearch } from "@/components/financials/FinancialsSearch"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts"
import { API_BASE } from "@/lib/api"

const API = API_BASE

declare global {
  interface Window { TradingView: any }
}

const EASE = [0.16, 1, 0.3, 1] as const

// ── TradingView symbol 轉換 ────────────────────────────────────────────────
function toTvSymbol(symbol: string): string {
  const s = symbol.toUpperCase()
  if (s.endsWith(".TWO")) return `TPEX:${s.replace(".TWO", "")}`
  if (s.endsWith(".TW"))  return `TWSE:${s.replace(".TW", "")}`
  // 純數字 4-6 碼 → 台灣上市
  if (/^\d{4,6}$/.test(s)) return `TWSE:${s}`
  return s
}

// ── TradingView Widget ─────────────────────────────────────────────────────
function TvChart({ symbol }: { symbol: string }) {
  const divRef = useRef<HTMLDivElement>(null)
  const tvSymbol = toTvSymbol(symbol)

  useEffect(() => {
    const id = "tv_chart_" + symbol.replace(/[^a-zA-Z0-9]/g, "_")
    if (divRef.current) divRef.current.id = id

    function init() {
      if (!window.TradingView || !divRef.current) return
      new window.TradingView.widget({
        container_id: id,
        autosize: true,
        symbol: tvSymbol,
        interval: "D",
        timezone: "Asia/Taipei",
        theme: "light",
        style: "1",
        locale: "zh_TW",
        toolbar_bg: "#ffffff",
        enable_publishing: false,
        allow_symbol_change: false,
        hide_side_toolbar: false,
        studies: [],
      })
    }

    if (window.TradingView) {
      init()
    } else {
      const s = document.createElement("script")
      s.src = "https://s3.tradingview.com/tv.js"
      s.async = true
      s.onload = init
      document.head.appendChild(s)
    }
  }, [tvSymbol]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={divRef} className="h-full w-full" />
}

// ── TW 台股 Recharts 價格圖 ────────────────────────────────────────────────
type PricePoint = { date: string; close: number; open: number; high: number; low: number }
const PERIOD_OPTS = [
  { label: "1個月", value: "1mo" },
  { label: "3個月", value: "3mo" },
  { label: "6個月", value: "6mo" },
  { label: "1年",   value: "1y"  },
  { label: "2年",   value: "2y"  },
]

function TwPriceChart({ symbol }: { symbol: string }) {
  const [data, setData]       = useState<PricePoint[]>([])
  const [period, setPeriod]   = useState("1y")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/financials/${symbol}/price-history?period=${period}`)
      .then(r => r.json())
      .then(d => setData(d.data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [symbol, period])

  const first = data[0]?.close ?? 0
  const last  = data[data.length - 1]?.close ?? 0
  const up    = last >= first
  const color = up ? "#10b981" : "#ef4444"

  const minV = Math.min(...data.map(d => d.low  ?? d.close)) * 0.998
  const maxV = Math.max(...data.map(d => d.high ?? d.close)) * 1.002

  return (
    <div className="h-full w-full flex flex-col">
      {/* 期間選擇 + TradingView 連結 */}
      <div className="flex items-center justify-between p-2 pb-0">
        <div className="flex gap-1">
        {PERIOD_OPTS.map(o => (
          <button
            key={o.value}
            onClick={() => setPeriod(o.value)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
              period === o.value
                ? "bg-indigo-100 text-indigo-600"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            {o.label}
          </button>
        ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-300">台股不支援嵌入，</span>
          <a
            href={`https://www.tradingview.com/chart/?symbol=${toTvSymbol(symbol)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-indigo-400 hover:text-indigo-600 transition-colors"
          >
            點此在 TradingView 查看 ↗
          </a>
        </div>
      </div>

      {/* 圖表 */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">載入中…</div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">無資料</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={color} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(99,102,241,0.07)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false} tickLine={false}
                tickFormatter={v => v.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[minV, maxV]}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}K` : String(v)}
                width={48}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as PricePoint
                  return (
                    <div style={{
                      background: "#fff", border: "1px solid rgba(99,102,241,0.18)",
                      borderRadius: 10, padding: "8px 12px",
                      boxShadow: "0 4px 16px rgba(99,102,241,0.12)",
                      fontSize: 12,
                    }}>
                      <p style={{ color: "#94a3b8", marginBottom: 4 }}>{label}</p>
                      <p style={{ color: "#1E1B4B", fontWeight: 700 }}>收 {d.close.toLocaleString()}</p>
                      <p style={{ color: "#94a3b8" }}>開 {d.open?.toLocaleString() ?? "—"} ／ 高 {d.high?.toLocaleString() ?? "—"} ／ 低 {d.low?.toLocaleString() ?? "—"}</p>
                    </div>
                  )
                }}
              />
              <Area
                dataKey="close" stroke={color} strokeWidth={2}
                fill="url(#priceGrad)"
                dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// ── Info Card ──────────────────────────────────────────────────────────────
function InfoCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: string
}) {
  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60
      shadow-[0_4px_24px_rgba(99,102,241,0.09)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className={cn("text-xl font-black tabular-nums", accent ?? "text-[#1E1B4B]")}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
const DEFAULT_SYMBOL = "AAPL"

function ChartContent() {
  const searchParams  = useSearchParams()
  const initSymbol    = searchParams.get("ticker")?.toUpperCase() || DEFAULT_SYMBOL
  const [symbol, setSymbol]   = useState(initSymbol)
  const [info, setInfo]               = useState<Record<string, any> | null>(null)
  const [infoLoading, setInfoLoading] = useState(false)
  const [inst, setInst]               = useState<Record<string, any> | null>(null)

  const fetchInfo = async (sym: string) => {
    setInfoLoading(true)
    try {
      const r = await fetch(`${API}/financials/${sym}/overview`)
      if (r.ok) setInfo(await r.json())
      else setInfo(null)
    } catch { setInfo(null) }
    finally { setInfoLoading(false) }
  }

  const fetchInst = async (sym: string) => {
    try {
      const r = await fetch(`${API}/financials/${sym}/institutions`)
      if (r.ok) setInst(await r.json())
      else setInst(null)
    } catch { setInst(null) }
  }

  useEffect(() => {
    fetchInfo(symbol)
    fetchInst(symbol)
  }, [symbol])

  const handleSearch = (sym: string) => {
    if (sym.trim()) setSymbol(sym.trim().toUpperCase())
  }

  const price       = info?.price
  const changePct   = info?.change_pct
  const up          = changePct != null && changePct >= 0
  const mcap        = info?.market_cap
  const high52      = info?.week52_high
  const low52       = info?.week52_low
  const sector      = info?.sector
  const companyName = info?.name
  const volRatio    = info?.vol_ratio as number | null | undefined
  const volume      = info?.volume as number | null | undefined
  const prevClose   = (price != null && changePct != null)
    ? price / (1 + changePct / 100) : null
  const mcapB       = mcap != null ? mcap / 1e9 : null
  const rsi         = info?.rsi as number | null | undefined
  const rsiLabel    = rsi == null ? null
    : rsi >= 70 ? { label: "超買", cls: "bg-red-50 text-red-500 border-red-200/60" }
    : rsi >= 55 ? { label: "偏強", cls: "bg-amber-50 text-amber-600 border-amber-200/60" }
    : rsi >= 45 ? { label: "中性", cls: "bg-slate-100/80 text-slate-500 border-slate-200/60" }
    : rsi >= 30 ? { label: "偏弱", cls: "bg-slate-100/80 text-slate-500 border-slate-200/60" }
    : { label: "超賣", cls: "bg-emerald-50 text-emerald-600 border-emerald-200/60" }
  const beta        = info?.beta as number | null | undefined
  const betaLabel   = beta == null ? null
    : beta >= 1.5 ? "高波動" : beta >= 1.0 ? "略高於市場"
    : beta >= 0.5 ? "穩健"   : "低波動"

  function fmtVol(v: number) {
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
    return String(v)
  }

  const volTone = volRatio == null ? null
    : volRatio >= 1.5 ? { label: "偏高", cls: "bg-emerald-50 text-emerald-600 border-emerald-200/60" }
    : volRatio <= 0.7 ? { label: "偏低", cls: "bg-amber-50 text-amber-600 border-amber-200/60" }
    : { label: "正常", cls: "bg-slate-100/80 text-slate-500 border-slate-200/60" }

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10 pb-16">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-500">走勢分析</p>
        <h1 className="mt-1 text-4xl font-bold text-[#1E1B4B]">K 線圖表</h1>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-3">
        <FinancialsSearch onSearch={handleSearch} loading={infoLoading} compact />
        <span className="shrink-0 text-sm font-semibold text-slate-400">
          現在：<span className="text-[#1E1B4B]">{symbol}</span>
        </span>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-3 gap-5 items-start">

        {/* Chart — 佔 2/3，高度定錨 */}
        <div className="col-span-2 rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/60
          shadow-[0_4px_32px_rgba(99,102,241,0.10)] overflow-hidden h-[580px]">
          {/^\d{4,6}$/.test(symbol) || symbol.toUpperCase().endsWith(".TW") || symbol.toUpperCase().endsWith(".TWO")
            ? <TwPriceChart key={symbol} symbol={symbol} />
            : <TvChart      key={symbol} symbol={symbol} />
          }
        </div>

        {/* Right panel — 明確 580px 對齊圖表 */}
        <div className="flex flex-col gap-2.5 h-[580px]">

          {/* 公司名稱 */}
          <div className="shrink-0 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60
            shadow-[0_4px_24px_rgba(99,102,241,0.09)] px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{symbol}</p>
                <p className="mt-0.5 text-sm font-bold text-[#1E1B4B] leading-snug">
                  {infoLoading ? "載入中…" : (companyName ?? "—")}
                </p>
                {sector && <p className="mt-0.5 text-[11px] text-slate-400">{sector}</p>}
              </div>
              <BarChart2 className="size-4 text-teal-400 shrink-0 mt-0.5" />
            </div>
          </div>

          {/* 股價 + 市值 + Beta */}
          <div className="shrink-0 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60
            shadow-[0_4px_24px_rgba(99,102,241,0.09)] px-4 py-3">
            <AnimatePresence mode="wait" initial={false}>
            {infoLoading ? (
              <motion.div
                key="skeleton"
                className="space-y-1.5"
                exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.18 } }}
              >
                <div className="h-8 w-24 rounded-lg bg-slate-100 animate-pulse" />
                <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.35, ease: [0.16,1,0.3,1] }}
              >
                <div className="flex items-end justify-between gap-2">
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-black tabular-nums text-[#1E1B4B]">
                      {price != null ? price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
                    </p>
                    {changePct != null && (
                      <div className={cn(
                        "mb-0.5 flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold",
                        up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                      )}>
                        {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {up ? "+" : ""}{changePct.toFixed(2)}%
                      </div>
                    )}
                  </div>
                  {prevClose != null && (
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">昨收</p>
                      <p className="text-xs font-semibold tabular-nums text-slate-500">
                        {prevClose.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>
                {(mcapB != null || beta != null) && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    {mcapB != null && (
                      <div>
                        <p className="text-[10px] text-slate-400">市值</p>
                        <p className="text-xs font-bold tabular-nums text-[#1E1B4B]">
                          ${mcapB.toLocaleString("en-US", { maximumFractionDigits: 1 })} B
                        </p>
                      </div>
                    )}
                    {beta != null && (
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Beta β</p>
                        <p className="text-xs font-bold tabular-nums text-slate-500">{beta.toFixed(2)}</p>
                        {betaLabel && <p className="text-[10px] text-slate-300">{betaLabel}</p>}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
            </AnimatePresence>
          </div>

          {/* RSI — flex-1 撐滿剩餘高度 */}
          <div className="flex-1 min-h-0 flex flex-col rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60
            shadow-[0_4px_24px_rgba(99,102,241,0.09)] px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">RSI (14)</p>
              {rsiLabel && (
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", rsiLabel.cls)}>
                  {rsiLabel.label}
                </span>
              )}
            </div>
            {infoLoading ? (
              <div className="h-8 w-20 rounded-lg bg-slate-100 animate-pulse" />
            ) : rsi != null ? (
              <>
                <p className="text-3xl font-black tabular-nums text-[#1E1B4B] leading-none mb-2">
                  {rsi.toFixed(1)}
                </p>
                <div className="relative h-2 rounded-full overflow-hidden bg-gradient-to-r
                  from-emerald-300 via-slate-200 via-amber-200 to-red-400">
                  <div
                    className="absolute top-0 h-full w-0.5 bg-[#1E1B4B]"
                    style={{ left: `${Math.min(98, Math.max(2, rsi))}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-slate-300">0</span>
                  <span className="text-[9px] text-slate-300">30</span>
                  <span className="text-[9px] text-slate-300">70</span>
                  <span className="text-[9px] text-slate-300">100</span>
                </div>
              </>
            ) : (
              <p className="text-slate-300 text-sm">—</p>
            )}
          </div>

          {/* 成交量 + 法人動向 / 期權市場（合併卡） */}
          <div className="shrink-0 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60
            shadow-[0_4px_24px_rgba(99,102,241,0.09)] p-3 flex flex-col gap-2.5">

            {/* 成交量列 */}
            {volume != null && volTone && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">成交量</p>
                  <p className="text-lg font-black tabular-nums text-[#1E1B4B] leading-none">{fmtVol(volume)}</p>
                  {volRatio != null && (
                    <p className="mt-0.5 text-[10px] text-slate-400">{volRatio.toFixed(1)}x 均量</p>
                  )}
                </div>
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", volTone.cls)}>
                  {volTone.label}
                </span>
              </div>
            )}

            {/* 分隔線 */}
            {inst && !inst.error && <div className="border-t border-slate-100" />}

            {/* 台股：法人動向 */}
            {inst && !inst.error && inst.type === "tw" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">法人動向</p>
                  {inst.diverge && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 text-amber-600
                      border border-amber-200/60 px-2 py-0.5 text-[10px] font-semibold">
                      <AlertTriangle className="size-3" />
                      方向分歧
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "外資", data: inst.foreign },
                    { label: "投信", data: inst.trust },
                  ].map(({ label, data }) => (
                    <div key={label} className="rounded-xl bg-slate-50/80 border border-slate-100 p-2.5">
                      <p className="text-[10px] text-slate-400 mb-1">{label}</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className={cn("text-sm font-bold", data.net > 0 ? "text-emerald-600" : data.net < 0 ? "text-red-500" : "text-slate-400")}>
                          {data.direction}
                        </span>
                        <span className="text-[10px] text-slate-400 tabular-nums">{data.display}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {inst.date && (
                  <p className="mt-1.5 text-[10px] text-slate-300 text-right">{inst.date.slice(0,4)}/{inst.date.slice(4,6)}/{inst.date.slice(6,8)}</p>
                )}
              </div>
            )}

            {/* 美股：期權市場 */}
            {inst?.type === "us" && !inst.error && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">期權市場</p>
                  {inst.pc_label && (
                    <span className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      inst.pc_cls === "green" ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                      : inst.pc_cls === "red" ? "bg-red-50 text-red-500 border-red-200/60"
                      : "bg-slate-100/80 text-slate-500 border-slate-200/60"
                    )}>
                      {inst.pc_label}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-2.5">
                    <p className="text-[10px] text-slate-400 mb-0.5">P/C 比率</p>
                    <p className="text-sm font-black tabular-nums text-[#1E1B4B]">{inst.pc_ratio ?? "—"}</p>
                    <p className="text-[10px] text-slate-400">
                      P {inst.put_oi != null ? (inst.put_oi/1000).toFixed(0)+"K" : "—"} / C {inst.call_oi != null ? (inst.call_oi/1000).toFixed(0)+"K" : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-2.5">
                    <p className="text-[10px] text-slate-400 mb-0.5">隱含波動率</p>
                    <p className="text-sm font-black tabular-nums text-[#1E1B4B]">
                      {inst.atm_iv != null ? `${inst.atm_iv}%` : "—"}
                    </p>
                    <p className="text-[10px] text-slate-400">ATM IV</p>
                  </div>
                </div>
                {inst.expiry && (
                  <p className="mt-1.5 text-[10px] text-slate-300 text-right">到期 {inst.expiry}</p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default function ChartPage() {
  return (
    <Suspense>
      <ChartContent />
    </Suspense>
  )
}
