import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface OverviewData {
  symbol: string
  name: string
  price: number
  change_pct: number
  currency: string
}

interface Props {
  data: OverviewData
}

export function CompanyCard({ data }: Props) {
  const up = data.change_pct >= 0

  return (
    <section className="flex items-end justify-between border-b border-border/40 pb-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {data.symbol} · {data.currency}
        </p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">{data.name}</h2>
      </div>

      <div className="text-right">
        <p className="text-3xl font-semibold tabular-nums">
          {data.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className={cn(
          "mt-1 flex items-center justify-end gap-1 text-sm font-medium",
          up ? "text-emerald-500" : "text-red-500"
        )}>
          {up
            ? <TrendingUp className="size-3.5" />
            : <TrendingDown className="size-3.5" />
          }
          <span>{up ? "+" : ""}{data.change_pct.toFixed(2)}% 今日</span>
        </div>
      </div>
    </section>
  )
}
