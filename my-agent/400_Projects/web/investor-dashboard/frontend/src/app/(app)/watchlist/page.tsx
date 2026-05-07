"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Dialog } from "@base-ui/react/dialog"
import { StockSearchInput } from "@/components/portfolio/StockSearchInput"
import { useToast } from "@/lib/toast"
import { TrendingUp, TrendingDown, Trash2, Star, X } from "lucide-react"
import { cn } from "@/lib/utils"

const API = "http://localhost:8002/api"

const MARKET_LABEL: Record<string, string> = { tw: "台股", us: "美股", crypto: "加密" }

type WatchlistItem = {
  symbol: string
  name: string
  market: string
  price: number | null
  change_pct: number | null
}

type SearchMarket = "us" | "tw"

function fmtPrice(v: number | null) {
  if (v == null) return "—"
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function WatchlistPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchMarket, setSearchMarket] = useState<SearchMarket>("us")
  const [searchQuery, setSearchQuery] = useState("")
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WatchlistItem | null>(null)

  const fetchWatchlist = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API}/watchlist`)
      if (!res.ok) throw new Error("API error")
      setItems(await res.json())
    } catch {
      setError("無法連線到後端，請確認 FastAPI 是否已啟動")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWatchlist() }, [fetchWatchlist])

  const handleSelect = async (symbol: string, name: string) => {
    setSearchQuery("")
    const alreadyIn = items.some(i => i.symbol === symbol)
    if (alreadyIn) {
      toast(`${symbol} 已在追蹤清單中`)
      return
    }
    setAddingSymbol(symbol)
    try {
      await fetch(`${API}/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, name, market: searchMarket }),
      })
      await fetchWatchlist()
      toast(`已加入 ${name || symbol}`)
    } finally {
      setAddingSymbol(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await fetch(`${API}/watchlist/${deleteTarget.symbol}`, { method: "DELETE" })
    setItems(prev => prev.filter(i => i.symbol !== deleteTarget.symbol))
    toast(`已移除 ${deleteTarget.name || deleteTarget.symbol}`, "error")
    setDeleteTarget(null)
  }

  return (
    <>

      <div className="space-y-6 p-6">

        {/* 搜尋區：glassmorphism card */}
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 shadow-lg shadow-black/30 backdrop-blur-md">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/40">
            加入標的
          </p>
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 overflow-hidden rounded-lg border border-white/[0.08]">
              {(["us", "tw"] as SearchMarket[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setSearchMarket(m); setSearchQuery("") }}
                  className={cn(
                    "cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                    searchMarket === m
                      ? "bg-white/15 text-white"
                      : "text-white/40 hover:text-white/70"
                  )}
                >
                  {m === "us" ? "美股" : "台股"}
                </button>
              ))}
            </div>
            <div className="flex-1">
              <StockSearchInput
                market={searchMarket}
                value={searchQuery}
                placeholder={searchMarket === "us" ? "輸入代碼或公司名稱（如 AAPL）" : "輸入代號或公司名稱（如 2330）"}
                onChange={setSearchQuery}
                onSelect={handleSelect}
                disabled={!!addingSymbol}
              />
            </div>
          </div>
          {addingSymbol && (
            <p className="mt-2 animate-pulse text-xs text-white/40">
              正在加入 {addingSymbol}…
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="animate-pulse rounded-2xl border border-white/[0.06] bg-slate-900/50 p-5 backdrop-blur-sm">
                <div className="mb-3 h-3 w-16 rounded bg-white/10" />
                <div className="mb-2 h-5 w-24 rounded bg-white/10" />
                <div className="h-8 w-32 rounded bg-white/10" />
              </div>
            ))}
          </div>
        )}

        {/* 空狀態 */}
        {!loading && items.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.08] py-16 text-center">
            <Star className="size-9 text-white/10" />
            <p className="text-sm text-white/30">
              搜尋股票代碼或名稱，加入追蹤清單
            </p>
          </div>
        )}

        {/* 股票卡片 grid */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(item => {
              const up = item.change_pct !== null && item.change_pct >= 0
              return (
                <div
                  key={item.symbol}
                  onClick={() => router.push(`/financials?ticker=${item.symbol}`)}
                  className="group cursor-pointer rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-200 hover:border-white/[0.15] hover:bg-slate-800/70 hover:shadow-xl hover:shadow-black/30"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/50">
                      {MARKET_LABEL[item.market] ?? item.market}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(item) }}
                      className="cursor-pointer rounded-lg p-1 text-white/20 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400"
                      title="移除"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                    {item.symbol}
                  </p>
                  <p className="mt-0.5 truncate text-base font-semibold text-white/80">
                    {item.name}
                  </p>

                  <div className="mt-4 flex items-end justify-between">
                    <p className="text-2xl font-semibold tabular-nums text-white">
                      {fmtPrice(item.price)}
                    </p>
                    {item.change_pct !== null ? (
                      <div className={cn(
                        "flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold",
                        up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      )}>
                        {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                        <span>{up ? "+" : ""}{item.change_pct.toFixed(2)}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-white/20">—</span>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-transparent transition-colors duration-200 group-hover:text-white/30">
                    查看財報 →
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Dialog.Root open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-1 flex items-start justify-between">
              <Dialog.Title className="text-base font-semibold">移除追蹤標的</Dialog.Title>
              <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <X className="size-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mb-5 text-sm text-muted-foreground">
              確定要將{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name || deleteTarget?.symbol}
              </span>{" "}
              從追蹤清單移除嗎？
            </Dialog.Description>
            <div className="flex gap-2">
              <Dialog.Close className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                取消
              </Dialog.Close>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                確定移除
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
