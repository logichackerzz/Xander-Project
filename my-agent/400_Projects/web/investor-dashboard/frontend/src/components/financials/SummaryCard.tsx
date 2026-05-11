"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react"

const API = "http://localhost:8000/api"

interface Snap {
  pe_trailing: number | null
  debt_to_equity: number | null
  fcf_b: number | null
  gross_margin_pct: number | null
}
interface Kpi {
  revenue_b: number | null
  revenue_yoy_pct: number | null
  net_margin_pct: number | null
  roe_pct: number | null
}
interface Props {
  name: string
  symbol: string
  kpi: Kpi
  snap: Snap
}

export function SummaryCard({ name, symbol, kpi, snap }: Props) {
  const [text, setText]       = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)

  const fetchSummary = async () => {
    if (text) { setOpen(o => !o); return }
    setLoading(true)
    setOpen(true)
    setText("")
    try {
      const res = await fetch(`${API}/ai/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol, name,
          revenue_b:       kpi.revenue_b,
          revenue_yoy_pct: kpi.revenue_yoy_pct,
          net_margin_pct:  kpi.net_margin_pct,
          roe_pct:         kpi.roe_pct,
          pe_trailing:     snap.pe_trailing,
          debt_to_equity:  snap.debt_to_equity,
          fcf_b:           snap.fcf_b,
          gross_margin_pct: snap.gross_margin_pct,
        }),
      })
      if (!res.body) throw new Error("no stream")
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setText(prev => prev + decoder.decode(value, { stream: true }))
      }
    } catch {
      setText("無法取得 AI 解讀，請稍後再試。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-200/50 bg-indigo-50/60 px-5 py-3">
      <button
        onClick={fetchSummary}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-indigo-400 shrink-0" />
          <span className="text-xs font-semibold text-indigo-500">
            {loading ? "分析中…" : "Ask Folio"}
          </span>
        </div>
        {text && (open
          ? <ChevronUp className="size-3.5 text-indigo-300" />
          : <ChevronDown className="size-3.5 text-indigo-300" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
              {text}
              {loading && (
                <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-indigo-400 align-middle" />
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
