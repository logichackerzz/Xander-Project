"use client"

import { useState, useEffect } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { X, LoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/lib/toast"
import { StockSearchInput } from "./StockSearchInput"

const API = "http://localhost:8001/api"

const MARKETS = [
  {
    value: "tw",
    label: "台股",
    placeholder: "例：台積電、2330",
    hint: '後綴自動加「.TW」',
    currency: "TWD（新台幣）",
    autoName: true,
  },
  {
    value: "us",
    label: "美股",
    placeholder: "例：Apple、AAPL",
    hint: "直接輸入代碼即可",
    currency: "USD（美元）",
    autoName: true,
  },
  {
    value: "crypto",
    label: "Crypto",
    placeholder: "例：BTC、ETH",
    hint: '後綴自動加「-USD」',
    currency: "USD（美元）",
    autoName: false,
  },
] as const

type Market = (typeof MARKETS)[number]["value"]

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm " +
  "placeholder:text-muted-foreground " +
  "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 " +
  "disabled:opacity-50"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddHoldingDialog({ open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast()
  const [market, setMarket] = useState<Market>("tw")
  const [symbol, setSymbol] = useState("")
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [cost, setCost] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const selected = MARKETS.find(m => m.value === market)!

  useEffect(() => {
    setSymbol("")
    setName("")
    setError("")
  }, [market])

  function reset() {
    setSymbol("")
    setName("")
    setQuantity("")
    setCost("")
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!symbol.trim() || !quantity || !cost) return

    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API}/portfolio/holdings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.trim(),
          market,
          name: name.trim() || symbol.trim().toUpperCase(),
          quantity: parseFloat(quantity),
          cost_per_unit: parseFloat(cost),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.detail ?? "新增失敗，請重試")
        return
      }

      const displayName = name.trim() || symbol.trim().toUpperCase()
      toast(`已新增 ${displayName}`)
      reset()
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
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl">

          <div className="mb-5 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-base font-semibold">新增持倉</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
                手動輸入你的持股資訊
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={reset}
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Market tabs */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">選擇市場</label>
              <div className="flex gap-2">
                {MARKETS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMarket(m.value)}
                    className={cn(
                      "flex-1 rounded-lg border py-2 text-sm font-medium transition-colors",
                      market === m.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Symbol / Search */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">股票／幣種代碼</label>
              {selected.autoName ? (
                <StockSearchInput
                  key={market}
                  market={market as "tw" | "us"}
                  value={symbol}
                  placeholder={selected.placeholder}
                  disabled={loading}
                  onChange={val => setSymbol(val)}
                  onSelect={(sym, sName) => {
                    setSymbol(sym)
                    setName(sName)
                  }}
                />
              ) : (
                <input
                  value={symbol}
                  onChange={e => setSymbol(e.target.value.toUpperCase())}
                  placeholder={selected.placeholder}
                  className={inputCls}
                  autoCapitalize="characters"
                  required
                  disabled={loading}
                />
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {selected.autoName ? "輸入代碼或股票名稱搜尋" : selected.hint}
              </p>
            </div>

            {/* Quantity + Cost */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">持有數量</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="any"
                  className={inputCls}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  平均成本{" "}
                  <span className="font-normal text-xs text-muted-foreground">
                    {selected.currency}
                  </span>
                </label>
                <input
                  type="number"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  placeholder="每單位"
                  min="0"
                  step="any"
                  className={inputCls}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            {loading && (
              <p className="text-center text-xs text-muted-foreground">
                正在向 yfinance 驗證代碼，約需 3–10 秒…
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Dialog.Close
                className={cn(
                  "flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-medium",
                  "text-foreground transition-colors hover:bg-muted",
                  "disabled:pointer-events-none disabled:opacity-50"
                )}
                onClick={reset}
                disabled={loading}
              >
                取消
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                  "bg-primary text-primary-foreground transition-colors hover:bg-primary/90",
                  "disabled:pointer-events-none disabled:opacity-50"
                )}
              >
                {loading && <LoaderCircle className="size-3.5 animate-spin" />}
                {loading ? "驗證中…" : "新增持倉"}
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
