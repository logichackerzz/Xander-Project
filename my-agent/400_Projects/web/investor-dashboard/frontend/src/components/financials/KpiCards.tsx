import { cn } from "@/lib/utils"

interface Kpi {
  revenue_b: number | null
  revenue_yoy_pct: number | null
  net_margin_pct: number | null
  roe_pct: number | null
}

interface Props {
  kpi: Kpi
}

function KpiCard({
  label,
  value,
  sub,
  subColor,
}: {
  label: string
  value: string
  sub?: string
  subColor?: string
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-sm px-6 py-5 shadow-[0_4px_20px_rgba(99,102,241,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">{label}</p>
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-[#1E1B4B]">{value}</p>
      {sub && (
        <p className={cn("text-xs font-medium", subColor || "text-slate-400")}>{sub}</p>
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

function roeLabel(roe: number | null): { text: string; color: string } {
  if (roe === null) return { text: "", color: "text-muted-foreground" }
  if (roe < 0)  return { text: "虧損",  color: "text-red-500" }
  if (roe < 8)  return { text: "偏低",  color: "text-amber-600" }
  if (roe < 15) return { text: "一般",  color: "text-slate-400" }
  if (roe < 25) return { text: "良好",  color: "text-emerald-600" }
  return              { text: "優秀",  color: "text-emerald-600" }
}

export function KpiCards({ kpi }: Props) {
  const yoyUp = kpi.revenue_yoy_pct !== null ? kpi.revenue_yoy_pct >= 0 : undefined
  const { text: roeText, color: roeColor } = roeLabel(kpi.roe_pct)

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
        subColor={yoyUp === true ? "text-emerald-500" : yoyUp === false ? "text-red-500" : undefined}
      />
      <KpiCard
        label="淨利率"
        value={kpi.net_margin_pct !== null ? `${kpi.net_margin_pct.toFixed(1)}%` : "—"}
        sub="最新季"
      />
      <KpiCard
        label="股東權益報酬率 (ROE)"
        value={kpi.roe_pct !== null ? `${kpi.roe_pct.toFixed(1)}%` : "—"}
        sub={roeText || undefined}
        subColor={roeColor}
      />
    </section>
  )
}
