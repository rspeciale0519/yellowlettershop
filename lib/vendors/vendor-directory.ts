import 'server-only'
import { createServiceClient } from '@/utils/supabase/service'

/**
 * Vendor directory against the ACTUAL migrated schema.
 *
 * The `vendors` table (20260613000000) is: name, vendor_type text[],
 * contact_info jsonb, pricing_tiers jsonb, performance_metrics jsonb,
 * is_active. The legacy `lib/vendors/vendor-service.ts` writes a different,
 * older column set (user_id/type/services/pricing_model/...) through the
 * BROWSER client — and `vendors` has RLS enabled with zero policies, so those
 * writes are doubly dead. This module is the working path: service client,
 * real columns.
 *
 * Reads/writes here must stay behind an authenticated route — the service
 * client bypasses RLS by design.
 */

export interface VendorRecord {
  id: string
  name: string
  /** Primary type (first entry of vendor_type) — kept for UI compatibility. */
  type: string | null
  vendorType: string[]
  contactInfo: Record<string, unknown>
  pricingTiers: unknown
  performanceMetrics: unknown
  isActive: boolean
  /** Derived from is_active, for UI compatibility. */
  status: 'active' | 'inactive'
  createdAt: string | null
  updatedAt: string | null
}

interface VendorRow {
  id: string
  name: string
  vendor_type: string[] | null
  contact_info: Record<string, unknown> | null
  pricing_tiers: unknown
  performance_metrics: unknown
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

const COLUMNS =
  'id, name, vendor_type, contact_info, pricing_tiers, performance_metrics, is_active, created_at, updated_at'

function toRecord(row: VendorRow): VendorRecord {
  const types = row.vendor_type ?? []
  return {
    id: row.id,
    name: row.name,
    type: types[0] ?? null,
    vendorType: types,
    contactInfo: row.contact_info ?? {},
    pricingTiers: row.pricing_tiers ?? null,
    performanceMetrics: row.performance_metrics ?? null,
    isActive: row.is_active !== false,
    status: row.is_active !== false ? 'active' : 'inactive',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export interface VendorFilters {
  /** Matches against vendor_type[] membership, e.g. 'print'. */
  type?: string
  status?: 'active' | 'inactive'
}

export async function listVendors(filters: VendorFilters = {}): Promise<VendorRecord[]> {
  const supabase = createServiceClient()
  let query = supabase.from('vendors').select(COLUMNS).order('name', { ascending: true })

  if (filters.type) query = query.contains('vendor_type', [filters.type])
  if (filters.status) query = query.eq('is_active', filters.status === 'active')

  const { data, error } = await query
  if (error) throw new Error(`Failed to list vendors: ${error.message}`)
  return ((data ?? []) as unknown as VendorRow[]).map(toRecord)
}

/**
 * The vendor a dispatch goes to when the admin doesn't name one.
 * Returns null rather than throwing — the caller decides how loud to be.
 */
export async function findActivePrintVendor(): Promise<VendorRecord | null> {
  const vendors = await listVendors({ type: 'print', status: 'active' })
  return vendors[0] ?? null
}

export async function getVendor(vendorId: string): Promise<VendorRecord | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('vendors')
    .select(COLUMNS)
    .eq('id', vendorId)
    .maybeSingle()

  if (error) throw new Error(`Failed to load vendor: ${error.message}`)
  return data ? toRecord(data as unknown as VendorRow) : null
}

export interface VendorInput {
  name: string
  /** One or more of: print | skip_trace | data | fulfillment | other. */
  type: string | string[]
  contactInfo?: Record<string, unknown>
  pricingTiers?: unknown
}

export async function createVendor(input: VendorInput): Promise<VendorRecord> {
  const supabase = createServiceClient()
  const vendorType = Array.isArray(input.type) ? input.type : [input.type]

  const { data, error } = await supabase
    .from('vendors')
    .insert({
      name: input.name,
      vendor_type: vendorType,
      contact_info: input.contactInfo ?? {},
      pricing_tiers: input.pricingTiers ?? null,
      performance_metrics: {},
      is_active: true,
    })
    .select(COLUMNS)
    .single()

  if (error) throw new Error(`Failed to create vendor: ${error.message}`)
  return toRecord(data as unknown as VendorRow)
}

export interface VendorPatch {
  name?: string
  type?: string | string[]
  contactInfo?: Record<string, unknown>
  pricingTiers?: unknown
  isActive?: boolean
}

export async function updateVendor(vendorId: string, patch: VendorPatch): Promise<VendorRecord> {
  const supabase = createServiceClient()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (patch.name !== undefined) update.name = patch.name
  if (patch.type !== undefined) {
    update.vendor_type = Array.isArray(patch.type) ? patch.type : [patch.type]
  }
  if (patch.contactInfo !== undefined) update.contact_info = patch.contactInfo
  if (patch.pricingTiers !== undefined) update.pricing_tiers = patch.pricingTiers
  if (patch.isActive !== undefined) update.is_active = patch.isActive

  const { data, error } = await supabase
    .from('vendors')
    .update(update)
    .eq('id', vendorId)
    .select(COLUMNS)
    .single()

  if (error) throw new Error(`Failed to update vendor: ${error.message}`)
  return toRecord(data as unknown as VendorRow)
}

/**
 * Soft-delete: vendors are referenced by order_dispatches, so removing the row
 * would orphan fulfillment history. Deactivating hides them from selection.
 */
export async function deactivateVendor(vendorId: string): Promise<void> {
  await updateVendor(vendorId, { isActive: false })
}
