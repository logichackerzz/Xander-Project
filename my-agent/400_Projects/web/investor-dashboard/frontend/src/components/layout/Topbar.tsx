"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { TrendingUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "自選股",     href: "/watchlist"  },
  { label: "財報分析",   href: "/financials" },
  { label: "市場情緒",   href: "/sentiment"  },
  { label: "市場行事曆", href: "/calendar"   },
]

// Phase 1: container 從 logo 脫出並橫向展開
// Phase 2: items 從左到右逐個浮現 (stagger, delayChildren 等 container 定位)
const navVariants = {
  hidden: {
    clipPath: "inset(0 46% 0 46% round 9999px)",
    y: -6,
    opacity: 0.5,
  },
  visible: {
    clipPath: "inset(0 0% 0 0% round 9999px)",
    y: 6,
    opacity: 1,
    transition: {
      clipPath:      { duration: 0.40, ease: [0.22, 1, 0.36, 1] },
      y:             { duration: 0.30, ease: [0.22, 1, 0.36, 1] },
      opacity:       { duration: 0.12 },
      staggerChildren: 0.07,
      delayChildren:   0.24,
    },
  },
  exit: {
    clipPath: "inset(0 46% 0 46% round 9999px)",
    y: -4,
    opacity: 0,
    transition: { duration: 0.18, ease: "easeIn" },
  },
}

const itemVariants = {
  hidden:   { opacity: 0, y: 6,  filter: "blur(3px)" },
  visible:  { opacity: 1, y: 0,  filter: "blur(0px)",
    transition: { duration: 0.22, ease: "easeOut" } },
}

export function Topbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div
      className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="flex flex-col items-center">

        {/* Logo pill */}
        <Link
          href="/"
          className="flex h-12 items-center gap-2.5 rounded-full border border-white/[0.06] bg-slate-900 px-6 shadow-lg shadow-black/30 transition-opacity duration-200 hover:opacity-90"
        >
          <TrendingUp className="size-3.5 text-indigo-400" />
          <span className="text-sm font-semibold tracking-tight text-white/90">
            Folio
          </span>
        </Link>

        {/* Nav pill — 三段式展開 */}
        <AnimatePresence>
          {open && (
            <motion.nav
              variants={navVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex items-end gap-1 rounded-full border border-white/[0.06] bg-slate-900 px-3 py-2.5 shadow-lg shadow-black/30"
            >
              {navItems.map(({ label, href }) => {
                const isActive = pathname === href
                return (
                  <motion.div key={href} variants={itemVariants}>
                    <Link
                      href={href}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-full px-4 py-1.5 text-xs font-medium transition-colors duration-150",
                        isActive
                          ? "bg-white text-slate-900"
                          : "text-white/50 hover:text-white/80"
                      )}
                    >
                      <span className={cn(
                        "block size-1 rounded-full",
                        isActive ? "bg-slate-500" : "bg-white/25"
                      )} />
                      {label}
                    </Link>
                  </motion.div>
                )
              })}
            </motion.nav>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
