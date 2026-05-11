"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const navItems = [
  {
    label: "自選股",     href: "/watchlist",  expandW: 112,
    bg: "bg-sky-500/18",     border: "border-sky-300/40",
    dot: "bg-sky-500",       text: "text-sky-900",
  },
  {
    label: "財報分析",   href: "/financials", expandW: 124,
    bg: "bg-indigo-500/18",  border: "border-indigo-300/40",
    dot: "bg-indigo-500",    text: "text-indigo-900",
  },
  {
    label: "市場情緒",   href: "/sentiment",  expandW: 124,
    bg: "bg-emerald-500/18", border: "border-emerald-300/40",
    dot: "bg-emerald-500",   text: "text-emerald-900",
  },
  {
    label: "市場行事曆", href: "/calendar",   expandW: 148,
    bg: "bg-amber-500/18",   border: "border-amber-300/40",
    dot: "bg-amber-500",     text: "text-amber-900",
  },
]

const EASE = [0.22, 1, 0.36, 1] as const

export function Topbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col items-end gap-2">

      {/* 全部在同一個 hover 群組內 */}
      <div
        className="flex flex-col items-end gap-1.5"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {/* Logo */}
        <motion.div
          className="rounded-full overflow-hidden
            bg-indigo-500/18 backdrop-blur-2xl border border-indigo-300/40
            shadow-[0_8px_32px_rgba(99,102,241,0.18)]"
          style={{ height: 36 }}
          animate={{ width: open ? 110 : 36 }}
          transition={{ duration: 0.38, ease: EASE }}
        >
          <Link href="/" className="flex h-full w-full items-center">
            <motion.span
              className="flex-1 pl-4 text-sm font-semibold tracking-tight text-indigo-900 whitespace-nowrap select-none"
              animate={{ opacity: open ? 1 : 0 }}
              transition={{ duration: 0.18, delay: open ? 0.16 : 0 }}
            >
              Folio
            </motion.span>
            <span className="flex size-9 shrink-0 items-center justify-center">
              <TrendingUp className="size-3.5 text-indigo-500" />
            </span>
          </Link>
        </motion.div>

        {navItems.map(({ label, href, expandW, bg, border, dot, text }) => {
          const isActive = pathname === href
          return (
            <motion.div
              key={href}
              className={cn(
                "rounded-full overflow-hidden backdrop-blur-2xl",
                bg, border,
                isActive && "ring-1 ring-inset ring-white/30"
              )}
              style={{ height: 36 }}
              animate={{ width: open ? expandW : 36 }}
              transition={{ duration: 0.38, ease: EASE }}
            >
              <Link href={href} className="flex h-full w-full items-center">
                <motion.span
                  className={cn(
                    "flex-1 pl-4 text-xs font-semibold whitespace-nowrap select-none",
                    text
                  )}
                  animate={{ opacity: open ? 1 : 0 }}
                  transition={{ duration: 0.18, delay: open ? 0.16 : 0 }}
                >
                  {label}
                </motion.span>
                <span className="flex size-9 shrink-0 items-center justify-center">
                  <span className={cn(
                    "rounded-full transition-all duration-300",
                    isActive ? cn("size-2.5", dot) : cn("size-2", dot, "opacity-50")
                  )} />
                </span>
              </Link>
            </motion.div>
          )
        })}
      </div>

    </div>
  )
}
