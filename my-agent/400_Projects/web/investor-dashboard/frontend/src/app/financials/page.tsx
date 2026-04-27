import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export default function FinancialsPage() {
  return (
    <>
      <Header title="財報分析" subtitle="損益表 · 資產負債表 · 現金流量表">
        <Button size="sm">
          <Search className="size-3.5" />
          搜尋股票
        </Button>
      </Header>

      <div className="space-y-5 p-6">
        <div className="flex h-14 items-center gap-3 rounded-xl border border-border bg-card px-5">
          <Search className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">輸入股票代碼（例：2330、AAPL）</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {["損益表", "資產負債表", "現金流量表"].map((name) => (
            <div key={name} className="flex h-36 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
              {name} — Week 4 實作
            </div>
          ))}
        </div>

        <div className="flex h-56 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
          財報圖表區 — Week 4 實作
        </div>
      </div>
    </>
  )
}
