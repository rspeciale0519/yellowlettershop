"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Search } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import type { RecipientDTO } from "@/components/designer/preview/recipient-dto"

interface ListItem {
  id: string
  name: string
}

// Reads the Phase 0 server route (which isolates the broken mailing-list lib
// chain). Sends the Supabase bearer token like page.tsx saveDesign does.
export function RecipientPicker({
  onSelect,
}: {
  onSelect: (recipient: RecipientDTO | null) => void
}) {
  const supabase = useMemo(() => createClient(), [])
  const [lists, setLists] = useState<ListItem[]>([])
  const [listId, setListId] = useState<string>("")
  const [records, setRecords] = useState<RecipientDTO[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authedFetch = useCallback(
    async (qs: string) => {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const res = await fetch(`/api/designer/recipients?${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error((await res.json())?.error ?? "Request failed")
      return res.json()
    },
    [supabase],
  )

  useEffect(() => {
    authedFetch("kind=lists")
      .then((d: { lists: ListItem[] }) => {
        setLists(d.lists)
        if (d.lists[0]) setListId(d.lists[0].id)
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load lists"))
  }, [authedFetch])

  useEffect(() => {
    if (!listId) return
    setLoading(true)
    setError(null)
    authedFetch(`kind=records&listId=${encodeURIComponent(listId)}&search=${encodeURIComponent(search)}&limit=25`)
      .then((d: { records: RecipientDTO[] }) => {
        setRecords(d.records)
        onSelect(d.records[0] ?? null)
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load records"))
      .finally(() => setLoading(false))
  }, [authedFetch, listId, search, onSelect])

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Mailing list</label>
        {lists.length === 0 ? (
          <p className="mt-1 text-sm text-slate-400">No saved lists yet.</p>
        ) : (
          <select
            className="mt-1 h-9 w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 text-sm text-white"
            value={listId}
            onChange={(e) => setListId(e.target.value)}
          >
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          className="h-9 w-full rounded-md border border-slate-700 bg-slate-950/70 pl-8 pr-2 text-sm text-white placeholder:text-slate-500"
          placeholder="Search recipients"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center gap-2 p-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {!loading &&
          records.map((r) => (
            <button
              key={r.id}
              type="button"
              className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-left text-sm text-slate-200 hover:border-yellow-400 hover:text-yellow-200"
              onClick={() => onSelect(r)}
            >
              <span className="block font-medium">
                {r.firstName} {r.lastName}
              </span>
              <span className="block text-xs text-slate-400">
                {r.addressLine1}
                {r.city ? `, ${r.city}` : ""} {r.state} {r.zipCode}
              </span>
            </button>
          ))}
        {!loading && records.length === 0 && !error && (
          <p className="p-2 text-sm text-slate-400">No recipients found.</p>
        )}
      </div>
    </div>
  )
}
