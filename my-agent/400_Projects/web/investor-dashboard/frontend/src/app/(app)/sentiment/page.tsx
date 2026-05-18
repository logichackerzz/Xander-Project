"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Globe, Activity, Newspaper, TrendingUp, TrendingDown, ExternalLink, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { readCache, writeCache } from "@/lib/dataCache"
import { API_BASE } from "@/lib/api"

const API = API_BASE
type TabId = "us" | "tw" | "macro" | "news"
type Tone  = "green" | "red" | "amber" | "neutral"

// ── Design helpers ─────────────────────────────────────────────────────────
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

function fmtIndex(v: number): string {
  if (v >= 10000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 })
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Tab config ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "macro" as TabId, label: "總體經濟", icon: BarChart3  },
  { id: "us"    as TabId, label: "美股市場", icon: Globe      },
  { id: "tw"    as TabId, label: "台股市場", icon: Activity   },
  { id: "news"  as TabId, label: "財經新聞", icon: Newspaper  },
]

// ── KPI Card ───────────────────────────────────────────────────────────────
interface HighLow { high: number; low: number; isToday: boolean }
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
  dateLabel?: string
  highLow?: HighLow
  loading?: boolean
  prev?: string           // 上期數值顯示字串（含單位）
  prevLabel?: string      // "昨收" | "上期"
  prevTone?: "green" | "red" | "neutral"
}

