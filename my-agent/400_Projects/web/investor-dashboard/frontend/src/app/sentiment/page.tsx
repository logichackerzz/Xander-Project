import { Header } from "@/components/layout/Header"

const indicators = [
  { label: "恐懼貪婪指數", value: "—", hint: "加密市場情緒", week: "Week 5" },
  { label: "VIX 波動指數", value: "—", hint: "大盤恐慌指標", week: "Week 5" },
  { label: "RSI（大盤）", value: "—", hint: "超買 / 超賣訊號", week: "Week 5" },
]

export default function SentimentPage() {
  return (
    <>
      <Header title="市場情緒" subtitle="大盤指標 · 加密情緒 · 財經新聞" />

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-3 gap-4">
          {indicators.map((ind) => (
            <div key={ind.label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">{ind.label}</p>
              <p className="mt-2 text-2xl font-semibold">{ind.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{ind.hint}</p>
              <p className="mt-3 text-xs text-muted-foreground/50">{ind.week} 實作</p>
            </div>
          ))}
        </div>

        <div className="flex h-44 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
          MACD 指標圖 — Week 5 實作
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3 text-xs font-medium text-muted-foreground">
            財經新聞摘要
          </div>
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            RSS 爬取 — Week 5 實作
          </div>
        </div>
      </div>
    </>
  )
}
