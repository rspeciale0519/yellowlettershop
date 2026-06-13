// Client helper: persist a wizard CSV upload to the DB via /api/orders/upload-list.
//
// The order wizard's column-mapping preview only holds the first 10 rows, so on
// mapping confirmation we re-read the full File and POST every row. Returns the
// new owner-scoped mailing_list_id (or null if there was nothing to persist).
// Errors are surfaced to the caller so the UI can fall back to previewData.

import { parseCsv } from './upload-list-mapper'

export interface PersistUploadResult {
  mailingListId: string
  recordCount: number
  name: string
}

const isCsv = (file: File): boolean =>
  file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')

/**
 * Parse the full uploaded file and persist its rows to a new mailing list.
 *
 * @param file         The uploaded File (only CSV is parsed client-side today;
 *                     non-CSV returns null so the caller keeps previewData).
 * @param mappedFields YLS field key -> source column.
 * @param name         Optional list name.
 */
export async function persistUploadedList(
  file: File,
  mappedFields: Record<string, string | null>,
  name?: string
): Promise<PersistUploadResult | null> {
  if (!isCsv(file)) return null

  const text = await file.text()
  const rows = parseCsv(text)
  if (rows.length === 0) return null

  const res = await fetch('/api/orders/upload-list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mappedFields, rows }),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? 'Failed to persist uploaded list')
  }

  return (await res.json()) as PersistUploadResult
}
