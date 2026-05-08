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
    <section className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-sm px-6 py-5 shadow-[0_4px_20px_rgba(99,102,241,0.08)]">
      {/* 頂列：名稱 ↔ 股價 ↔ 星星 */}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {data.sector && (
            <p className="mb-1 text-xs font-medium text-slate-400">{data.sector}</p>
          )}
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            {data.symbol} · {data.currency}
          </p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#1E1B4B]">{data.name}</h2>
        </div>

        <div className="text-right shrink-0">
          <p className="text-3xl font-semibold tabular-nums text-[#1E1B4B]">
            {fmtPrice(data.price)}
          </p>
          <div className={cn(
            "mt-1 flex items-center justify-end gap-1 text-sm font-medium",
            up ? "text-emerald-600" : "text-red-500"
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
                : "text-slate-300 hover:bg-slate-100 hover:text-slate-500"
            )}
          >
            <Star className={cn("size-5", inWatchlist && "fill-amber-400")} />
          </button>
        )}
      </div>

      {/* 底列：市值 + 52週區間 */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
        {data.market_cap !== null && (
          <span>市值 <span className="font-medium text-[#1E1B4B]">{fmtCap(data.market_cap, data.currency)}</span></span>
        )}

        {data.week52_high !== null && data.week52_low !== null && (
          <span className="flex items-center gap-2">
            52週區間
            <span className="font-medium text-[#1E1B4B]">
              {fmtPrice(data.week52_low)} – {fmtPrice(data.week52_high)}
            </span>
            {pricePct !== null && (
              <span className="ml-1 flex items-center gap-1">
                <span className="inline-block h-1.5 w-20 rounded-full bg-slate-200 overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-indigo-400/70"
                    style={{ width: `${Math.min(pricePct, 100)}%` }}
                  />
                </span>
                <span className="text-slate-400">{pricePct}%</span>
              </span>
            )}
          </span>
        )}
      </div>
    </section>
  )
}
