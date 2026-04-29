"use client"

import { useState, useEffect } from "react"
import {
  BarChart, Bar, AreaChart, Area, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer,
} from "recharts"
import { cn } from "@/lib/utils"

const API = "http://localhost:8002/api"

const AXIS_COLOR  = "#94a3b8"
const GRID_COLOR  = "rgba(255,255,255,0.06)"
const CURSOR_FILL = "rgba(255,255,255,0.04)"

type Period = "quarterly" | "annual"

interface DataPoint {
  period: string
  revenue:    number | null
  net_income: number | null
  net_margin: number | null
}

interface HealthPoint {
  period: string
  fcf: number | null
  gross_margin: number | null
}

interface HealthSnap {
  fcf_b: number | null
  gross_margin_pct: number | null
  debt_to_equity: number | null
}

interface ValuationSnap {
  pe_trailing: number | null
  pe_forward:  number | null
  ps:          number | null
  pb:          number | null
  ev_ebitda:   number | null
}

interface PePoint {
  period: string
  pe: number | null
}

interface Props { symbol: string }

const TABS = ["獲利能力", "財務健康", "估值"] as const
type Tab = typeof TABS[number]

const PERIOD_OPTS: { label: string; period: Period; count: number }[] = [
  { label: "近4季", period: "quarterly", count: 4 },
  { label: "近8季", period: "quarterly", count: 8 },
  { label: "年報",  period: "annual",    count: 5 },
]

/* ── Tooltip 共用 ─────────────────────────────────── */
function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value
  return (
    <div style={{
      background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: "8px 12px",
    }}>
      <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>{label}</p>
      <p style={{ color: payload[0]?.color ?? "#fff", fontSize: 13, fontWeight: 600 }}>
        {v != null ? `${unit === "%" ? "" : "$"}${v}${unit}` : "—"}
      </p>
    </div>
  )
}

