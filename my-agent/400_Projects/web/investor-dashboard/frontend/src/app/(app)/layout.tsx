import { Topbar } from "@/components/layout/Topbar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Topbar />
      <main className="flex flex-1 flex-col overflow-auto pt-20">{children}</main>
    </>
  )
}
