"use client"

import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Topbar } from "@/components/layout/Topbar"

const PAGE_BG: Record<string, string> = {
  "/":           "linear-gradient(to bottom, #F5F3FF, #EEF2FF)",
  "/watchlist":  "linear-gradient(to bottom, #E8E3FF, #DDE3FF)",
  "/financials": "linear-gradient(to bottom, #E8E3FF, #DDE3FF)",
}

const DEFAULT_BG = "#ffffff"

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isOverview = pathname === "/"
  const bg = PAGE_BG[pathname] ?? DEFAULT_BG

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: bg, transition: "background 600ms ease-in-out" }}
    >
      {/* Topbar: always mounted, invisible on overview */}
      <div
        style={{
          opacity: isOverview ? 0 : 1,
          pointerEvents: isOverview ? "none" : "auto",
          transition: "opacity 450ms ease-in-out",
        }}
      >
        <Topbar />
      </div>

      {/* Main: padding-top 0 on overview, 80px on app pages */}
      <main
        className="flex flex-1 flex-col overflow-auto"
        style={{
          paddingTop: isOverview ? "0px" : "80px",
          transition: "padding-top 450ms ease-in-out",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            className="flex flex-1 flex-col"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
