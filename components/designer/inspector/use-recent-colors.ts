"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "yls.designer.recentColors"
const MAX_RECENT = 8

/** Pure MRU ring buffer (unit-tested). Case-insensitive dedupe, newest first. */
export function pushRecentColor(list: string[], color: string, max = MAX_RECENT): string[] {
  const next = color.trim()
  if (!next) return list
  const lower = next.toLowerCase()
  const deduped = list.filter((c) => c.toLowerCase() !== lower)
  return [next, ...deduped].slice(0, max)
}

export function useRecentColors() {
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setRecent(JSON.parse(raw) as string[])
    } catch {
      /* ignore corrupt storage */
    }
  }, [])

  const addRecentColor = useCallback((color: string) => {
    setRecent((current) => {
      const next = pushRecentColor(current, color)
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore quota/availability errors */
      }
      return next
    })
  }, [])

  return { recent, addRecentColor }
}
