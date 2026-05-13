"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Topbar } from "@/components/layout/Topbar"

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname()
  const isOverview = pathname === "/"
  const [mainEl, setMainEl] = useState<HTMLElement | null>(null)

  const showTopbar = !isOverview

  return (
    <div className="relative flex min-h-full flex-col bg-[#F4F3FF]">

      {/* ── Aurora blobs（fixed，不設 overflow-hidden 讓 blur 正常擴散） ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[640px] w-[640px] rounded-full blur-3xl"
          style={{ animation: "blob-float-1 11s ease-in-out infinite, color-indigo 7s ease-in-out infinite", willChange: "transform, background-color" }} />
        <div className="absolute -top-24 -right-48 h-[580px] w-[580px] rounded-full blur-3xl"
          style={{ animation: "blob-float-2 14s ease-in-out infinite, color-cyan 9s ease-in-out infinite", willChange: "transform, background-color" }} />
        <div className="absolute bottom-0 -left-24 h-[540px] w-[540px] rounded-full blur-3xl"
          style={{ animation: "blob-float-3 12s ease-in-out infinite, color-violet 8s ease-in-out infinite", willChange: "transform, background-color" }} />
        <div className="absolute bottom-16 right-1/4 h-[560px] w-[560px] rounded-full blur-3xl"
          style={{ animation: "blob-float-4 15s ease-in-out infinite, color-orange 11s ease-in-out infinite", willChange: "transform, background-color" }} />
      </div>

      {/* Topbar — z-50，確保在 main（z-10）上方 */}
      <div
        className="relative z-50"
        style={{
          opacity: showTopbar ? 1 : 0,
          pointerEvents: showTopbar ? "auto" : "none",
          transition: "opacity 400ms ease-in-out",
        }}
      >
        <Topbar />
      </div>

      {/* Main — z-10，直接 flex-1，不加額外 wrapper */}
      <main
        ref={setMainEl}
        className="relative z-10 flex flex-1 flex-col overflow-auto"
        style={{
          paddingTop: isOverview ? "0px" : "24px",
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
