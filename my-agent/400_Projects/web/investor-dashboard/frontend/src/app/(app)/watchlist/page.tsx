"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { Dialog } from "@base-ui/react/dialog"
import { StockSearchInput } from "@/components/portfolio/StockSearchInput"
import { useToast } from "@/lib/toast"
import { TrendingUp, TrendingDown, Trash2, Star, X, FileBarChart2, LineChart } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragOverlay, type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { API_BASE } from "@/lib/api"

const ORDER_KEY = "watchlist-order"
function saveOrder(symbols: string[]) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(symbols))
}
function applyOrder<T extends { symbol: string }>(items: T[]): T[] {
  try {
    const saved: string[] = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]")
    if (!saved.length) return items
    return [...items].sort((a, b) => {
      const ai = saved.indexOf(a.symbol), bi = saved.indexOf(b.symbol)
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  } catch { return items }
}

const API = API_BASE

const MARKET_LABEL: Record<string, string> = { tw: "台股", us: "美股", crypto: "加密" }

const SPRING = { type: "spring", stiffness: 180, damping: 22 } as const

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: SPRING },
}

const gridVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06, delayChildren: 0.22 } },
}

type WatchlistItem = {
  symbol: string
  name: string
  market: string
  price: number | null
  change_pct: number | null
  recommendation: string | null
}

const REC_STYLE: Record<string, string> = {
  "強力買入": "bg-emerald-50 text-emerald-600 border-emerald-200/60",
  "買入":     "bg-emerald-50/60 text-emerald-500 border-emerald-200/40",
  "持有":     "bg-amber-50 text-amber-600 border-amber-200/60",
  "賣出":     "bg-red-50/60 text-red-400 border-red-200/40",
  "強力賣出": "bg-red-50 text-red-500 border-red-200/60",
}

type SearchMarket = "us" | "tw"

function detectMarket(symbol: string): "tw" | "us" {
  return /^\d{4,6}$/.test(symbol) ? "tw" : "us"
}

function fmtPrice(v: number | null, market?: string) {
  if (v == null) return "—"
  if (market === "tw") return v.toLocaleString("zh-TW", { maximumFractionDigits: 2 })
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const CARD = "rounded-2xl bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_4px_24px_rgba(99,102,241,0.10)]"

function MagneticCard({ children, className, variants }: {
  children: React.ReactNode
  className?: string
  variants?: any
}) {
  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  )
}


function SortableCard({ id, isDragging, children }: {
  id: string
  isDragging: boolean
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 300, damping: 22 })
  const sy = useSpring(my, { stiffness: 300, damping: 22 })

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        x: isDragging ? 0 : sx,
        y: isDragging ? 0 : sy,
        touchAction: "none",
        opacity: isDragging ? 0 : 1,
      }}
      onMouseMove={isDragging ? undefined : e => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left - r.width  / 2) * 0.12)
        my.set((e.clientY - r.top  - r.height / 2) * 0.12)
      }}
      onMouseLeave={isDragging ? undefined : () => { mx.set(0); my.set(0) }}
    >
      {children}
    </motion.div>
  )
}

function MarketToggle({
  value, onChange,
}: { value: SearchMarket; onChange: (m: SearchMarket) => void }) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 400, damping: 25 })
  const sy = useSpring(my, { stiffness: 400, damping: 25 })

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left - r.width  / 2) * 0.25)
    my.set((e.clientY - r.top  - r.height / 2) * 0.25)
  }
  const handleLeave = () => { mx.set(0); my.set(0) }

  return (
    <motion.div
      className="relative flex shrink-0 cursor-pointer rounded-full border border-indigo-200/60 bg-slate-100/70 p-[3px]"
      style={{ x: sx, y: sy }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {(["us", "tw"] as SearchMarket[]).map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className="relative z-10 px-3 py-1 text-xs font-semibold select-none transition-colors duration-150"
          style={{ color: value === m ? "#fff" : "#94a3b8" }}
        >
          {m === "us" ? "美股" : "台股"}
        </button>
      ))}
      <motion.div
        className="absolute top-[3px] left-[3px] h-[calc(100%-6px)] w-[calc(50%-3px)] rounded-full bg-indigo-500 shadow-sm"
        animate={{ x: value === "us" ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    </motion.div>
  )
}