function KpiCard({ card }: { card: CardData }) {
  const loading = card.loading ?? false
  return (
    <div className="relative rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/60
      shadow-[0_4px_24px_rgba(99,102,241,0.09)] overflow-hidden p-6 flex flex-col gap-4">
      <div className={cn("absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r", card.accentClass)} />

      {/* sublabel + dateLabel badge */}
      <div>
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{card.sublabel}</p>
          {card.dateLabel && (
            <span className="rounded-full bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.5
              text-[9px] font-semibold text-amber-600 leading-none">
              {card.dateLabel}
            </span>
          )}
        </div>
        <p className="mt-1 text-base font-bold text-[#1E1B4B]">{card.label}</p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div
            key="skeleton"
            className="space-y-2"
            exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.18 } }}
          >
            <div className="h-10 w-28 rounded-xl bg-slate-100/80 animate-pulse" />
            <div className="h-4 w-20 rounded bg-slate-100/80 animate-pulse" />
            <div className="h-3 w-14 rounded bg-slate-100/80 animate-pulse" />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="flex items-end justify-between gap-2"
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: EASE }}
          >
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
            {/* 永遠佔一行空間，確保所有卡片高度一致 */}
            <p className={cn("mt-1 text-xs", card.change ? "text-slate-400" : "invisible select-none")}>
              {card.change ?? " "}
            </p>
            <div className={cn("mt-0.5 flex items-center gap-1", !card.prev && "invisible select-none")}>
              <span className="text-[10px] text-slate-400">{card.prevLabel ?? "上期"}</span>
              <span className={cn("text-[10px] font-medium tabular-nums",
                card.prevTone === "green" ? "text-emerald-500" :
                card.prevTone === "red"   ? "text-red-400" : "text-slate-400"
              )}>
                {card.prev ?? "—"}
              </span>
              {card.prevTone === "green" && <TrendingUp  className="size-2.5 text-emerald-400 shrink-0" />}
              {card.prevTone === "red"   && <TrendingDown className="size-2.5 text-red-400 shrink-0" />}
            </div>
          </div>
          {card.badge && (
              <motion.span
                className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold shrink-0", TONE_BADGE[card.tone])}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1, ease: EASE }}
              >
                {card.badge}
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 固定高度底部區塊，確保所有卡片高度一致 */}
      <div className="h-9 flex items-center">
        {card.highLow ? (
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-[11px] text-slate-400">
                {card.highLow.isToday ? "最高" : "昨日最高"}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 tabular-nums">
                {fmtIndex(card.highLow.high)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-red-400 shrink-0" />
              <span className="text-[11px] text-slate-400">
                {card.highLow.isToday ? "最低" : "昨日最低"}
              </span>
              <span className="text-[11px] font-semibold text-red-500 tabular-nums">
                {fmtIndex(card.highLow.low)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{card.hint}</p>
        )}
      </div>
    </div>
  )
}

// ── News Tab ───────────────────────────────────────────────────────────────
interface NewsArticle {
  title:     string
  summary:   string
  publisher: string
  pub_date:  string
  url:       string
  region:    string
  lang:      string
}

const REGION_BADGE: Record<string, string> = {
  US:     "bg-blue-50 text-blue-500 border-blue-100",
  TW:     "bg-emerald-50 text-emerald-600 border-emerald-100",
  GLOBAL: "bg-violet-50 text-violet-500 border-violet-100",
}
const REGION_LABEL: Record<string, string> = { US: "美股", TW: "台股", GLOBAL: "全球" }

function parseRelativeTime(pubDate: string): string {
  try {
    const diff = (Date.now() - new Date(pubDate).getTime()) / 60000
    if (diff < 60)    return `${Math.floor(diff)} 分鐘前`
    if (diff < 1440)  return `${Math.floor(diff / 60)} 小時前`
    return `${Math.floor(diff / 1440)} 天前`
  } catch { return "" }
}

function NewsTab() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch(`${API}/sentiment/news?limit=16`)
      .then(r => r.ok ? r.json() : { articles: [] })
      .then(d => setArticles(d.articles ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60
          shadow-[0_2px_12px_rgba(99,102,241,0.07)] px-5 py-4 space-y-2">
          <div className="h-3.5 w-3/4 rounded bg-slate-100/80 animate-pulse" />
          <div className="h-2.5 w-full rounded bg-slate-100/80 animate-pulse" />
          <div className="h-2.5 w-1/2 rounded bg-slate-100/80 animate-pulse" />
          <div className="h-2 w-1/4 rounded bg-slate-100/80 animate-pulse mt-1" />
        </div>
      ))}
    </div>
  )

  if (articles.length === 0) return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60 px-5 py-12 text-center text-sm text-slate-400">
      無法取得新聞，請確認後端已啟動
    </div>
  )

  return (
    <div className="space-y-2">
      {articles.map((a, i) => (
        <motion.a
          key={i}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60
            shadow-[0_2px_12px_rgba(99,102,241,0.07)] px-5 py-4 group
            hover:bg-white hover:shadow-[0_4px_20px_rgba(99,102,241,0.14)] transition-all"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.03, ease: EASE }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1E1B4B] leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
              {a.title}
            </p>
            {a.summary && (
              <p className="mt-1 text-[12px] text-slate-400 leading-relaxed line-clamp-2">
                {a.summary}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {a.region && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${REGION_BADGE[a.region] ?? REGION_BADGE.GLOBAL}`}>
                  {REGION_LABEL[a.region] ?? a.region}
                </span>
              )}
              <span className="text-[11px] text-slate-400">{a.publisher}</span>
              {a.pub_date && (
                <>
                  <span className="text-slate-200">·</span>
                  <span className="text-[11px] text-slate-400">{parseRelativeTime(a.pub_date)}</span>
                </>
              )}
            </div>
          </div>
          <ExternalLink className="size-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0 mt-0.5" />
        </motion.a>
      ))}
    </div>
  )
}

// ── prev 計算 helpers ─────────────────────────────────────────────────────
type PrevTone = "green" | "red" | "neutral"

function calcPrevTone(curr: number, prev: number, higherIsBetter: boolean): PrevTone {
  if (Math.abs(curr - prev) < 1e-9) return "neutral"
  return (curr > prev) === higherIsBetter ? "green" : "red"
}

// 從 change（絕對差）推算前期值
function prevFromChange(
  value: number | null | undefined,
  change: number | null | undefined,
  higherIsBetter: boolean,
  fmt: (n: number) => string,
  label = "昨收",
): Pick<CardData, "prev" | "prevLabel" | "prevTone"> {
  if (value == null || change == null) return {}
  const prevVal = value - change
  return { prev: fmt(prevVal), prevLabel: label, prevTone: calcPrevTone(value, prevVal, higherIsBetter) }
}

// 從後端 prev_value 直接建立
function prevFromApi(
  curr: number | null | undefined,
  prevVal: number | null | undefined,
  higherIsBetter: boolean,
  fmt: (n: number) => string,
  label = "上期",
): Pick<CardData, "prev" | "prevLabel" | "prevTone"> {
  if (curr == null || prevVal == null) return {}
  return { prev: fmt(prevVal), prevLabel: label, prevTone: calcPrevTone(curr, prevVal, higherIsBetter) }
}

// ── US / TW card builders ──────────────────────────────────────────────────
function buildUsCards(data: Record<string, any>, load: Record<string, boolean>): CardData[] {
  const sp  = data.sp500
  const nq  = data.nasdaq
  const dj  = data.dow
  const vix = data.vix
  const br  = data.breadth
  const pc  = data.putCall
  return [
    {
      label: "S&P 500", sublabel: "標普 500 指數",
      value: sp?.value != null ? fmtIndex(sp.value) : "—",
      badge: sp?.label ?? null, tone: (sp?.tone as Tone) ?? "neutral",
      hint: "",
      accentClass: "from-blue-400/30 to-indigo-400/30",
      change: sp?.change_pct != null ? `${sp.change_pct > 0 ? "+" : ""}${sp.change_pct}%` : undefined,
      dateLabel: sp?.is_today === false ? "昨日收盤" : undefined,
      highLow: sp?.high != null && sp?.low != null ? { high: sp.high, low: sp.low, isToday: !!sp.is_today } : undefined,
      loading: load.sp500,
      ...prevFromChange(sp?.value, sp?.change, true, n => fmtIndex(n)),
    },
    {
      label: "NASDAQ", sublabel: "那斯達克綜合指數",
      value: nq?.value != null ? fmtIndex(nq.value) : "—",
      badge: nq?.label ?? null, tone: (nq?.tone as Tone) ?? "neutral",
      hint: "",
      accentClass: "from-violet-400/30 to-purple-400/30",
      change: nq?.change_pct != null ? `${nq.change_pct > 0 ? "+" : ""}${nq.change_pct}%` : undefined,
      dateLabel: nq?.is_today === false ? "昨日收盤" : undefined,
      highLow: nq?.high != null && nq?.low != null ? { high: nq.high, low: nq.low, isToday: !!nq.is_today } : undefined,
      loading: load.nasdaq,
      ...prevFromChange(nq?.value, nq?.change, true, n => fmtIndex(n)),
    },
    {
      label: "道瓊斯", sublabel: "Dow Jones 工業指數",
      value: dj?.value != null ? fmtIndex(dj.value) : "—",
      badge: dj?.label ?? null, tone: (dj?.tone as Tone) ?? "neutral",
      hint: "",
      accentClass: "from-sky-400/30 to-cyan-400/30",
      change: dj?.change_pct != null ? `${dj.change_pct > 0 ? "+" : ""}${dj.change_pct}%` : undefined,
      dateLabel: dj?.is_today === false ? "昨日收盤" : undefined,
      highLow: dj?.high != null && dj?.low != null ? { high: dj.high, low: dj.low, isToday: !!dj.is_today } : undefined,
      loading: load.dow,
      ...prevFromChange(dj?.value, dj?.change, true, n => fmtIndex(n)),
    },
    {
      label: "VIX 恐慌指數", sublabel: "CBOE Volatility Index",
      value: vix?.value != null ? String(vix.value) : "—",
      badge: vix?.label ?? null, tone: (vix?.tone as Tone) ?? "neutral",
      hint: "<15 平靜 · 15-25 正常 · >25 恐慌",
      accentClass: "from-amber-400/30 to-orange-400/30",
      change: vix?.change_pct != null ? `${vix.change_pct > 0 ? "+" : ""}${vix.change_pct}%` : undefined,
      loading: load.vix,
      ...prevFromChange(vix?.value, vix?.change, false, n => n.toFixed(2)),
    },
    {
      label: "市場廣度指標", sublabel: "Market Breadth",
      value: br?.value != null ? `${br.value}%` : "—",
      badge: br?.label ?? null, tone: (br?.tone as Tone) ?? "neutral",
      hint: "S&P 500 成分股高於 50日均線的比例。高於 80% 代表全面過熱，低於 20% 代表市場悲觀、處於超跌區。",
      accentClass: "from-indigo-400/30 to-blue-400/30",
      loading: load.breadth,
    },
    {
      label: "總體期權多空比", sublabel: "CBOE Equity Put/Call",
      value: pc?.value != null ? String(pc.value) : "—",
      badge: pc?.label ?? null, tone: (pc?.tone as Tone) ?? "neutral",
      hint: "美股總體期權多空比，低於 0.7 代表市場情緒極度樂觀，高於 1.0 代表避險情緒濃厚。",
      accentClass: "from-rose-400/30 to-pink-400/30",
      loading: load.putCall,
    },
  ]
}

function buildTwCards(data: Record<string, any>, load: Record<string, boolean>): CardData[] {
  const mg  = data.margin
  const sr  = data.shortRatio
  const fn  = data.foreignNet
  const vol = data.volume
  const tr  = data.trustNet
  const rr  = data.retailRatio
  return [
    {
      label: "融資餘額", sublabel: "散戶槓桿熱度",
      value: mg?.value != null ? String(mg.value) : "—",
      unit: mg?.unit, badge: mg?.label ?? null, tone: (mg?.tone as Tone) ?? "neutral",
      hint: "融資增加代表散戶加槓桿，市場偏多但風險較高",
      accentClass: "from-blue-400/30 to-cyan-400/30",
      loading: load.margin,
    },
    {
      label: "券資比", sublabel: "空方 vs 多方強度",
      value: sr?.value != null ? String(sr.value) : "—",
      unit: sr?.unit, badge: sr?.label ?? null, tone: (sr?.tone as Tone) ?? "neutral",
      hint: "高券資比 = 空頭較強，低券資比 = 多頭佔優",
      accentClass: "from-amber-400/30 to-yellow-400/30",
      loading: load.shortRatio,
    },
    {
      label: "外資買賣超", sublabel: "法人動向",
      value: fn?.value != null ? String(Math.abs(fn.value)) : "—",
      unit: fn?.unit, badge: fn?.label ?? null, tone: (fn?.tone as Tone) ?? "neutral",
      hint: "外資淨買超代表法人看多台股",
      accentClass: "from-emerald-400/30 to-teal-400/30",
      loading: load.foreignNet,
    },
    {
      label: "大盤成交量", sublabel: "今日 vs 20日均量",
      value: vol?.ratio != null ? `${vol.ratio}x` : "—",
      badge: vol?.label ?? null, tone: (vol?.tone as Tone) ?? "neutral",
      hint: "高於均量代表市場活躍，低於均量代表觀望清淡",
      accentClass: "from-indigo-400/30 to-violet-400/30",
      loading: load.volume,
    },
    {
      label: "散戶多空比", sublabel: "小台指期貨留倉",
      value: rr?.value != null ? String(rr.value) : "—",
      unit: rr?.unit,
      badge: rr?.label ?? null, tone: (rr?.tone as Tone) ?? "neutral",
      hint: "依小台指期貨散戶留倉計算。散戶部位通常為市場反指標，極端值具高參考性。",
      accentClass: "from-amber-400/30 to-orange-400/30",
      loading: load.retailRatio,
    },
    {
      label: "投信買賣超", sublabel: "投信法人動向",
      value: tr?.value != null ? String(tr.value) : "—",
      unit: tr?.unit,
      badge: tr?.label ?? null, tone: (tr?.tone as Tone) ?? "neutral",
      hint: "內資與中小型本土概念股的風向球，連續買超通常伴隨波段行情。",
      accentClass: "from-rose-400/30 to-red-400/30",
      loading: load.trustNet,
    },
  ]
}

// ── Macro card builder ─────────────────────────────────────────────────────
function buildMacroCards(data: Record<string, any>, load: Record<string, boolean>): CardData[] {
  const y10  = data.us10y
  const fed  = data.fedRate
  const cpi  = data.coreCpi
  const ppi  = data.ppi
  const dxy  = data.dxy
  const unemp = data.unemployment
  return [
    // ── 上排：利率 & 美元 ────────────────────────────────────────────────
    {
      label: "美債 10 年期殖利率", sublabel: "US 10-Year Treasury",
      value: y10?.value != null ? String(y10.value) : "—",
      unit: "%",
      badge: y10?.label ?? null, tone: (y10?.tone as Tone) ?? "neutral",
      hint: "全球資產定價之錨。殖利率飆升壓制科技股等高成長資產估值，與股市呈高度負相關。",
      accentClass: "from-blue-400/30 to-indigo-400/30",
      change: y10?.change != null ? `${y10.change > 0 ? "+" : ""}${y10.change}%` : undefined,
      loading: load.us10y,
      ...prevFromChange(y10?.value, y10?.change, false, n => `${n.toFixed(3)}%`),
    },
    {
      label: "Fed 利率預期", sublabel: "3M-10Y 殖利率利差",
      value: fed?.value != null ? String(fed.value) : "—",
      unit: "%",
      badge: fed?.label ?? null, tone: (fed?.tone as Tone) ?? "neutral",
      hint: "曲線倒掛（3M > 10Y）代表市場預期聯準會降息。降息預期直接牽動全球資金流動性。",
      accentClass: "from-violet-400/30 to-purple-400/30",
      change: fed?.note ?? undefined,
      loading: load.fedRate,
      ...prevFromApi(fed?.spread, fed?.prev_spread, true, n => `利差 ${n > 0 ? "+" : ""}${n.toFixed(2)}%`, "昨日"),
    },
    {
      label: "美元指數 (DXY)", sublabel: "US Dollar Index",
      value: dxy?.value != null ? String(dxy.value) : "—",
      badge: dxy?.label ?? null, tone: (dxy?.tone as Tone) ?? "neutral",
      hint: "全球資金流動性晴雨表。美元強弱與新興市場股市（如台股外資動向）通常呈高度負相關。",
      accentClass: "from-emerald-400/30 to-teal-400/30",
      change: dxy?.change_pct != null ? `${dxy.change_pct > 0 ? "+" : ""}${dxy.change_pct}%` : undefined,
      loading: load.dxy,
      ...prevFromChange(dxy?.value, dxy?.change, false, n => n.toFixed(2)),
    },
    // ── 下排：通膨三指標 ──────────────────────────────────────────────────
    {
      label: "核心 CPI 年增率", sublabel: "Core CPI YoY",
      value: cpi?.value != null ? String(cpi.value) : "—",
      unit: "%",
      badge: cpi?.label ?? null, tone: (cpi?.tone as Tone) ?? "neutral",
      hint: "聯準會調整貨幣政策的核心通膨指標，直接牽動利息走向與美元強弱。",
      accentClass: "from-orange-400/30 to-red-400/30",
      change: cpi?.period ?? undefined,
      loading: load.coreCpi,
      ...prevFromApi(cpi?.value, cpi?.prev_value, false, n => `${n.toFixed(1)}%`),
    },
    {
      label: "PPI 終端需求年增率", sublabel: "PPI Final Demand YoY",
      value: ppi?.value != null ? String(ppi.value) : "—",
      unit: "%",
      badge: ppi?.label ?? null, tone: (ppi?.tone as Tone) ?? "neutral",
      hint: "生產者物價指數，CPI 的上游領先指標。PPI 上升通常 1-2 個月後反映到消費端。",
      accentClass: "from-rose-400/30 to-orange-400/30",
      change: ppi?.period ?? undefined,
      loading: load.ppi,
      ...prevFromApi(ppi?.value, ppi?.prev_value, false, n => `${n.toFixed(1)}%`),
    },
    {
      label: "美國失業率", sublabel: "US Unemployment Rate",
      value: unemp?.value != null ? String(unemp.value) : "—",
      unit: "%",
      badge: unemp?.label ?? null, tone: (unemp?.tone as Tone) ?? "neutral",
      hint: "評估經濟體是否陷入衰退的核心就業數據，也是聯準會權衡貨幣政策的另一大支柱。",
      accentClass: "from-sky-400/30 to-blue-400/30",
      change: unemp?.period ?? undefined,
      loading: load.unemployment,
      ...prevFromApi(unemp?.value, unemp?.prev_value, false, n => `${n.toFixed(1)}%`),
    },
  ]
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function SentimentPage() {
  const [activeTab, setActiveTab]   = useState<TabId>("macro")
  const [hoveredTab, setHoveredTab] = useState<TabId | null>(null)
  const [usData, setUsData] = useState<Record<string, any>>({})
  const [twData, setTwData] = useState<Record<string, any>>({})
  // 各卡片獨立 loading（資料到了就顯示，不用等最慢的）
  const [usLoad, setUsLoad] = useState<Record<string, boolean>>({
    sp500: true, nasdaq: true, dow: true, vix: true, breadth: true, putCall: true,
  })
  const [twLoad, setTwLoad] = useState<Record<string, boolean>>({
    margin: true, shortRatio: true, foreignNet: true, volume: true,
    trustNet: true, retailRatio: true,
  })
  const [macroData, setMacroData] = useState<Record<string, any>>({})
  const [macroLoad, setMacroLoad] = useState<Record<string, boolean>>({
    us10y: true, fedRate: true, coreCpi: true,
    dxy: true, unemployment: true, ppi: true,
  })

  const fetchOne = async (
    url: string,
    key: string,
    setter: React.Dispatch<React.SetStateAction<Record<string, any>>>,
    loadSetter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  ) => {
    const cached = readCache(url)
    if (cached) {
      setter(prev => ({ ...prev, [key]: cached }))
      loadSetter(prev => ({ ...prev, [key]: false }))
      return
    }
    try {
      const r = await fetch(`${API}${url}`)
      const d = r.ok ? await r.json() : null
      if (d) writeCache(url, d)
      setter(prev => ({ ...prev, [key]: d }))
    } catch {
      setter(prev => ({ ...prev, [key]: null }))
    } finally {
      loadSetter(prev => ({ ...prev, [key]: false }))
    }
  }

  useEffect(() => {
    fetchOne("/sentiment/us/sp500",         "sp500",     setUsData, setUsLoad)
    fetchOne("/sentiment/us/nasdaq",        "nasdaq",    setUsData, setUsLoad)
    fetchOne("/sentiment/us/dow",           "dow",       setUsData, setUsLoad)
    fetchOne("/sentiment/us/vix",            "vix",     setUsData, setUsLoad)
    fetchOne("/sentiment/us/market-breadth","breadth",  setUsData, setUsLoad)
    fetchOne("/sentiment/us/put-call-ratio","putCall",  setUsData, setUsLoad)
    fetchOne("/sentiment/tw/margin",        "margin",    setTwData, setTwLoad)
    fetchOne("/sentiment/tw/short-ratio",   "shortRatio",setTwData, setTwLoad)
    fetchOne("/sentiment/tw/foreign-net",   "foreignNet",setTwData, setTwLoad)
    fetchOne("/sentiment/tw/volume",        "volume",     setTwData, setTwLoad)
    fetchOne("/sentiment/tw/trust-net",     "trustNet",   setTwData, setTwLoad)
    fetchOne("/sentiment/tw/retail-ratio",  "retailRatio",setTwData, setTwLoad)
    fetchOne("/macro/us10y",        "us10y",       setMacroData, setMacroLoad)
    fetchOne("/macro/fed-rate",     "fedRate",     setMacroData, setMacroLoad)
    fetchOne("/macro/core-cpi",     "coreCpi",     setMacroData, setMacroLoad)
    fetchOne("/macro/dxy",          "dxy",         setMacroData, setMacroLoad)
    fetchOne("/macro/unemployment", "unemployment",setMacroData, setMacroLoad)
    fetchOne("/macro/ppi",          "ppi",         setMacroData, setMacroLoad)
  }, [])

  const usCards    = buildUsCards(usData, usLoad)
  const twCards    = buildTwCards(twData, twLoad)
  const macroCards = buildMacroCards(macroData, macroLoad)

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10 pb-16 space-y-8">

      {/* Header — 小標籤與大標題各自獨立動畫 */}
      <div>
        {/* 小標籤（獨立） */}
        <div className="overflow-hidden h-4">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "macro" ? (
              <motion.p
                key="label-macro"
                className="text-xs font-semibold uppercase tracking-widest text-teal-500"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{    opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                總體經濟
              </motion.p>
            ) : (
              <motion.p
                key="label-sentiment"
                className="text-xs font-semibold uppercase tracking-widest text-rose-500"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{    opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                總經&amp;情緒
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* 大標題（獨立） */}
        <div className="mt-1 overflow-hidden h-12">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "macro" ? (
              <motion.h1
                key="title-macro"
                className="text-4xl font-bold text-[#1E1B4B]"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{    opacity: 0, y: -16 }}
                transition={{ duration: 0.28, ease: EASE }}
              >
                宏觀市場溫度計
              </motion.h1>
            ) : (
              <motion.h1
                key="title-sentiment"
                className="text-4xl font-bold text-[#1E1B4B]"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{    opacity: 0, y: -16 }}
                transition={{ duration: 0.28, ease: EASE }}
              >
                感受市場溫度
              </motion.h1>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="inline-flex rounded-xl bg-slate-100/80 p-1 gap-0.5"
        onMouseLeave={() => setHoveredTab(null)}
      >
        {TABS.map(tab => {
          const Icon          = tab.icon
          const showIndicator = (hoveredTab ?? activeTab) === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors duration-150",
                showIndicator ? "text-[#1E1B4B]" : "text-slate-400 hover:text-slate-500"
              )}
            >
              {showIndicator && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon className="relative z-10 size-3.5" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{    opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          {activeTab === "news" ? (
            <NewsTab />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {(activeTab === "us" ? usCards : activeTab === "tw" ? twCards : macroCards).map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: i * 0.03, ease: EASE }}
                >
                  <KpiCard card={card} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  )
}
