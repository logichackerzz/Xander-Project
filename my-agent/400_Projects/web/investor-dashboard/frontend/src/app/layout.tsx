import type { Metadata } from "next"
import { IBM_Plex_Sans, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/lib/toast"

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
      className={`${ibmPlexSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex h-full flex-col bg-background text-foreground">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
