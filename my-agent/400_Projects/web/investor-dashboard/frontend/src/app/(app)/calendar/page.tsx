"use client"

import { useState, useEffect } from "react"
import { CalendarView, CalEvent } from "@/components/calendar/CalendarView"

const API = "http://localhost:8000/api"

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API}/calendar/events?year=${year}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setEvents(json.events ?? [])
      } catch {
        setError("無法連接後端，請確認 uvicorn 已啟動（port 8002）")
        setEvents([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [year])

  return (
    <>
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        <CalendarView
          events={events}
          loading={loading}
          year={year}
          month={month}
          onYearChange={setYear}
          onMonthChange={setMonth}
        />
      </div>
    </>
  )
}
