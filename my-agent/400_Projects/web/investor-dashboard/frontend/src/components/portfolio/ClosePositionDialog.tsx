"use client"

import { useState, useEffect } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/lib/toast"

const API = "http://localhost:8001/api"
const CURRENCY: Record<string, string> = { tw: "TWD", us: "USD", crypto: "USD" }

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm " +
  "placeholder:text-muted-foreground " +
  "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 " +
  "disabled:opacity-50"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  holdingId: string
  symbol: string
  name: string
  market: string
  maxQuantity: number
  costPerUnit: number
  currentPrice: number | null
  onSuccess: () => void
}

export function ClosePositionDialog({
  open, onOpenChange,
  holdingId, symbol, name, market,
  maxQuantity, costPerUnit, currentPrice,
  onSuccess,
}: Props) {
  const { toast } = useToast()
  const cur = CURRENCY[market] ?? "USD"
  const isCrypto = market === "crypto"

  const [sellQty, setSellQty] = useState("")
  const [sellPrice, setSellPrice] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setSellQty(isCrypto ? String(maxQuantity) : String(Math.round(maxQuantity)))
      setSellPrice(currentPrice != null ? String(currentPrice) : "")
      setError("")
    }
  }, [open, maxQuantity, currentPrice, isCrypto])

  const qty = parseFloat(sellQty) || 0
  const price = parseFloat(sellPrice) || 0
  const realizedPnl = qty > 0 && price > 0 ? (price - costPerUnit) * qty : null
  const isFullClose = qty >= maxQuantity - 1e-9

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (qty <= 0 || qty > maxQuantity + 1e-9) { setError("賣出數量無效"); return }
    if (price <= 0) { setError("賣出均價必須大於 0"); return }

    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API}/portfolio/holdings/${holdingId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sell_quantity: qty, sell_price: price }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.detail ?? "平倉失敗，請重試")
        return
      }
      const data = await res.json()
      const sign = data.realized_pnl >= 0 ? "+" : ""
      const pnlStr = `（已實現損益 ${sign}${fmt(data.realized_pnl)} ${cur}）`
      toast(`${symbol} ${isFullClose ? "完全平倉" : "部分平倉"} ${pnlStr}`)
      onSuccess()
      onOpenChange(false)
    } catch {
      setError("連線失敗，請確認後端是否已啟動")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl">

          <div className="mb-5 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-base font-semibold">平倉</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
                {name}（{symbol}）· 持有 {fmt(maxQuantity, isCrypto ? 4 : 0)} {isCrypto ? "顆" : "股"} · 成本 {cur} {fmt(costPerUnit)}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">賣出數量</label>
                <input
                  type="number"
                  value={sellQty}
                  onChange={e => setSellQty(e.target.value)}
                  min="0"
                  max={maxQuantity}
                  step="any"
                  className={inputCls}
                  required
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-muted-foreground">最多 {fmt(maxQuantity, isCrypto ? 4 : 0)}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  賣出均價{" "}
                  <span className="font-normal text-xs text-muted-foreground">{cur}</span>
                </label>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={e => setSellPrice(e.target.value)}
                  placeholder="每單位"
                  min="0"
                  step="any"
                  className={inputCls}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {realizedPnl != null && (
              <div className={cn(
                "rounded-lg border px-4 py-3",
                realizedPnl >= 0
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-red-500/30 bg-red-500/10"
              )}>
                <p className="text-xs text-muted-foreground">已實現損益</p>
                <p className={cn(
                  "mt-0.5 font-mono font-semibold tabular-nums text-sm",
                  realizedPnl >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  {realizedPnl >= 0 ? "▲ +" : "▼ "}{fmt(realizedPnl)} {cur}
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Dialog.Close
                className={cn(
                  "flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-medium",
                  "text-foreground transition-colors hover:bg-muted",
                  "disabled:pointer-events-none disabled:opacity-50"
                )}
                disabled={loading}
              >
                取消
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading || qty <= 0 || price <= 0}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "disabled:pointer-events-none disabled:opacity-50"
                )}
              >
                {isFullClose ? "確認完全平倉" : "確認部分平倉"}
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
