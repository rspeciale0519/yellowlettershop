import type { SupabaseClient } from '@supabase/supabase-js'
export function artwork(_extra = false) {
  return { formatId: 'letter_8_5x11', pages: { front: [], back: [] }, orientation: 'portrait' }
}
export const quoteState = {
  design: { designId: 'local-design-draft', designJson: artwork() },
  addressValidation: { orderId: '33333333-3333-4333-8333-333333333333', deliverableRecords: 1000 },
  mailingOptions: { serviceLevel: 'full_service', mailPieceFormat: 'letter_8_5x11', includePostage: true, postageType: 'first_class_forever' },
  listData: { totalRecords: 1000, selectedListId: 'unrelated', manualRecords: [{ first_name: 'Forged' }] },
  pricing: { totalPrice: 0.01 },
}
export function quoteDatabase(_designData = artwork(), owner = 'owner', quantity = 1, status = 'completed') {
  const rows: Record<string, Record<string, unknown>> = {
    accuzip_validation_jobs: { id: '33333333-3333-4333-8333-333333333333', user_id: owner, status, deliverable_count: quantity, validated_records: [{ id: 'r1', first_name: 'Actual', is_deliverable: true, standardized_address: { address_line_1: '123 Main', city: 'Austin', state: 'TX', zip: '78701' } }] },
  }
  const calls: Array<[string, string, unknown]> = []
  const db = { from(table: string) {
    const filters: Array<[string, unknown]> = []
    const query = { select() { return query }, eq(key: string, value: unknown) { filters.push([key, value]); calls.push([table, key, value]); return query }, async maybeSingle() { return this.single() }, async single() { const row = rows[table]; return { data: row && filters.every(([key,value]) => row[key] === value) ? row : null, error: null } } }
    return query
  } } as unknown as SupabaseClient
  return { db, calls, rows }
}
