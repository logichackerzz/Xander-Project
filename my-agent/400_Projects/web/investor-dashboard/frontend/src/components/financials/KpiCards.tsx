import { cn } from "@/lib/utils"

interface Kpi {
  revenue_b: number | null
  revenue_yoy_pct: number | null
  net_margin_pct: number | null
  pe_trailing: number | null
  pe_forward: number | null
}

interface Props {
  kpi: Kpi
}

function KpiCard({
  label,
  value,
  sub,
  subUp,
}: {
  label: string
  value: string
  sub?: string
  subUp?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card px-6 py-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {sub && (
        <p className={cn(
          "text-xs font-medium",
          subUp === true ? "text-emerald-500" :
          subUp === false ? "text-red-500" :
          "text-muted-foreground"
        )}>
          {sub}
        </p>
      )}
    </div>
  )
}

function fmtRevenue(b: number | null) {
  if (b === null) return "—"
  if (b >= 1000) return `$${(b / 1000).toFixed(1)} T`
  if (b >= 1) return `$${b.toFixed(1)} B`
  return `$${(b * 1000).toFixed(0)} M`
}

export function KpiCards({ kpi }: Props) {
  const yoyUp = kpi.revenue_yoy_pct !== null ? kpi.revenue_yoy_pct >= 0 : undefined

  return (
    <section className="grid grid-cols-3 gap-4">
      <KpiCard
        label="最新季營收"
        value={fmtRevenue(kpi.revenue_b)}
        sub={
          kpi.revenue_yoy_pct !== null
            ? `${kpi.revenue_yoy_pct >= 0 ? "▲" : "▼"} ${Math.abs(kpi.revenue_yoy_pct).toFixed(1)}% 年增率`
            : undefined
        }
        subUp={yoyUp}
      />
      <KpiCard
        label="淨利率"
        value={kpi.net_margin_pct !== null ? `${kpi.net_margin_pct.toFixed(1)}%` : "—"}
        sub="最新季"
        subUp={undefined}
      />
      <KpiCard
        label="本益比 (P/E)"
        value={kpi.pe_trailing !== null ? kpi.pe_trailing.toFixed(1) : "—"}
        sub={kpi.pe_forward !== null ? `預估 ${kpi.pe_forward.toFixed(1)} 倍` : undefined}
        subUp={undefined}
      />
    </section>
  )
}
