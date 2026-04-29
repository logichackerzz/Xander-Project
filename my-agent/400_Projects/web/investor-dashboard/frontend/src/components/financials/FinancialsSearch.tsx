"use client"

import { useState, useEffect, useRef } from "react"
import { Search, LoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const API = "http://localhost:8002/api"

interface Result {
  symbol: string
  name: string
}

interface Props {
  onSearch: (symbol: string, name: string) => void
  loading?: boolean
  compact?: boolean
}

export function FinancialsSearch({ onSearch, loading, compact }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [fetching, setFetching] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([])
      setOpen(false)
      return
    }
    const t = setTimeout(async () => {
      setFetching(true)
      try {
        const res = await fetch(
          `${API}/portfolio/search?q=${encodeURIComponent(query.trim())}&market=us&limit=8`
        )
        const data: Result[] = await res.json()
        setResults(data)
        setOpen(data.length > 0)
        setActiveIdx(-1)
      } catch {
        setResults([])
        setOpen(false)
      } finally {
        setFetching(false)
      }
    }, 150)
    return () => clearTimeout(t)
  }, [query])

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
    setOpen(false)
    setActiveIdx(-1)
    onSearch(r.symbol, r.name)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (activeIdx >= 0) {
        select(results[activeIdx])
      } else if (query.trim()) {
        setOpen(false)
        onSearch(query.trim().toUpperCase(), "")
      }
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", compact ? "max-w-sm" : "max-w-lg")}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-border bg-card/80 backdrop-blur-sm transition-all",
          compact ? "px-4 py-2.5" : "px-5 py-4",
          "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20"
        )}
      >
        {(loading || fetching)
          ? <LoaderCircle className={cn("shrink-0 animate-spin text-muted-foreground", compact ? "size-4" : "size-5")} />
          : <Search className={cn("shrink-0 text-muted-foreground/60", compact ? "size-4" : "size-5")} />
        }
        <input
          value={query}
          onChange={e => setQuery(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder={compact ? "換一支股票…" : "輸入股票代碼，例如 AAPL、TSLA、MSFT"}
          className={cn(
            "flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none",
            compact ? "text-sm" : "text-base"
          )}
        />
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-2xl">
          {results.map((r, i) => (
            <li
              key={r.symbol}
              onMouseDown={() => select(r)}
              className={cn(
                "flex cursor-pointer items-center gap-3 px-4 py-3 text-sm transition-colors",
                i === activeIdx ? "bg-muted" : "hover:bg-muted/50",
                i < results.length - 1 && "border-b border-border/20"
              )}
            >
              <span className="w-16 shrink-0 font-mono font-semibold">{r.symbol}</span>
              <span className="truncate text-muted-foreground">{r.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
