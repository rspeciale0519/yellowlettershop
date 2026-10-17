import { normalizeDesignerDocument } from '../../lib/designer/document/normalize'
import type { SupabaseClient } from '@supabase/supabase-js'
export function artwork(extra = false) {
  return normalizeDesignerDocument({ templateId: 'test', templateName: 'Test', formatId: 'letter_8_5x11', orientation: 'portrait', pages: { front: [], back: [] }, updatedAt: '2026-10-17T00:00:00Z', ...(extra ? { pageOrder: ['front', 'back'], pageSettings: { front: { printIncluded: true, sheetIndex: 0, side: 'front', paper: 'plain', regions: [] }, back: { printIncluded: true, sheetIndex: 0, side: 'back', paper: 'plain', regions: [] } } } : {}) })
}
export const quoteState = { design: { designId: 'design-a' }, addressValidation: { orderId: 'job-a', deliverableRecords: 1000 }, mailingOptions: { serviceLevel: 'full_service', mailPieceFormat: 'letter_8_5x11' }, listData: { totalRecords: 1000, selectedListId: 'unrelated', manualRecords: Array(1000).fill({ first_name: 'Forged' }) }, pricing: { totalPrice: 0.01 }, sideCount: 0, additionalPrintedSideCents: 0 }
export function quoteDatabase(designData = artwork(true), owner = 'owner', quantity = 1, status = 'completed') {
  const rows: Record<string, Record<string, unknown>> = {
    saved_designs: { id: 'design-a', user_id: owner, design_data: designData, updated_at: '2026-10-17' },
    accuzip_validation_jobs: { id: 'job-a', user_id: owner, status, deliverable_count: quantity, validated_records: [{ id: 'r1', first_name: 'Actual', is_deliverable: true, standardized_address: { address_line_1: '123 Main', city: 'Austin', state: 'TX', zip: '78701' } }] },
  }
  const calls: Array<[string, string, unknown]> = []
  const db = { from(table: string) {
    const filters: Array<[string, unknown]> = []
    const query = { select() { return query }, eq(key: string, value: unknown) { filters.push([key, value]); calls.push([table, key, value]); return query }, async single() { const row = rows[table]; return { data: row && filters.every(([key,value]) => row[key] === value) ? row : null, error: null } } }
    return query
  } } as unknown as SupabaseClient
  return { db, calls, rows }
}