export default function WatchlistPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [items, setItems]             = useState<WatchlistItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState("")
  const [searchMarket, setSearchMarket] = useState<SearchMarket>("us")
  const [searchQuery, setSearchQuery] = useState("")

  // 自動偵測市場：輸入時防呆切換
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) return
    const isTw = /^\d{1,6}$/.test(q) || /[一-鿿]/.test(q)
    const isUs = /^[A-Za-z]{2,}$/.test(q)
    if (isTw && searchMarket !== "tw") setSearchMarket("tw")
    else if (isUs && searchMarket !== "us") setSearchMarket("us")
  }, [searchQuery])
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WatchlistItem | null>(null)
  const [activeId, setActiveId]         = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 6 },
  }))

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over || active.id === over.id) return
    setItems(prev => {
      const oldIdx = prev.findIndex(i => i.symbol === active.id)
      const newIdx = prev.findIndex(i => i.symbol === over.id)
      const next = arrayMove(prev, oldIdx, newIdx)
      saveOrder(next.map(i => i.symbol))
      return next
    })
  }

  const fetchWatchlist = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API}/watchlist`)
      if (!res.ok) throw new Error("API error")
      setItems(applyOrder(await res.json()))
    } catch {
      setError("無法連線到後端，請確認 FastAPI 是否已啟動")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWatchlist() }, [fetchWatchlist])

  const handleSelect = async (symbol: string, name: string) => {
    setSearchQuery("")
    const alreadyIn = items.some(i => i.symbol === symbol)
    if (alreadyIn) { toast(`${symbol} 已在追蹤清單中`); return }
    setAddingSymbol(symbol)
    try {
      await fetch(`${API}/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, name, market: detectMarket(symbol) }),
      })
      await fetchWatchlist()
      toast(`已加入 ${name || symbol}`)
    } finally {
      setAddingSymbol(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await fetch(`${API}/watchlist/${deleteTarget.symbol}`, { method: "DELETE" })
    setItems(prev => prev.filter(i => i.symbol !== deleteTarget.symbol))
    toast(`已移除 ${deleteTarget.name || deleteTarget.symbol}`, "error")
    setDeleteTarget(null)
  }

  return (
    <>
      <div className="relative py-10 pb-16">
        <div className="mx-auto max-w-5xl px-8">

          {/* Header */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
              自選股
            </p>
            <h1 className="mt-1 text-4xl font-bold text-[#1E1B4B]">標的追蹤</h1>
          </div>

          {/* 搜尋區 */}
          <div className={cn(CARD, "relative z-20 mb-6 p-5")}>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-indigo-500">
              加入標的
            </p>
            <div className="flex items-center gap-3">
              <MarketToggle
                value={searchMarket}
                onChange={m => { setSearchMarket(m); setSearchQuery("") }}
              />
              <div className="flex-1">
                <StockSearchInput
                  market={searchMarket}
                  value={searchQuery}
                  placeholder={searchMarket === "us" ? "輸入代碼或公司名稱（如 AAPL）" : "輸入代號或公司名稱（如 2330、台積電）"}
                  onChange={setSearchQuery}
                  onSelect={handleSelect}
                  disabled={!!addingSymbol}
                />
              </div>
            </div>
            {addingSymbol && (
              <p className="mt-2 animate-pulse text-xs text-indigo-400">
                正在加入 {addingSymbol}…
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-300/40 bg-red-50/80 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map(i => (
                <div key={i} className={cn(CARD, "animate-pulse p-5")}>
                  <div className="mb-3 h-2.5 w-14 rounded bg-indigo-100" />
                  <div className="mb-2 h-4 w-20 rounded bg-slate-200" />
                  <div className="mt-4 h-7 w-28 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          )}

          {/* 空狀態 */}
          {!loading && items.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-indigo-300/40 py-16 text-center">
              <Star className="size-9 text-indigo-300/60" />
              <p className="text-sm text-slate-400">
                搜尋股票代碼或名稱，加入追蹤清單
              </p>
            </div>
          )}

          {/* 股票卡片 grid */}
          {!loading && items.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={e => setActiveId(String(e.active.id))}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveId(null)}
            >
              <SortableContext items={items.map(i => i.symbol)} strategy={rectSortingStrategy}>
                <motion.div
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  variants={gridVariants}
                  initial="hidden"
                  animate="show"
                >
                  {items.map(item => {
                    const dragging = activeId === item.symbol
                    const up = item.change_pct !== null && item.change_pct >= 0
                    return (
                      <SortableCard key={item.symbol} id={item.symbol} isDragging={dragging}>
                          <MagneticCard
                            className={cn(
                              CARD, "overflow-hidden transition-shadow duration-200",
                              "hover:shadow-[0_8px_32px_rgba(99,102,241,0.18)]"
                            )}
                          >
                            <div className="p-5">
                              <div className="mb-4 flex items-center justify-between">
                                <span className="rounded-full border border-indigo-200/60 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold tracking-widest text-indigo-500 uppercase">
                                  {MARKET_LABEL[item.market] ?? item.market}
                                </span>
                                <button
                                  onClick={e => { e.stopPropagation(); setDeleteTarget(item) }}
                                  className="cursor-pointer rounded-lg p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-400"
                                  title="移除"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>

                              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{item.symbol}</p>
                              <div className="mt-0.5 flex items-center gap-2">
                                <p className="truncate text-base font-semibold text-[#1E1B4B]">{item.name}</p>
                                {item.recommendation && (
                                  <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                    REC_STYLE[item.recommendation] ?? "bg-slate-50 text-slate-400 border-slate-200/60")}>
                                    {item.recommendation}
                                  </span>
                                )}
                              </div>

                              <div className="mt-4 flex items-end justify-between">
                                <p className="text-2xl font-bold tabular-nums text-[#1E1B4B]">
                                  {fmtPrice(item.price, item.market)}
                                </p>
                                {item.change_pct !== null ? (
                                  <div className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold",
                                    up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>
                                    {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                                    <span>{up ? "+" : ""}{item.change_pct.toFixed(2)}%</span>
                                  </div>
                                ) : <span className="text-xs text-slate-300">—</span>}
                              </div>
                            </div>

                            <div className="flex border-t border-slate-100/60">
                              <button
                                onClick={() => router.push(`/financials?ticker=${item.symbol}`)}
                                className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold text-slate-400 transition-colors hover:bg-indigo-50/70 hover:text-indigo-500"
                              >
                                <FileBarChart2 className="size-3.5" />財報分析
                              </button>
                              <div className="w-px bg-slate-100/60" />
                              <button
                                onClick={() => router.push(`/chart?ticker=${item.symbol}`)}
                                className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold text-slate-400 transition-colors hover:bg-teal-50/70 hover:text-teal-500"
                              >
                                <LineChart className="size-3.5" />K 線盤
                              </button>
                            </div>
                          </MagneticCard>
                      </SortableCard>
                    )
                  })}
                </motion.div>
              </SortableContext>

              {/* 拖曳中的浮動卡片副本 */}
              <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18,0.67,0.6,1.22)" }}>
                {activeId && (() => {
                  const item = items.find(i => i.symbol === activeId)
                  if (!item) return null
                  const up = item.change_pct !== null && item.change_pct >= 0
                  return (
                    <div className={cn(CARD, "overflow-hidden rotate-[1.5deg] scale-[1.04] shadow-[0_20px_60px_rgba(99,102,241,0.30)]")}>
                      <div className="p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <span className="rounded-full border border-indigo-200/60 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold tracking-widest text-indigo-500 uppercase">
                            {MARKET_LABEL[item.market] ?? item.market}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{item.symbol}</p>
                        <p className="mt-0.5 truncate text-base font-semibold text-[#1E1B4B]">{item.name}</p>
                        <div className="mt-4 flex items-end justify-between">
                          <p className="text-2xl font-bold tabular-nums text-[#1E1B4B]">
                            {fmtPrice(item.price, item.market)}
                          </p>
                          {item.change_pct !== null && (
                            <div className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold",
                              up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>
                              {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                              {up ? "+" : ""}{item.change_pct.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </DragOverlay>
            </DndContext>
          )}

        </div>
      </div>

      <Dialog.Root open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-indigo-950/20 backdrop-blur-sm" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/60 bg-white/90 backdrop-blur-md p-6 shadow-2xl">
            <div className="mb-1 flex items-start justify-between">
              <Dialog.Title className="text-base font-semibold text-[#1E1B4B]">移除追蹤標的</Dialog.Title>
              <Dialog.Close className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                <X className="size-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mb-5 text-sm text-slate-500">
              確定要將{" "}
              <span className="font-semibold text-[#1E1B4B]">
                {deleteTarget?.name || deleteTarget?.symbol}
              </span>{" "}
              從追蹤清單移除嗎？
            </Dialog.Description>
            <div className="flex gap-2">
              <Dialog.Close className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
                取消
              </Dialog.Close>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                確定移除
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
