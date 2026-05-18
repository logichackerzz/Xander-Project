const TTL = 2 * 60 * 1000  // 2 分鐘，對齊後端快取週期

export function readCache<T>(path: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(`folio:${path}`)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > TTL) return null
    return data as T
  } catch { return null }
}

export function writeCache(path: string, data: unknown): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(`folio:${path}`, JSON.stringify({ data, ts: Date.now() }))
  } catch {}
}
