interface Snap {
  pe_trailing: number | null
  debt_to_equity: number | null
  fcf_b: number | null
  gross_margin_pct: number | null
}

interface Props {
  name: string
  kpi: {
    revenue_yoy_pct: number | null
    net_margin_pct: number | null
  }
  snap: Snap
}

function buildSentences({ name, kpi, snap }: Props): string[] {
  const out: string[] = []

  // 獲利面
  const parts1: string[] = []
  if (kpi.revenue_yoy_pct !== null)
    parts1.push(`近期營收年增 ${kpi.revenue_yoy_pct >= 0 ? "+" : ""}${kpi.revenue_yoy_pct.toFixed(1)}%`)
  if (kpi.net_margin_pct !== null) {
    const lvl = kpi.net_margin_pct >= 20 ? "高獲利模式"
      : kpi.net_margin_pct >= 10 ? "獲利能力尚可" : "獲利偏薄"
    parts1.push(`淨利率 ${kpi.net_margin_pct.toFixed(1)}%（${lvl}）`)
  }
  if (parts1.length) out.push(parts1.join("，") + "。")

  // 現金 & 結構面
  const parts2: string[] = []
  if (snap.fcf_b !== null)
    parts2.push(snap.fcf_b >= 0
      ? "自由現金流為正、利潤有實際現金支撐"
      : "自由現金流為負、目前處於投入期")
  if (snap.debt_to_equity !== null) {
    const de = snap.debt_to_equity
    parts2.push(de < 1 ? "財務結構穩健" : de < 2 ? "負債水準尚可" : "槓桿偏高，需留意償債壓力")
  }
  if (parts2.length) out.push(parts2.join("，") + "。")

  // 估值面
  if (snap.pe_trailing !== null && snap.pe_trailing > 0) {
    const pe = snap.pe_trailing
    const tag = pe < 15 ? "估值偏低" : pe < 25 ? "估值合理" : pe < 40 ? "估值偏高" : "市場給予高溢價"
    out.push(`本益比 ${pe.toFixed(1)}x，${tag}，詳細歷史對比見估值頁籤。`)
  }

  return out
}

export function SummaryCard({ name, kpi, snap }: Props) {
  const sentences = buildSentences({ name, kpi, snap: snap ?? { pe_trailing: null, debt_to_equity: null, fcf_b: null, gross_margin_pct: null } })
  if (!sentences.length) return null

  return (
    <p className="px-1 text-sm leading-relaxed text-slate-500">
      {sentences.join("　")}
    </p>
  )
}
