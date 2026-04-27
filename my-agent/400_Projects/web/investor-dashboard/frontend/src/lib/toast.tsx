"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { CheckCircle2, XCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error"

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: () => void }) {
  const [phase, setPhase] = useState<"in" | "show" | "out">("in")

  useEffect(() => {
    const ids = [
      setTimeout(() => setPhase("show"), 16),
      setTimeout(() => setPhase("out"), 2700),
      setTimeout(onDismiss, 3000),
    ]
    return () => ids.forEach(clearTimeout)
  }, [onDismiss])

  const ok = t.type === "success"
  const Icon = ok ? CheckCircle2 : XCircle

  return (
    <div
      className={cn(
        "flex w-72 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xl",
        "transition-all duration-300 ease-out",
        ok ? "border-l-[3px] border-l-emerald-500" : "border-l-[3px] border-l-red-500",
        phase === "in"   && "translate-x-4 opacity-0",
        phase === "show" && "translate-x-0 opacity-100",
        phase === "out"  && "translate-x-4 opacity-0",
      )}
    >
      <Icon className={cn("size-4 shrink-0", ok ? "text-emerald-400" : "text-red-400")} />
      <p className="flex-1 text-sm leading-snug">{t.message}</p>
      <button
        onClick={() => { setPhase("out"); setTimeout(onDismiss, 300) }}
        className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map(t => (
          <ToastItem key={t.id} t={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
