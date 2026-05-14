"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Search, TrendingUp, TrendingDown, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"

const API = "http://localhost:8000/api"

declare global {
  interface Window { TradingView: any }
}

const EASE = [0.16, 1, 0.3, 1] as const

// ── TradingView Widget ─────────────────────────────────────────────────────
function TvChart({ symbol }: { symbol: string }) {
  const divRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = "tv_chart_" + symbol.replace(/[^a-zA-Z0-9]/g, "_")
    if (divRef.current) divRef.current.id = id

    function init() {
      if (!window.TradingView || !divRef.current) return
      new window.TradingView.widget({
        container_id: id,
        autosize: true,
        symbol: symbol,
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
  }, [symbol])

  return <div ref={divRef} className="h-full w-full" />
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
  const [input, setInput]     = useState("")
  const [symbol, setSymbol]   = useState(initSymbol)
  const [info, setInfo]       = useState<Record<string, any> | null>(null)
  const [infoLoading, setInfoLoading] = useState(false)

  const fetchInfo = async (sym: string) => {
    setInfoLoading(true)
    try {
      const r = await fetch(`${API}/financials/${sym}/overview`)
      if (r.ok) setInfo(await r.json())
      else setInfo(null)
    } catch { setInfo(null) }
    finally { setInfoLoading(false) }
  }

  useEffect(() => { fetchInfo(symbol) }, [symbol])

  const handleSearch = () => {
    const s = input.trim().toUpperCase()
    if (s) { setSymbol(s); setInput("") }
  }

  const price       = info?.price
  const changePct   = info?.change_pct
  const up          = changePct != null && changePct >= 0
  const mcap        = info?.market_cap
  const high52      = info?.week52_high
  const low52       = info?.week52_low
  const sector      = info?.sector
  const companyName = info?.name
  const pe          = info?.snap?.pe_trailing as number | null | undefined
  const volRatio    = info?.vol_ratio as number | null | undefined
  const volume      = info?.volume as number | null | undefined
  const prevClose   = (price != null && changePct != null)
    ? price / (1 + changePct / 100) : null
  const mcapB       = mcap != null ? mcap / 1e9 : null
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

  const peTone = pe == null ? null
    : pe < 15  ? { label: "便宜", cls: "bg-emerald-50 text-emerald-600 border-emerald-200/60" }
    : pe < 25  ? { label: "合理", cls: "bg-slate-100/80 text-slate-500 border-slate-200/60" }
    : pe < 40  ? { label: "偏貴", cls: "bg-amber-50 text-amber-600 border-amber-200/60" }
    : { label: "昂貴", cls: "bg-red-50 text-red-500 border-red-200/60" }

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10 pb-16">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-500">走勢分析</p>
        <h1 className="mt-1 text-4xl font-bold text-[#1E1B4B]">K 線圖表</h1>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="輸入代碼（如 AAPL、TWSE:2330）"
            className="w-full rounded-xl border border-slate-200/60 bg-white/80 backdrop-blur-xl
              pl-9 pr-4 py-2.5 text-sm text-[#1E1B4B] placeholder:text-slate-300
              focus:outline-none focus:ring-2 focus:ring-teal-400/40"
          />
        </div>
        <button
          onClick={handleSearch}
          className="rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white
            hover:bg-teal-600 transition-colors"
        >
          查詢
        </button>
        <span className="text-sm font-semibold text-slate-400">
          現在：<span className="text-[#1E1B4B]">{symbol}</span>
        </span>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-3 gap-5">

        {/* Chart — 佔 2/3 */}
        <div className="col-span-2 rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/60
          shadow-[0_4px_32px_rgba(99,102,241,0.10)] overflow-hidden"
          style={{ height: 520 }}>
          <TvChart key={symbol} symbol={symbol} />
        </div>

        {/* Right panel — 佔 1/3，固定與圖表同高 */}
        <div className="flex flex-col gap-3" style={{ height: 520 }}>

          {/* Company name */}
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60
            shadow-[0_4px_24px_rgba(99,102,241,0.09)] p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{symbol}</p>
                <p className="mt-0.5 text-sm font-bold text-[#1E1B4B] leading-snug">
                  {infoLoading ? "載入中…" : (companyName ?? "—")}
                </p>
                {sector && <p className="mt-0.5 text-[11px] text-slate-400">{sector}</p>}
              </div>
              <BarChart2 className="size-5 text-teal-400 shrink-0 mt-0.5" />
            </div>
          </div>

          {/* Price */}
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60
            shadow-[0_4px_24px_rgba(99,102,241,0.09)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">最新股價</p>
            {infoLoading ? (
              <div className="h-8 w-24 rounded-lg bg-slate-100 animate-pulse" />
            ) : (
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
                    <p className="text-sm font-semibold tabular-nums text-slate-500">
                      {prevClose.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 52-week range — flex-1 撐滿剩餘高度 */}
          {(high52 != null && low52 != null) && (
            <div className="flex-1 flex flex-col justify-center rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60
              shadow-[0_4px_24px_rgba(99,102,241,0.09)] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">52 週區間</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-red-400">{low52.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                  <span className="text-emerald-500">{high52.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="relative h-1.5 rounded-full bg-slate-100">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-300 to-emerald-400"
                    style={{
                      width: price != null
                        ? `${Math.min(100, Math.max(0, ((price - low52) / (high52 - low52)) * 100))}%`
                        : "0%"
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-center">52 週低 ← 現價 → 52 週高</p>
              </div>
            </div>
          )}

          {/* Market cap + Beta */}
          {mcapB != null && (
            <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60
              shadow-[0_4px_24px_rgba(99,102,241,0.09)] p-4">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">市值</p>
                  <p className="text-2xl font-black tabular-nums text-[#1E1B4B]">
                    ${mcapB.toLocaleString("en-US", { maximumFractionDigits: 1 })} B
                  </p>
                </div>
                {beta != null && (
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Beta β</p>
                    <p className="text-sm font-semibold tabular-nums text-slate-500">{beta.toFixed(2)}</p>
                    {betaLabel && <p className="text-[10px] text-slate-400 mt-0.5">{betaLabel}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* P/E + Volume 合併雙欄 */}
          {(pe != null || volume != null) && (
            <div className="grid grid-cols-2 gap-3">
              {pe != null && peTone && (
                <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60
                  shadow-[0_4px_24px_rgba(99,102,241,0.09)] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">本益比</p>
                  <p className="text-xl font-black tabular-nums text-[#1E1B4B]">{pe.toFixed(1)}<span className="text-xs text-slate-400 ml-0.5">x</span></p>
                  <span className={cn("mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold", peTone.cls)}>
                    {peTone.label}
                  </span>
                </div>
              )}
              {volume != null && volTone && (
                <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60
                  shadow-[0_4px_24px_rgba(99,102,241,0.09)] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">成交量</p>
                  <p className="text-xl font-black tabular-nums text-[#1E1B4B]">{fmtVol(volume)}</p>
                  {volRatio != null && (
                    <p className="mt-0.5 text-[10px] text-slate-400">{volRatio.toFixed(1)}x 均量</p>
                  )}
                  <span className={cn("mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold", volTone.cls)}>
                    {volTone.label}
                  </span>
                </div>
              )}
            </div>
          )}

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
