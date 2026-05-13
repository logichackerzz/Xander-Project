"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const API = "http://localhost:8000/api/macro"
type Tone = "green" | "red" | "amber" | "neutral"

const TONE_BADGE: Record<Tone, string> = {
  green:   "bg-emerald-400/15 text-emerald-600 border-emerald-400/30",
  red:     "bg-red-400/15 text-red-500 border-red-400/30",
  amber:   "bg-amber-400/15 text-amber-600 border-amber-400/30",
  neutral: "bg-slate-100/80 text-slate-500 border-slate-200/60",
}
const TONE_VALUE: Record<Tone, string> = {
  green:   "text-emerald-600",
  red:     "text-red-500",
  amber:   "text-amber-600",
  neutral: "text-[#1E1B4B]",
}

const EASE = [0.16, 1, 0.3, 1] as const

interface CardData {
  label: string
  sublabel: string
  value: string
  unit?: string
  badge: string | null
  tone: Tone
  hint: string
  accentClass: string
  change?: string
  loading?: boolean
}

function MacroCard({ card }: { card: CardData }) {
  const loading = card.loading ?? false
  return (
    <div className="relative rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/60
      shadow-[0_4px_24px_rgba(99,102,241,0.09)] overflow-hidden p-6 flex flex-col gap-4">
      <div className={cn("absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r", card.accentClass)} />

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{card.sublabel}</p>
        <p className="mt-1 text-base font-bold text-[#1E1B4B]">{card.label}</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-10 w-28 rounded-xl bg-slate-100/80 animate-pulse" />
          <div className="h-4 w-20 rounded bg-slate-100/80 animate-pulse" />
        </div>
      ) : (
        <div className="flex items-end justify-between gap-2">
          <div>
            <motion.p
              key={card.value}
              className={cn("text-4xl font-black tabular-nums leading-none", TONE_VALUE[card.tone])}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {card.value}
              {card.unit && <span className="text-lg font-semibold ml-1 text-slate-400">{card.unit}</span>}
            </motion.p>
            {/* 永遠佔一行，確保高度一致 */}
            <p className={cn("mt-1 text-xs", card.change ? "text-slate-400" : "invisible select-none")}>
              {card.change ?? " "}
            </p>
          </div>
          {card.badge && (
            <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold shrink-0", TONE_BADGE[card.tone])}>
              {card.badge}
            </span>
          )}
        </div>
      )}

      <div className="h-9 flex items-center">
        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{card.hint}</p>
      </div>
    </div>
  )
}

