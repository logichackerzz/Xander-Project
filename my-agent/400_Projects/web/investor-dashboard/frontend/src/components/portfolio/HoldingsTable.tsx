"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/lib/toast"
import type { Holding } from "@/app/portfolio/page"

const BADGE: Record<string, { label: string; cls: string }> = {
  tw:     { label: "台股",   cls: "bg-blue-500/10 text-blue-400" },
  us:     { label: "美股",   cls: "bg-violet-500/10 text-violet-400" },
  crypto: { label: "Crypto", cls: "bg-orange-500/10 text-orange-400" },
}

const CURRENCY: Record<string, string> = { tw: "TWD", us: "USD", crypto: "USD" }

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })
}

interface Props {
  holdings: Holding[]
  loading: boolean
  onDelete: (id: string) => Promise<void>
  onRefresh: () => void
  onAdd: () => void
}

export function HoldingsTable({ holdings, loading, onDelete, onRefresh, onAdd }: Props) {
  const { toast } = useToast()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  async function handleConfirmDelete(h: Holding) {
    try {
      await onDelete(h.id)
      toast(`已刪除 ${h.name}（${h.symbol}）`)
    } catch {
      toast("刪除失敗，請重試", "error")
    }
    setConfirmingId(null)
  }

  function requestDelete(id: string) {
    setConfirmingId(id)
    // 沒有在 4 秒內確認就自動收回
    setTimeout(() => setConfirmingId(prev => (prev === id ? null : prev)), 4000)
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="size-4 animate-spin" />
          載入報價中，請稍候…
        </div>
      </div>
    )
  }

  if (holdings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card">
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="rounded-full border border-dashed border-border p-4">
            <Plus className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">你還沒有任何持倉</p>
            <p className="mt-1 text-sm text-muted-foreground">
              點下方按鈕，加入你的第一筆股票或加密貨幣
            </p>
          </div>
          <Button size="sm" onClick={onAdd}>
            <Plus className="size-3.5" />
            新增第一筆持倉
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="text-sm font-medium">持倉明細</span>
        <Button variant="ghost" size="icon-sm" onClick={onRefresh} title="更新報價">
          <RefreshCw className="size-3.5" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-5 py-2.5 text-left font-medium">代碼</th>
              <th className="px-5 py-2.5 text-left font-medium">名稱</th>
              <th className="px-5 py-2.5 text-left font-medium">市場</th>
              <th className="px-5 py-2.5 text-right font-medium">數量</th>
              <th className="px-5 py-2.5 text-right font-medium">成本／單位</th>
              <th className="px-5 py-2.5 text-right font-medium">現價</th>
              <th className="px-5 py-2.5 text-right font-medium">市值</th>
              <th className="px-5 py-2.5 text-right font-medium">損益</th>
              <th className="px-5 py-2.5 text-right font-medium">報酬率</th>
              <th className="w-24 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {holdings.map(h => {
              const cur = CURRENCY[h.market]
              const badge = BADGE[h.market]
              const up = (h.pnl ?? 0) >= 0
              const pnlCls = h.pnl == null ? "" : up ? "text-emerald-400" : "text-red-400"
              const isConfirming = confirmingId === h.id

              return (
                <tr
                  key={h.id}
                  className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 py-3.5 font-mono font-semibold">{h.symbol}</td>
                  <td className="max-w-[8rem] truncate px-5 py-3.5 text-muted-foreground" title={h.name}>{h.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", badge.cls)}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                    {fmt(h.quantity, h.market === "crypto" ? 4 : 0)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                    <span className="mr-1 text-xs text-muted-foreground">{cur}</span>
                    {fmt(h.cost_per_unit)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                    {h.current_price == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <>
                        <span className="mr-1 text-xs text-muted-foreground">{cur}</span>
                        {fmt(h.current_price)}
                      </>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                    {h.market_value == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <>
                        <span className="mr-1 text-xs text-muted-foreground">{cur}</span>
                        {fmt(h.market_value)}
                      </>
                    )}
                  </td>
                  <td className={cn("px-5 py-3.5 text-right font-mono tabular-nums", pnlCls)}>
                    {h.pnl == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <>{up ? "▲ +" : "▼ "}{fmt(h.pnl)}</>
                    )}
                  </td>
                  <td className={cn("px-5 py-3.5 text-right font-mono font-semibold tabular-nums", pnlCls)}>
                    {h.pnl_pct == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <>{up ? "▲ +" : "▼ "}{fmt(h.pnl_pct)}%</>
                    )}
                  </td>

                  {/* Delete: 一般 → 確認 → 消失 */}
                  <td className="px-3 py-3.5">
                    {isConfirming ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setConfirmingId(null)}
                          className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleConfirmDelete(h)}
                          className="rounded bg-destructive/15 px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/25"
                        >
                          確認刪除
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => requestDelete(h.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border px-5 py-2.5 text-xs text-muted-foreground">
        ⚠ 股票報價可能有 15 分鐘延遲（yfinance）；Crypto 報價較即時。
      </div>
    </div>
  )
}
