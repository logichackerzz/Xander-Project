import { TrendingUp, TrendingDown, Star } from "lucide-react"
import { cn } from "@/lib/utils"

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
}

interface Props {
  data: OverviewData
  inWatchlist?: boolean
  onToggleWatchlist?: () => void
}

function fmtCap(v: number | null, currency: string) {
  if (v === null) return "—"
  if (v >= 1e12) return `${currency} ${(v / 1e12).toFixed(2)} T`
  if (v >= 1e9)  return `${currency} ${(v / 1e9).toFixed(1)} B`
  return `${currency} ${(v / 1e6).toFixed(0)} M`
}

function fmtPrice(v: number | null | undefined) {
  if (v == null) return "—"
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function CompanyCard({ data, inWatchlist = false, onToggleWatchlist }: Props) {
  const up = data.change_pct >= 0

  const pricePct = data.week52_high && data.week52_low
    ? Math.round((data.price - data.week52_low) / (data.week52_high - data.week52_low) * 100)
    : null

  return (
    <section className="border-b border-border/40 pb-6">
      {/* 頂列：名稱 ↔ 股價 ↔ 星星 */}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {data.sector && (
            <p className="mb-1 text-xs font-medium text-muted-foreground/60">{data.sector}</p>
          )}
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {data.symbol} · {data.currency}
          </p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">{data.name}</h2>
        </div>

        <div className="text-right shrink-0">
          <p className="text-3xl font-semibold tabular-nums">
            {fmtPrice(data.price)}
          </p>
          <div className={cn(
            "mt-1 flex items-center justify-end gap-1 text-sm font-medium",
            up ? "text-emerald-500" : "text-red-500"
          )}>
            {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            <span>{up ? "+" : ""}{data.change_pct.toFixed(2)}% 今日</span>
          </div>
        </div>

        {/* 自選股星星按鈕 */}
        {onToggleWatchlist && (
          <button
            onClick={onToggleWatchlist}
            title={inWatchlist ? "從自選股移除" : "加入自選股"}
            className={cn(
              "mt-1 shrink-0 rounded-lg p-1.5 transition-colors",
              inWatchlist
                ? "text-amber-400 hover:bg-amber-400/10"
                : "text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground"
            )}
          >
            <Star className={cn("size-5", inWatchlist && "fill-amber-400")} />
          </button>
        )}
      </div>

      {/* 底列：市值 + 52週區間 */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        {data.market_cap !== null && (
          <span>市值 <span className="font-medium text-foreground">{fmtCap(data.market_cap, data.currency)}</span></span>
        )}

        {data.week52_high !== null && data.week52_low !== null && (
          <span className="flex items-center gap-2">
            52週區間
            <span className="font-medium text-foreground">
              {fmtPrice(data.week52_low)} – {fmtPrice(data.week52_high)}
            </span>
            {pricePct !== null && (
              <span className="ml-1 flex items-center gap-1">
                <span className="inline-block h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-primary/60"
                    style={{ width: `${Math.min(pricePct, 100)}%` }}
                  />
                </span>
                <span className="text-muted-foreground/70">{pricePct}%</span>
              </span>
            )}
          </span>
        )}
      </div>
    </section>
  )
}