/* ── 營收 Bar Card ────────────────────────────────── */
function RevenueCard({ data, loading, error }: { data: DataPoint[]; loading: boolean; error: boolean }) {
  const last  = data[data.length - 1]
  const prev4 = data[data.length - 5]

  const headline = last?.revenue != null ? `$${last.revenue}B` : "—"
  const yoy = last?.revenue && prev4?.revenue
    ? ((last.revenue / prev4.revenue - 1) * 100)
    : null

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">營收趨勢</p>
          <p className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight">{headline}</p>
        </div>
        {yoy !== null && (
          <span className={cn(
            "mt-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            yoy >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          )}>
            {yoy >= 0 ? "▲" : "▼"} {Math.abs(yoy).toFixed(1)}% YoY
          </span>
        )}
      </div>

      <div className="h-44">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">載入中…</div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">無法載入</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke={GRID_COLOR} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: AXIS_COLOR }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: AXIS_COLOR }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}B`} width={50} />
              <Tooltip content={<ChartTooltip unit="B" />} cursor={{ fill: CURSOR_FILL }} />
              <Bar dataKey="revenue" name="營收" fill="#3b82f6" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

/* ── 淨利率 Area Card ─────────────────────────────── */
function MarginCard({ data, loading, error }: { data: DataPoint[]; loading: boolean; error: boolean }) {
  const last = data[data.length - 1]
  const prev = data[data.length - 2]

  const headline = last?.net_margin != null ? `${last.net_margin}%` : "—"
  const diff = last?.net_margin != null && prev?.net_margin != null
    ? last.net_margin - prev.net_margin
    : null

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">淨利率趨勢</p>
          <p className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight">{headline}</p>
        </div>
        {diff !== null && (
          <span className={cn(
            "mt-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            diff >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          )}>
            {diff >= 0 ? "▲" : "▼"} {Math.abs(diff).toFixed(1)}pp QoQ
          </span>
        )}
      </div>

      <div className="h-44">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">載入中…</div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">無法載入</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID_COLOR} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: AXIS_COLOR }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: AXIS_COLOR }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={38} domain={["auto", "auto"]} />
              <Tooltip content={<ChartTooltip unit="%" />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
              <Area
                dataKey="net_margin" name="淨利率"
                stroke="#10b981" strokeWidth={2.5}
                fill="url(#marginGrad)"
                dot={{ r: 3.5, fill: "#10b981", strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

/* ── 財務健康 KPI 小卡行 ─────────────────────────── */
function fmtFcf(b: number | null) {
  if (b === null) return "—"
  const abs = Math.abs(b)
  const prefix = b < 0 ? "-" : ""
  if (abs >= 1000) return `${prefix}$${(abs / 1000).toFixed(1)}T`
  if (abs >= 1)    return `${prefix}$${abs.toFixed(1)}B`
  return `${prefix}$${(abs * 1000).toFixed(0)}M`
}

function HealthKpiRow({ snap }: { snap: HealthSnap }) {
  const de = snap.debt_to_equity
  const deStr = de !== null ? de.toFixed(2) : "—"
  const deLabel = de === null ? "無資料" : de > 2 ? "槓桿偏高" : de < 1 ? "財務穩健" : "尚可"
  const deColor = de === null ? "" : de > 2 ? "text-red-400" : de < 1 ? "text-emerald-400" : ""

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="rounded-2xl border border-border bg-card px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">自由現金流</p>
        <p className={cn(
          "mt-1.5 text-2xl font-semibold tabular-nums tracking-tight",
          snap.fcf_b !== null && snap.fcf_b < 0 ? "text-red-400" : ""
        )}>
          {fmtFcf(snap.fcf_b)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">最新季 FCF</p>
      </div>

      <div className="rounded-2xl border border-border bg-card px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">毛利率</p>
        <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">
          {snap.gross_margin_pct !== null ? `${snap.gross_margin_pct.toFixed(1)}%` : "—"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">最新季</p>
      </div>

      <div className="rounded-2xl border border-border bg-card px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">負債比 (D/E)</p>
        <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums tracking-tight", deColor)}>
          {deStr}
        </p>
        <p className={cn("mt-1 text-xs", deColor || "text-muted-foreground")}>{deLabel}</p>
      </div>
    </div>
  )
}

/* ── FCF Bar Card ─────────────────────────────────── */
function FcfCard({ data, loading, error }: { data: HealthPoint[]; loading: boolean; error: boolean }) {
  const last = data[data.length - 1]
  const prev = data[data.length - 2]
  const headline = fmtFcf(last?.fcf ?? null)
  const diff = last?.fcf != null && prev?.fcf != null ? last.fcf - prev.fcf : null

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">自由現金流 (FCF)</p>
          <p className={cn(
            "mt-1.5 text-3xl font-semibold tabular-nums tracking-tight",
            last?.fcf != null && last.fcf < 0 ? "text-red-400" : ""
          )}>
            {headline}
          </p>
        </div>
        {diff !== null && (
          <span className={cn(
            "mt-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            diff >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          )}>
            {diff >= 0 ? "▲" : "▼"} QoQ
          </span>
        )}
      </div>

      <div className="h-44">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">載入中…</div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">無法載入</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke={GRID_COLOR} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: AXIS_COLOR }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: AXIS_COLOR }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}B`} width={50} />
              <Tooltip content={<ChartTooltip unit="B" />} cursor={{ fill: CURSOR_FILL }} />
              <Bar dataKey="fcf" name="FCF" radius={[5, 5, 0, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.fcf !== null && d.fcf < 0 ? "#ef4444" : "#3b82f6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

/* ── 毛利率 Area Card ─────────────────────────────── */
function GrossMarginCard({ data, loading, error }: { data: HealthPoint[]; loading: boolean; error: boolean }) {
  const last = data[data.length - 1]
  const prev = data[data.length - 2]
  const headline = last?.gross_margin != null ? `${last.gross_margin.toFixed(1)}%` : "—"
  const diff = last?.gross_margin != null && prev?.gross_margin != null
    ? last.gross_margin - prev.gross_margin : null

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">毛利率趨勢</p>
          <p className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight">{headline}</p>
        </div>
        {diff !== null && (
          <span className={cn(
            "mt-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            diff >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          )}>
            {diff >= 0 ? "▲" : "▼"} {Math.abs(diff).toFixed(1)}pp QoQ
          </span>
        )}
      </div>

      <div className="h-44">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">載入中…</div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">無法載入</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grossMarginGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#a855f7" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID_COLOR} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: AXIS_COLOR }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: AXIS_COLOR }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={38} domain={["auto", "auto"]} />
              <Tooltip content={<ChartTooltip unit="%" />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
              <Area
                dataKey="gross_margin" name="毛利率"
                stroke="#a855f7" strokeWidth={2.5}
                fill="url(#grossMarginGrad)"
                dot={{ r: 3.5, fill: "#a855f7", strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

/* ── 估值 helpers ────────────────────────────────── */
function peTag(pe: number | null): { text: string; color: string } {
  if (pe === null) return { text: "無資料", color: "text-muted-foreground" }
  if (pe <= 0)  return { text: "負盈餘",  color: "text-red-400" }
  if (pe < 15)  return { text: "低估值",  color: "text-emerald-400" }
  if (pe < 30)  return { text: "合理",    color: "text-muted-foreground" }
  if (pe < 50)  return { text: "偏貴",    color: "text-yellow-400" }
  return         { text: "高溢價",        color: "text-red-400" }
}

function psTag(ps: number | null): { text: string; color: string } {
  if (ps === null) return { text: "無資料", color: "text-muted-foreground" }
  if (ps < 1)  return { text: "偏低",  color: "text-emerald-400" }
  if (ps < 5)  return { text: "合理",  color: "text-muted-foreground" }
  if (ps < 15) return { text: "偏高",  color: "text-yellow-400" }
  return        { text: "極高溢價",   color: "text-red-400" }
}

function pbTag(pb: number | null): { text: string; color: string } {
  if (pb === null) return { text: "無資料", color: "text-muted-foreground" }
  if (pb < 1)  return { text: "資產折價", color: "text-emerald-400" }
  if (pb < 3)  return { text: "合理",     color: "text-muted-foreground" }
  if (pb < 8)  return { text: "高溢價",   color: "text-yellow-400" }
  return        { text: "極高溢價",       color: "text-red-400" }
}

/* ── 估值 KPI 小卡行 ─────────────────────────────── */
function ValuationKpiRow({ snap }: { snap: ValuationSnap }) {
  const { text: peText, color: peColor } = peTag(snap.pe_trailing)
  const { text: psText, color: psColor } = psTag(snap.ps)
  const { text: pbText, color: pbColor } = pbTag(snap.pb)

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="rounded-2xl border border-border bg-card px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">本益比 (P/E)</p>
        <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums tracking-tight", peColor)}>
          {snap.pe_trailing !== null ? `${snap.pe_trailing.toFixed(1)}x` : "—"}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className={cn("text-xs font-medium", peColor)}>{peText}</span>
          {snap.pe_forward !== null && (
            <span className="text-xs text-muted-foreground">預估 {snap.pe_forward.toFixed(1)}x</span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">市銷率 (P/S)</p>
        <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">
          {snap.ps !== null ? `${snap.ps.toFixed(2)}x` : "—"}
        </p>
        <p className={cn("mt-1 text-xs font-medium", psColor)}>{psText}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">股價淨值比 (P/B)</p>
        <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">
          {snap.pb !== null ? `${snap.pb.toFixed(2)}x` : "—"}
        </p>
        <p className={cn("mt-1 text-xs font-medium", pbColor)}>{pbText}</p>
      </div>
    </div>
  )
}

/* ── P/E 歷史走勢 Card（全寬）────────────────────── */
function PeHistoryCard({ data, loading, error, snap }: {
  data: PePoint[]; loading: boolean; error: boolean; snap: ValuationSnap | null
}) {
  const valid = data.filter(d => d.pe !== null)
  const avg   = valid.length ? valid.reduce((s, d) => s + d.pe!, 0) / valid.length : null
  const last  = valid[valid.length - 1]
  const headline = last?.pe != null ? `${last.pe.toFixed(1)}x` : "—"
  const { text: tag, color: tagColor } = peTag(last?.pe ?? null)

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">本益比歷史走勢 (TTM P/E)</p>
          <p className={cn("mt-1.5 text-3xl font-semibold tabular-nums tracking-tight", tagColor)}>
            {headline}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 mt-1">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", tagColor,
            tagColor === "text-red-400"     ? "bg-red-500/10"     :
            tagColor === "text-yellow-400"  ? "bg-yellow-500/10"  :
            tagColor === "text-emerald-400" ? "bg-emerald-500/10" : "bg-muted"
          )}>
            {tag}
          </span>
          {avg !== null && (
            <span className="text-xs text-muted-foreground">均值 {avg.toFixed(1)}x</span>
          )}
        </div>
      </div>

      <div className="h-52">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">載入中…</div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">無法載入</div>
        ) : valid.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm text-muted-foreground">無法計算歷史 P/E（可能為虧損公司）</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="peGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID_COLOR} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: AXIS_COLOR }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: AXIS_COLOR }} axisLine={false} tickLine={false}
                tickFormatter={v => `${v}x`} width={42} domain={["auto", "auto"]}
              />
              <Tooltip content={<ChartTooltip unit="x" />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
              {avg !== null && (
                <ReferenceLine
                  y={avg}
                  stroke="#f59e0b" strokeDasharray="4 3" strokeOpacity={0.5}
                  label={{ value: `均 ${avg.toFixed(1)}x`, position: "insideTopRight", fill: "#f59e0b", fontSize: 10 }}
                />
              )}
              <Area
                dataKey="pe" name="P/E"
                stroke="#f59e0b" strokeWidth={2.5}
                fill="url(#peGrad)"
                dot={{ r: 3.5, fill: "#f59e0b", strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {snap?.ev_ebitda !== null && snap?.ev_ebitda && (
        <p className="mt-3 text-xs text-muted-foreground">
          EV/EBITDA：{snap.ev_ebitda.toFixed(1)}x
        </p>
      )}
    </div>
  )
}

/* ── 主組件 ──────────────────────────────────────── */
export function IncomeChart({ symbol }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("獲利能力")
  const [periodIdx, setPeriodIdx] = useState(1)

  const [data, setData]       = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(false)

  const [healthData, setHealthData] = useState<HealthPoint[]>([])
  const [healthSnap, setHealthSnap] = useState<HealthSnap | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [healthError, setHealthError]     = useState(false)

  const [valSnap, setValSnap]     = useState<ValuationSnap | null>(null)
  const [valData, setValData]     = useState<PePoint[]>([])
  const [valLoading, setValLoading] = useState(false)
  const [valError, setValError]     = useState(false)

  const { period, count } = PERIOD_OPTS[periodIdx]

  useEffect(() => {
    if (activeTab !== "獲利能力") return
    setLoading(true)
    setError(false)
    fetch(`${API}/financials/${symbol}/income-statement?period=${period}&count=${count}`)
      .then(r => r.json())
      .then(d => setData(d.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [symbol, period, count, activeTab])

  useEffect(() => {
    if (activeTab !== "財務健康") return
    setHealthLoading(true)
    setHealthError(false)
    fetch(`${API}/financials/${symbol}/health?period=${period}&count=${count}`)
      .then(r => r.json())
      .then(d => {
        setHealthData(d.data ?? [])
        setHealthSnap(d.snapshot ?? null)
      })
      .catch(() => setHealthError(true))
      .finally(() => setHealthLoading(false))
  }, [symbol, period, count, activeTab])

  useEffect(() => {
    if (activeTab !== "估值") return
    setValLoading(true)
    setValError(false)
    fetch(`${API}/financials/${symbol}/valuation?count=8`)
      .then(r => r.json())
      .then(d => {
        setValSnap(d.snapshot ?? null)
        setValData(d.pe_history ?? [])
      })
      .catch(() => setValError(true))
      .finally(() => setValLoading(false))
  }, [symbol, activeTab])

  return (
    <section>
      {/* Tab + Period selector */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl bg-muted p-1 gap-0.5">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {(activeTab === "獲利能力" || activeTab === "財務健康") && (
          <div className="flex rounded-xl bg-muted p-1 gap-0.5">
            {PERIOD_OPTS.map((opt, i) => (
              <button
                key={opt.label}
                onClick={() => setPeriodIdx(i)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  periodIdx === i
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 獲利能力 */}
      {activeTab === "獲利能力" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <RevenueCard data={data} loading={loading} error={error} />
          <MarginCard  data={data} loading={loading} error={error} />
        </div>
      )}

      {/* 財務健康 */}
      {activeTab === "財務健康" && (
        <div>
          {healthSnap && !healthError && <HealthKpiRow snap={healthSnap} />}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FcfCard         data={healthData} loading={healthLoading} error={healthError} />
            <GrossMarginCard data={healthData} loading={healthLoading} error={healthError} />
          </div>
        </div>
      )}

      {/* 估值 */}
      {activeTab === "估值" && (
        <div>
          {valSnap && !valError && <ValuationKpiRow snap={valSnap} />}
          <PeHistoryCard data={valData} loading={valLoading} error={valError} snap={valSnap} />
        </div>
      )}
    </section>
  )
}
