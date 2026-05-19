"use client"

import { useEffect, useRef, useState } from "react"

// Typed save status — replaces the fragile string-keyed autosave in page.tsx
// (autosave used to trigger on `statusMessage === "Unsaved changes"`).
export type SaveStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "local-only"
  | "error"
  | "recovered"

/** Pure status → human label (unit-tested). */
export function saveStatusLabel(status: SaveStatus, at?: string): string {
  switch (status) {
    case "idle":
      return "Draft not saved"
    case "dirty":
      return "Unsaved changes"
    case "saving":
      return "Saving…"
    case "saved":
      return at ? `Saved ${at}` : "Saved"
    case "local-only":
      return "Saved locally; sign in to sync"
    case "error":
      return "Saved locally; server save failed"
    case "recovered":
      return at ? `Recovered ${at}` : "Recovered"
    default:
      return ""
  }
}

export interface DesignerAutosave {
  status: SaveStatus
  label: string
  setIdle: () => void
  setDirty: () => void
  setSaving: () => void
  setSaved: (at: string) => void
  setLocalOnly: () => void
  setError: () => void
  setRecovered: (at: string) => void
}

/**
 * Owns save status + the debounced autosave effect. Behavior-equivalent to the
 * old page.tsx logic: ~3s after the doc becomes `dirty` (and the editor is
 * enabled), `onSave` runs. A ref keeps `onSave` current without re-arming the
 * timer every render.
 */
export function useDesignerAutosave(options: {
  enabled: boolean
  onSave: () => void | Promise<void>
}): DesignerAutosave {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const [at, setAt] = useState<string | undefined>(undefined)

  const onSaveRef = useRef(options.onSave)
  useEffect(() => {
    onSaveRef.current = options.onSave
  })

  useEffect(() => {
    if (!options.enabled || status !== "dirty") return
    const timeout = window.setTimeout(() => {
      void onSaveRef.current()
    }, 3000)
    return () => window.clearTimeout(timeout)
  }, [options.enabled, status])

  return {
    status,
    label: saveStatusLabel(status, at),
    setIdle: () => {
      setAt(undefined)
      setStatus("idle")
    },
    setDirty: () => setStatus("dirty"),
    setSaving: () => setStatus("saving"),
    setSaved: (ts: string) => {
      setAt(ts)
      setStatus("saved")
    },
    setLocalOnly: () => setStatus("local-only"),
    setError: () => setStatus("error"),
    setRecovered: (ts: string) => {
      setAt(ts)
      setStatus("recovered")
    },
  }
}
