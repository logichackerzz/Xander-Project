export default function OverviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col overflow-auto bg-gradient-to-b from-[#F5F3FF] to-[#EEF2FF] min-h-full">
      {children}
    </main>
  )
}