export default function MacroPage() {
  const [data, setData]   = useState<Record<string, any>>({})
  const [load, setLoad]   = useState<Record<string, boolean>>({
    us10y: true, fedRate: true, coreCpi: true,
    dxy: true, unemployment: true, ismPmi: true,
  })

  const fetchOne = async (path: string, key: string) => {
    try {
      const r = await fetch(`${API}${path}`)
      const d = r.ok ? await r.json() : null
      setData(prev => ({ ...prev, [key]: d }))
    } catch {
      setData(prev => ({ ...prev, [key]: null }))
    } finally {
      setLoad(prev => ({ ...prev, [key]: false }))
    }
  }

  useEffect(() => {
    fetchOne("/us10y",        "us10y")
    fetchOne("/fed-rate",     "fedRate")
    fetchOne("/core-cpi",     "coreCpi")
    fetchOne("/dxy",          "dxy")
    fetchOne("/unemployment", "unemployment")
    fetchOne("/ism-pmi",      "ismPmi")
  }, [])

  const cards: CardData[] = [
    {
      label: "美債 10 年期殖利率", sublabel: "US 10-Year Treasury Yield",
      value: data.us10y?.value != null ? String(data.us10y.value) : "—",
      unit: "%",
      badge: data.us10y?.label ?? null, tone: (data.us10y?.tone as Tone) ?? "neutral",
      hint: "全球資產定價之錨。殖利率飆升會提高無風險回報率，進而壓制科技股等高成長資產的估值。",
      accentClass: "from-blue-400/30 to-indigo-400/30",
      change: data.us10y?.change != null
        ? `${data.us10y.change > 0 ? "+" : ""}${data.us10y.change}%`
        : undefined,
      loading: load.us10y,
    },
    {
      label: "Fed 利率預期", sublabel: "3M-10Y 殖利率利差",
      value: data.fedRate?.value != null ? String(data.fedRate.value) : "—",
      unit: "%",
      badge: data.fedRate?.label ?? null, tone: (data.fedRate?.tone as Tone) ?? "neutral",
      hint: "以 3 個月與 10 年期美債利差衡量降息預期。曲線倒掛（3M > 10Y）代表市場預期聯準會將降息。",
      accentClass: "from-violet-400/30 to-purple-400/30",
      change: data.fedRate?.note ?? undefined,
      loading: load.fedRate,
    },
    {
      label: "核心 CPI 年增率", sublabel: "Core CPI YoY",
      value: data.coreCpi?.value != null ? String(data.coreCpi.value) : "—",
      unit: "%",
      badge: data.coreCpi?.label ?? null, tone: (data.coreCpi?.tone as Tone) ?? "neutral",
      hint: "聯準會調整貨幣政策的核心通膨指標，直接牽動利息走向與美元強弱。",
      accentClass: "from-orange-400/30 to-red-400/30",
      change: data.coreCpi?.period ?? undefined,
      loading: load.coreCpi,
    },
    {
      label: "美元指數 (DXY)", sublabel: "US Dollar Index",
      value: data.dxy?.value != null ? String(data.dxy.value) : "—",
      badge: data.dxy?.label ?? null, tone: (data.dxy?.tone as Tone) ?? "neutral",
      hint: "全球資金流動性晴雨表。美元強弱與新興市場股市（如台股外資動向）通常呈高度負相關。",
      accentClass: "from-emerald-400/30 to-teal-400/30",
      change: data.dxy?.change_pct != null
        ? `${data.dxy.change_pct > 0 ? "+" : ""}${data.dxy.change_pct}%`
        : undefined,
      loading: load.dxy,
    },
    {
      label: "美國失業率", sublabel: "US Unemployment Rate",
      value: data.unemployment?.value != null ? String(data.unemployment.value) : "—",
      unit: "%",
      badge: data.unemployment?.label ?? null, tone: (data.unemployment?.tone as Tone) ?? "neutral",
      hint: "評估經濟體是否陷入衰退的核心就業數據，也是聯準會權衡貨幣政策的另一大支柱。",
      accentClass: "from-sky-400/30 to-blue-400/30",
      change: data.unemployment?.period ?? undefined,
      loading: load.unemployment,
    },
    {
      label: "製造業就業月增幅", sublabel: "BLS Manufacturing MoM",
      value: data.ismPmi?.value != null
        ? `${data.ismPmi.value > 0 ? "+" : ""}${data.ismPmi.value}`
        : "—",
      unit: "K",
      badge: data.ismPmi?.label ?? null, tone: (data.ismPmi?.tone as Tone) ?? "neutral",
      hint: "美國製造業就業人數月增幅，正值代表製造業擴張，負值代表收縮，是評估實體經濟動能的領先指標。",
      accentClass: "from-amber-400/30 to-yellow-400/30",
      change: data.ismPmi?.period ?? undefined,
      loading: load.ismPmi,
    },
  ]

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10 pb-16 space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-500">總體經濟</p>
        <h1 className="mt-1 text-4xl font-bold text-[#1E1B4B]">宏觀市場溫度計</h1>
      </div>

      {/* 6 Cards 3×2 Grid */}
      <motion.div
        className="grid grid-cols-2 gap-4 md:grid-cols-3"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: i * 0.07, ease: EASE }}
          >
            <MacroCard card={card} />
          </motion.div>
        ))}
      </motion.div>

    </div>
  )
}
