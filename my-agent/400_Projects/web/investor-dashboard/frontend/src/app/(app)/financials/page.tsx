"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { FinancialsSearch } from "@/components/financials/FinancialsSearch"
import { CompanyCard } from "@/components/financials/CompanyCard"
import { KpiCards } from "@/components/financials/KpiCards"
import { IncomeChart } from "@/components/financials/IncomeChart"
import { SummaryCard } from "@/components/financials/SummaryCard"

const API = "http://localhost:8002/api"

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
  const [loading, setLoading] = useState(false)
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
    <>

      {/* 空狀態：Hero 搜尋 */}
      {!data && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-20">
          <div className="text-center">
            <h2 className="text-5xl font-semibold tracking-tight">
              了解一間公司，從這裡開始。
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
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
                className="rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground disabled:opacity-40"
              >
                {p.label}
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      )}

      {/* Skeleton */}
      {loading && !data && (
        <div className="mx-auto w-full max-w-4xl animate-pulse space-y-6 px-6 py-8">
          <div className="border-b border-border/40 pb-6">
            <div className="mb-2 h-3 w-20 rounded bg-muted" />
            <div className="h-8 w-56 rounded bg-muted" />
            <div className="mt-4 flex gap-4">
              <div className="h-3 w-28 rounded bg-muted" />
              <div className="h-3 w-44 rounded bg-muted" />
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card/50 px-6 py-5">
            <div className="mb-3 h-3 w-16 rounded bg-muted" />
            <div className="mb-2 h-4 w-full rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl border border-border bg-card px-6 py-5">
                <div className="mb-3 h-3 w-20 rounded bg-muted" />
                <div className="mb-2 h-7 w-24 rounded bg-muted" />
                <div className="h-3 w-14 rounded bg-muted" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 h-4 w-40 rounded bg-muted" />
            <div className="h-52 w-full rounded bg-muted" />
          </div>
        </div>
      )}

      {/* 已選股：內容區 */}
      {data && (
        <div className="mx-auto w-full max-w-4xl space-y-6 px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            <FinancialsSearch onSearch={handleSearch} loading={loading} compact />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <CompanyCard
            data={data}
            inWatchlist={watchlistSymbols.has(data.symbol)}
            onToggleWatchlist={handleToggleWatchlist}
          />

          <div className="space-y-3">
            <KpiCards kpi={data.kpi} />
            <SummaryCard name={data.name} kpi={data.kpi} snap={data.snap} />
          </div>

          <IncomeChart symbol={data.symbol} />

          <p className="pb-2 text-center text-xs text-muted-foreground/30">
            AI 深度解讀 — 開發中
          </p>
        </div>
      )}
    </>
  )
}

export default function FinancialsPage() {
  return (
    <Suspense>
      <FinancialsContent />
    </Suspense>
  )
}
