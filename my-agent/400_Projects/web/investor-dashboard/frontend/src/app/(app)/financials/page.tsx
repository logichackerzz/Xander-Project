"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

const SLIDE = { duration: 0.34, ease: [0.25, 0.46, 0.45, 0.94] } as const
import { FinancialsSearch } from "@/components/financials/FinancialsSearch"
import { CompanyCard } from "@/components/financials/CompanyCard"
import { KpiCards } from "@/components/financials/KpiCards"
import { IncomeChart } from "@/components/financials/IncomeChart"
import { SummaryCard } from "@/components/financials/SummaryCard"


const API = "http://localhost:8000/api"

const QUICK_PICKS = [
  { symbol: "AAPL", label: "Apple" },
  { symbol: "NVDA", label: "NVIDIA" },
  { symbol: "MSFT", label: "Microsoft" },
  { symbol: "TSLA", label: "Tesla" },
  { symbol: "AMZN", label: "Amazon" },
]

interface OverviewData {
  symbol: string
  name: string
  price: number
  change_pct: number
  currency: string
  market_cap: number | null
  week52_high: number | null
  week52_low: number | null
  sector: string | null
  kpi: {
    revenue_b: number | null
    revenue_yoy_pct: number | null
    net_margin_pct: number | null
    roe_pct: number | null
  }
  snap: {
    pe_trailing: number | null
    debt_to_equity: number | null
    fcf_b: number | null
    gross_margin_pct: number | null
  }
}

function FinancialsContent() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(() => !!searchParams.get("ticker"))
  const [error, setError] = useState<string | null>(null)
  const [watchlistSymbols, setWatchlistSymbols] = useState<Set<string>>(new Set())

  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch(`${API}/watchlist`)
      if (!res.ok) return
      const items: { symbol: string }[] = await res.json()
      setWatchlistSymbols(new Set(items.map(i => i.symbol)))
    } catch {
      // watchlist fetch failing silently is fine
    }
  }, [])

  useEffect(() => { fetchWatchlist() }, [fetchWatchlist])

  const handleSearch = useCallback(async (symbol: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/financials/${symbol}/overview`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "找不到此股票")
      }
      const json: OverviewData = await res.json()
      setData(json)
    } catch (e: any) {
      setError(e.message || "載入失敗，請稍後再試")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // 從自選股頁跳過來時，自動搜尋
  useEffect(() => {
    const ticker = searchParams.get("ticker")
    if (ticker) handleSearch(ticker)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleWatchlist = async () => {
    if (!data) return
    const sym = data.symbol
    if (watchlistSymbols.has(sym)) {
      await fetch(`${API}/watchlist/${sym}`, { method: "DELETE" })
      setWatchlistSymbols(prev => { const s = new Set(prev); s.delete(sym); return s })
    } else {
      const market = data.currency === "TWD" ? "tw" : "us"
      await fetch(`${API}/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym, name: data.name, market }),
      })
      setWatchlistSymbols(prev => new Set(prev).add(sym))
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>

      {/* Hero：無資料且未 loading */}
      {!data && !loading && (
        <motion.div
          key="hero"
          className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -16 }}
          transition={SLIDE}
        >
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">財報分析</p>
            <h2 className="text-5xl font-semibold tracking-tight text-[#1E1B4B]">
              了解一間公司，從這裡開始。
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              輸入代碼，直接看數字。不用讀新聞。
            </p>
          </div>

          <FinancialsSearch onSearch={handleSearch} loading={loading} />

          <div className="flex flex-wrap items-center justify-center gap-2">
            {QUICK_PICKS.map(p => (
              <button
                key={p.symbol}
                onClick={() => handleSearch(p.symbol)}
                disabled={loading}
                className="rounded-full border border-indigo-200/60 bg-white/60 px-4 py-1.5 text-sm text-slate-500 transition-colors hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40"
              >
                {p.label}
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </motion.div>
      )}

      {/* Skeleton：loading 中且尚無資料 */}
      {!data && loading && (
        <motion.div
          key="skeleton"
          className="mx-auto w-full max-w-4xl animate-pulse space-y-6 px-6 py-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={SLIDE}
        >
          <div className="border-b border-slate-200/60 pb-6">
            <div className="mb-2 h-3 w-20 rounded bg-indigo-100" />
            <div className="h-8 w-56 rounded bg-slate-200" />
            <div className="mt-4 flex gap-4">
              <div className="h-3 w-28 rounded bg-slate-200" />
              <div className="h-3 w-44 rounded bg-slate-200" />
            </div>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 px-6 py-5">
            <div className="mb-3 h-3 w-16 rounded bg-indigo-100" />
            <div className="mb-2 h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-3/4 rounded bg-slate-200" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl border border-white/60 bg-white/70 px-6 py-5">
                <div className="mb-3 h-3 w-20 rounded bg-indigo-100" />
                <div className="mb-2 h-7 w-24 rounded bg-slate-200" />
                <div className="h-3 w-14 rounded bg-slate-200" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 p-6">
            <div className="mb-4 h-4 w-40 rounded bg-indigo-100" />
            <div className="h-52 w-full rounded bg-slate-200" />
          </div>
        </motion.div>
      )}

      {/* 資料區 */}
      {data && (
        <motion.div
          key="data"
          className="mx-auto w-full max-w-4xl space-y-6 px-6 py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={SLIDE}
        >
          <div className="flex items-center justify-between gap-4">
            <FinancialsSearch onSearch={handleSearch} loading={loading} compact />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <motion.div
            animate={{ opacity: loading ? 0.45 : 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <CompanyCard
              data={data}
              inWatchlist={watchlistSymbols.has(data.symbol)}
              onToggleWatchlist={handleToggleWatchlist}
            />

            <div className="space-y-3">
              <KpiCards kpi={data.kpi} />
              <SummaryCard name={data.name} symbol={data.symbol} kpi={data.kpi} snap={data.snap} />
            </div>

            <IncomeChart symbol={data.symbol} />
          </motion.div>

        </motion.div>
      )}

    </AnimatePresence>
  )
}

export default function FinancialsPage() {
  return (
    <Suspense>
      <FinancialsContent />
    </Suspense>
  )
}
