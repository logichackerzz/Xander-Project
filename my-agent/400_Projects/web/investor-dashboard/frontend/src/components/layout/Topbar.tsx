"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "自選股",     href: "/watchlist"  },
  { label: "財報分析",   href: "/financials" },
  { label: "市場情緒",   href: "/sentiment"  },
  { label: "市場行事曆", href: "/calendar"   },
]

export function Topbar() {
  const pathname = usePathname()
  const [dateLabel, setDateLabel] = useState("")

  useEffect(() => {
    setDateLabel(
      new Date().toLocaleDateString("zh-TW", {
        month: "long",
        day: "numeric",
        weekday: "short",
      })
    )
  }, [])

  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <header className="flex h-14 items-center rounded-2xl border border-white/[0.08] bg-slate-900/75 px-5 shadow-2xl shadow-black/60 backdrop-blur-xl">

        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 cursor-pointer items-center gap-2 mr-8 transition-opacity duration-200 hover:opacity-80"
        >
          <TrendingUp className="size-4 text-indigo-400" />
          <span className="text-sm font-semibold tracking-tight text-white/90">
            散戶儀表板
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex flex-1 items-center gap-0.5">
          {navItems.map(({ label, href }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "cursor-pointer rounded-lg px-3 py-1.5 text-sm transition-all duration-200",
                  isActive
                    ? "bg-white/10 font-medium text-white"
                    : "text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Date */}
        {dateLabel && (
          <span className="shrink-0 text-xs tabular-nums text-white/30">
            {dateLabel}
          </span>
        )}

      </header>
    </div>
  )
}
