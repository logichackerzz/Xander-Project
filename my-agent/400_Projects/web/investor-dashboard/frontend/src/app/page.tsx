import { Header } from "@/components/layout/Header"
import { cn } from "@/lib/utils"
import { DollarSign, TrendingUp, TrendingDown, Package } from "lucide-react"

const stats = [
  {
    label: "總資產（TWD）",
    value: "—",
    hint: "請先輸入持倉",
    icon: DollarSign,
    color: "text-blue-400",
  },
  {
    label: "今日損益",
    value: "—",
    hint: "即時報價計算",
    icon: TrendingUp,
    color: "text-emerald-400",
  },
  {
    label: "總報酬率",
    value: "—",
    hint: "自成本計算",
    icon: TrendingDown,
    color: "text-rose-400",
  },
  {
    label: "持有資產數",
    value: "0",
    hint: "股票 + 加密貨幣",
    icon: Package,
    color: "text-violet-400",
  },
]

export default function DashboardPage() {
  return (
    <>
      <Header title="投資總覽" subtitle="所有帳戶 · 即時更新" />
      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className={cn("size-4", s.color)} />
              </div>
              <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
            </div>
          ))}
        </div>

        <div className="flex h-60 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
          資產走勢圖 — Week 2 實作
        </div>

        <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
          持倉明細表 — Week 2 實作
        </div>
      </div>
    </>
  )
}
