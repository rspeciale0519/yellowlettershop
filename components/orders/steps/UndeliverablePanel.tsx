'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

interface UndeliverableRecord {
  id?: string
  address_line_1?: string
  city?: string
  state?: string
  zip?: string
  validation_errors?: string[] | null
}

interface UndeliverablePanelProps {
  jobId: string | null
  undeliverableCount: number
}

export function UndeliverablePanel({ jobId, undeliverableCount }: UndeliverablePanelProps) {
  const [open, setOpen] = useState(false)
  const [records, setRecords] = useState<UndeliverableRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  if (undeliverableCount === 0) return null

  const handleToggle = async () => {
    if (open) {
      setOpen(false)
      return
    }

    setOpen(true)

    if (records.length > 0 || !jobId) return

    setLoading(true)
    setFetchError(null)

    try {
      const res = await fetch(`/api/accuzip/results/${jobId}`)
      if (!res.ok) throw new Error('Failed to load records')

      const data = await res.json() as {
        records?: UndeliverableRecord[]
      }

      const allRecords: UndeliverableRecord[] = data.records ?? []
      const undeliverable = allRecords.filter(r => {
        const errors = r.validation_errors
        return Array.isArray(errors) ? errors.length > 0 : false
      })
      setRecords(undeliverable)
    } catch {
      setFetchError('Could not load undeliverable address details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-md border-destructive/30">
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between p-4 text-destructive hover:text-destructive"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            {undeliverableCount} undeliverable address{undeliverableCount > 1 ? 'es' : ''}
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {open && (
        <div className="border-t">
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading details...
            </p>
          )}

          {fetchError && (
            <p className="text-sm text-destructive text-center py-4">{fetchError}</p>
          )}

          {!loading && !fetchError && !jobId && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {undeliverableCount} address{undeliverableCount > 1 ? 'es were' : ' was'} flagged
              as undeliverable during validation.
            </p>
          )}

          {!loading && !fetchError && jobId && records.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No detailed records available.
            </p>
          )}

          {!loading && !fetchError && records.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r, i) => (
                  <TableRow key={r.id ?? i}>
                    <TableCell className="text-sm">
                      {[r.address_line_1, r.city, r.state, r.zip]
                        .filter(Boolean)
                        .join(', ')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.validation_errors?.join(', ') ?? 'Undeliverable'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  )
}
