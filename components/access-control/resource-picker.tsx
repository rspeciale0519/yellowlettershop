'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Check, Info, Loader2, Search, X } from 'lucide-react'
import type { ResourceType } from '@/lib/access-control/time-based-permissions'

export const ALL_RESOURCES = '*'

export interface ResourceOption {
  id: string
  label: string
  meta?: string
}

interface ResourcePickerProps {
  resourceType: ResourceType
  teamId?: string
  value: string[]
  onChange: (ids: string[]) => void
}

const TYPE_LABELS: Record<ResourceType, { singular: string; plural: string }> = {
  mailing_list: { singular: 'Mailing List', plural: 'Mailing Lists' },
  template: { singular: 'Template', plural: 'Templates' },
  design: { singular: 'Design', plural: 'Designs' },
  contact_card: { singular: 'Contact Card', plural: 'Contact Cards' },
  asset: { singular: 'Asset', plural: 'Assets' }
}

async function fetchResources(
  resourceType: ResourceType,
  teamId: string,
  opts: { q?: string; ids?: string }
): Promise<ResourceOption[]> {
  const params = new URLSearchParams({ type: resourceType, team_id: teamId })
  if (opts.ids) params.set('ids', opts.ids)
  else if (opts.q) params.set('q', opts.q)
  const res = await fetch(`/api/access-control/resources?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to load resources')
  const json = await res.json()
  return (json.resources ?? []) as ResourceOption[]
}

export default function ResourcePicker({ resourceType, teamId, value, onChange }: ResourcePickerProps) {
  const labels = TYPE_LABELS[resourceType]
  const isAll = value.length === 1 && value[0] === ALL_RESOURCES
  const selectedIds = value.filter(id => id !== ALL_RESOURCES)

  const [scope, setScope] = useState<'all' | 'specific'>(isAll || value.length === 0 ? 'all' : 'specific')
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<ResourceOption[]>([])
  const [labelMap, setLabelMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Keep scope in sync when the parent swaps resource_type (value resets upstream).
  useEffect(() => {
    setScope(value.length === 1 && value[0] === ALL_RESOURCES ? 'all' : value.length === 0 ? 'all' : 'specific')
    setSearch('')
    setOptions([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceType])

  const rememberLabels = useCallback((opts: ResourceOption[]) => {
    if (opts.length === 0) return
    setLabelMap(prev => {
      const next = { ...prev }
      for (const o of opts) next[o.id] = o.label
      return next
    })
  }, [])

  // Resolve names for already-selected ids (edit mode) so chips show labels, not UUIDs.
  useEffect(() => {
    const missing = selectedIds.filter(id => !labelMap[id])
    if (!teamId || missing.length === 0) return
    let active = true
    fetchResources(resourceType, teamId, { ids: missing.join(',') })
      .then(opts => { if (active) rememberLabels(opts) })
      .catch(() => {})
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds.join(','), teamId, resourceType])

  // Debounced server-side search while in "specific" mode.
  useEffect(() => {
    if (scope !== 'specific' || !teamId) return
    let active = true
    setLoading(true)
    setError('')
    const t = setTimeout(() => {
      fetchResources(resourceType, teamId, { q: search.trim() })
        .then(opts => { if (!active) return; setOptions(opts); rememberLabels(opts) })
        .catch(() => { if (active) setError('Could not load resources') })
        .finally(() => { if (active) setLoading(false) })
    }, 250)
    return () => { active = false; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, search, teamId, resourceType])

  const handleScopeChange = (next: string) => {
    const s = next as 'all' | 'specific'
    setScope(s)
    onChange(s === 'all' ? [ALL_RESOURCES] : [])
  }

  const toggleId = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id])
  }

  return (
    <div className="space-y-3">
      {resourceType === 'template' && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Templates are shared with your whole team — this grant is informational and does not restrict access.</span>
        </div>
      )}

      <RadioGroup value={scope} onValueChange={handleScopeChange} className="space-y-1">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="all" id={`scope-all-${resourceType}`} />
          <Label htmlFor={`scope-all-${resourceType}`} className="font-normal cursor-pointer">All {labels.plural}</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="specific" id={`scope-specific-${resourceType}`} />
          <Label htmlFor={`scope-specific-${resourceType}`} className="font-normal cursor-pointer">Specific {labels.plural.toLowerCase()}…</Label>
        </div>
      </RadioGroup>

      {scope === 'specific' && (
        <div className="space-y-2">
          {!teamId ? (
            <p className="text-xs text-muted-foreground">Select a team to choose specific {labels.plural.toLowerCase()}.</p>
          ) : (
            <>
              {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedIds.map(id => (
                    <Badge key={id} variant="secondary" className="gap-1">
                      <span className="max-w-[160px] truncate">{labelMap[id] ?? 'Loading…'}</span>
                      <button type="button" onClick={() => toggleId(id)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="rounded-md border">
                <div className="flex items-center border-b px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={`Search ${labels.plural.toLowerCase()}…`}
                    className="h-9 border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="max-h-[220px] overflow-y-auto p-1">
                  {loading ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                    </div>
                  ) : error ? (
                    <div className="py-6 text-center text-sm text-destructive">{error}</div>
                  ) : options.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">No {labels.plural.toLowerCase()} found.</div>
                  ) : (
                    options.map(opt => {
                      const checked = selectedIds.includes(opt.id)
                      return (
                        <div
                          key={opt.id}
                          role="option"
                          aria-selected={checked}
                          tabIndex={0}
                          onClick={() => toggleId(opt.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              toggleId(opt.id)
                            }
                          }}
                          className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                        >
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}>
                            {checked && <Check className="h-3 w-3" />}
                          </span>
                          <span className="flex-1 truncate">{opt.label}</span>
                          {opt.meta && <span className="text-xs text-muted-foreground">{opt.meta}</span>}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
              {selectedIds.length > 0 && (
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{selectedIds.length} selected</Badge>
                  <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>Clear</Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
