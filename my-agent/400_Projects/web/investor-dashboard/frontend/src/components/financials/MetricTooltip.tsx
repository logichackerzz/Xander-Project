export function MetricTooltip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-block align-middle">
      <span className="cursor-help select-none text-[10px] text-muted-foreground/40 transition-colors group-hover:text-muted-foreground">
        ⓘ
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 rounded-xl border border-border bg-popover px-3 py-2 text-xs leading-relaxed text-muted-foreground opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
        {text}
      </span>
    </span>
  )
}
