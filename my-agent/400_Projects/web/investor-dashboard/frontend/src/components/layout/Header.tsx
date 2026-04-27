interface HeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-13 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm">
      <div>
        <h1 className="text-sm font-semibold">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  )
}
