import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/Sidebar"
import { ToastProvider } from "@/lib/toast"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "散戶投資儀表板",
  description: "多市場投資追蹤 · 財報分析 · 市場情緒",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex h-full bg-background text-foreground">
        <ToastProvider>
          <Sidebar />
          <main className="flex flex-1 flex-col overflow-auto">{children}</main>
        </ToastProvider>
      </body>
    </html>
  )
}
