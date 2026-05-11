"use client"

import { useState, useEffect, useRef } from "react"
import { LoaderCircle, Search } from "lucide-react"
import { cn } from "@/lib/utils"

const API = "http://localhost:8000/api"

interface Result {
  symbol: string
  name: string
}

interface Props {
  market: "tw" | "us"
  value: string
  placeholder?: string
  disabled?: boolean
  onChange: (raw: string) => void
  onSelect: (symbol: string, name: string) => void
}

export function StockSearchInput({ market, value, placeholder, disabled, onChange, onSelect }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // parent 清空或重設時同步
  useEffect(() => {
    setQuery(value)
    if (!value) {
      setResults([])
      setOpen(false)
    }
  }, [value])

  // 搜尋（輸入第 1 字就觸發）
  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([])
      setOpen(false)
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `${API}/portfolio/search?q=${encodeURIComponent(query.trim())}&market=${market}&limit=8`
        )
        const data: Result[] = await res.json()
        setResults(data)
        setOpen(data.length > 0)
        setActiveIdx(-1)
      } catch {
        setResults([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 150)
    return () => clearTimeout(t)
  }, [query, market])

  // 點外部關閉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function select(r: Result) {
    setQuery(r.symbol)
    onChange(r.symbol)
    onSelect(r.symbol, r.name)
    setOpen(false)
    setActiveIdx(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault()
      select(results[activeIdx])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        value={query}
        onChange={e => {
          const val = market === "us" ? e.target.value.toUpperCase() : e.target.value
          setQuery(val)
          onChange(val)
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (results.length > 0) setOpen(true) }}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border border-indigo-200/70 bg-white/80 px-3 py-2 pr-8 text-sm text-[#1E1B4B]",
          "placeholder:text-slate-400",
          "focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/40",
          "disabled:opacity-50",
          "transition-colors duration-200"
        )}
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
        {loading
          ? <LoaderCircle className="size-3.5 animate-spin text-indigo-400" />
          : <Search className="size-3.5 text-indigo-300" />
        }
      </span>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-[0_8px_32px_rgba(99,102,241,0.18)]">
          {results.map((r, i) => (
            <li
              key={r.symbol}
              onMouseDown={() => select(r)}
              className={cn(
                "flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-150",
                i === activeIdx ? "bg-indigo-100" : "hover:bg-indigo-50",
                i < results.length - 1 && "border-b border-slate-100"
              )}
            >
              <span className="w-14 shrink-0 font-mono font-bold tabular-nums text-indigo-700">{r.symbol}</span>
              <span className="truncate text-slate-600">{r.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
