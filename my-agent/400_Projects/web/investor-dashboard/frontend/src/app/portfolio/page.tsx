"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"
import { AddHoldingDialog } from "@/components/portfolio/AddHoldingDialog"
import { HoldingsTable } from "@/components/portfolio/HoldingsTable"

const API = "http://localhost:8001/api"

export type Holding = {
  id: string
  symbol: string
  yf_symbol: string
  market: "tw" | "us" | "crypto"
  name: string
  quantity: number
  cost_per_unit: number
  current_price: number | null
  market_value: number | null
  pnl: number | null
  pnl_pct: number | null
}

export type GroupedHolding = {
  key: string
  symbol: string
  market: "tw" | "us" | "crypto"
  name: string
  totalQuantity: number
  avgCost: number
  current_price: number | null
  market_value: number | null
  pnl: number | null
  pnl_pct: number | null
  lots: Holding[]
}

const MARKET_LABEL: Record<string, string> = { tw: "台股", us: "美股", crypto: "加密貨幣" }
const MARKET_CURRENCY: Record<string, string> = { tw: "TWD", us: "USD", crypto: "USD" }
const MARKET_ORDER = { tw: 0, us: 1, crypto: 2 } as const

function groupHoldings(holdings: Holding[]): GroupedHolding[] {
  const map = new Map<string, GroupedHolding>()

  for (const h of holdings) {
    const key = `${h.market}:${h.symbol}`
    if (!map.has(key)) {
      map.set(key, {
        key, symbol: h.symbol, market: h.market, name: h.name,
        totalQuantity: 0, avgCost: 0,
        current_price: h.current_price,
        market_value: null, pnl: null, pnl_pct: null,
        lots: [],
      })
    }
    map.get(key)!.lots.push(h)
  }

  const groups: GroupedHolding[] = []
  for (const g of map.values()) {
    const totalQty = g.lots.reduce((s, h) => s + h.quantity, 0)
    const weightedCost = g.lots.reduce((s, h) => s + h.quantity * h.cost_per_unit, 0)
    g.totalQuantity = totalQty
    g.avgCost = totalQty > 0 ? weightedCost / totalQty : 0
    g.current_price = g.lots[0].current_price
    if (g.current_price != null) {
      g.market_value = g.current_price * totalQty
      g.pnl = (g.current_price - g.avgCost) * totalQty
      g.pnl_pct = g.avgCost > 0 ? (g.current_price - g.avgCost) / g.avgCost * 100 : null
    }
    groups.push(g)
  }

  return groups.sort((a, b) => MARKET_ORDER[a.market] - MARKET_ORDER[b.market])
}

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchHoldings = useCallback(async () => {
    setLoading(true)
    setFetchError("")
    try {
      const res = await fetch(`${API}/portfolio/holdings`)
      if (!res.ok) throw new Error("API error")
      setHoldings(await res.json())
    } catch {
      setFetchError("無法連線到後端，請確認 FastAPI 是否已啟動（uvicorn main:app）")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchHoldings() }, [fetchHoldings])

  const handleDelete = async (id: string) => {
    const res = await fetch(`${API}/portfolio/holdings/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("delete failed")
    setHoldings(prev => prev.filter(h => h.id !== id))
  }

  const groupedHoldings = useMemo(() => groupHoldings(holdings), [holdings])

  const summary = (["tw", "us", "crypto"] as const).map(m => {
    const mg = groupedHoldings.filter(g => g.market === m)
    const total = mg.reduce((s, g) => s + (g.market_value ?? 0), 0)
    return { market: m, count: mg.length, total }
  })

  return (
    <>
      <Header title="持倉管理" subtitle="台股 · 美股 · 加密貨幣">
        <Button variant="outline" size="sm" disabled title="OCR 對帳單 — Week 3 實作">
          <Upload className="size-3.5" />
          上傳對帳單
        </Button>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-3.5" />
          新增持倉
        </Button>
      </Header>

      <div className="space-y-5 p-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {summary.map(({ market, count, total }) => (
            <div key={market} className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">{MARKET_LABEL[market]}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {count > 0 && total > 0
                  ? total.toLocaleString("en-US", { maximumFractionDigits: 0 })
                  : "—"}
              </p>
              {count > 0 && total > 0 && (
                <p className="text-xs text-muted-foreground">{MARKET_CURRENCY[market]}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">{count} 筆持倉</p>
            </div>
          ))}
        </div>

        {fetchError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {fetchError}
          </div>
        )}

        <HoldingsTable
          holdings={groupedHoldings}
          loading={loading}
          onDelete={handleDelete}
          onRefresh={fetchHoldings}
          onAdd={() => setDialogOpen(true)}
        />
      </div>

      <AddHoldingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchHoldings}
      />
    </>
  )
}
