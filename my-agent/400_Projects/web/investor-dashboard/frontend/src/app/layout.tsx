import type { Metadata } from "next"
import { IBM_Plex_Sans, Geist_Mono, Dancing_Script, Lora, Space_Grotesk, Urbanist, Syne, Patrick_Hand, Kalam } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/lib/toast"
import { LayoutShell } from "@/components/layout/LayoutShell"

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["700"],
})

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["700", "800"],
})

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
})

const patrickHand = Patrick_Hand({
  variable: "--font-patrick-hand",
  subsets: ["latin"],
  weight: ["400"],
})

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["700"],
})

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
})

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
  weight: ["700"],
})

export const metadata: Metadata = {
  title: "Folio",
  description: "Markets, made readable.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${ibmPlexSans.variable} ${geistMono.variable} ${dancingScript.variable} ${lora.variable} ${spaceGrotesk.variable} ${urbanist.variable} ${syne.variable} ${patrickHand.variable} ${kalam.variable} dark h-full antialiased`}
    >
      <body className="flex h-full flex-col bg-background text-foreground">
        <ToastProvider>
          <LayoutShell>{children}</LayoutShell>
        </ToastProvider>
      </body>
    </html>
  )
}
