"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Wallet, FileBarChart2, Gauge, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "總覽", href: "/", icon: LayoutDashboard },
  { label: "持倉管理", href: "/portfolio", icon: Wallet },
  { label: "財報分析", href: "/financials", icon: FileBarChart2 },
  { label: "市場情緒", href: "/sentiment", icon: Gauge },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4">
        <TrendingUp className="size-5 text-sidebar-primary" />
        <span className="text-sm font-semibold tracking-tight">散戶儀表板</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-3 text-xs text-sidebar-foreground/40">
        Week 1 · MVP 開發中
      </div>
    </aside>
  )
}
