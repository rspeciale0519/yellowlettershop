import 'server-only'
import { createServiceClient } from '@/utils/supabase/service'

/**
 * Recipient loading for vendor dispatch.
 *
 * Split out of dispatch-service.ts to keep that file inside the 350-line rule
 * and to give the authorization check below a home of its own — it is the only
 * thing standing between a customer-supplied list id and a service-role read of
 * someone else's PII.
 */

type ServiceClient = ReturnType<typeof createServiceClient>

interface ListDataLike {
  selectedListId?: string
  manualRecords?: unknown[]
}

/** Only the order fields recipient loading needs. */
export interface RecipientSourceOrder {
  metadata?: { order_state?: Record<string, unknown> } | null
  created_by?: string | null
}

/** Wizard state stores list selection under two generations of shape. */
function resolveListData(order: RecipientSourceOrder): ListDataLike {
  const state = (order.metadata?.order_state ?? {}) as Record<string, unknown>
  const consolidated = (state.dataAndMapping as { listData?: ListDataLike } | undefined)?.listData
  return consolidated ?? (state.listData as ListDataLike | undefined) ?? {}
}

// mailing_list_records uses address_line1/address_line2 (no underscore before
// the digit) and has no company column, while wizard-state manual records use
// address_line_1/address_line_2/company. buildRecipientCsv reads the latter, so
// DB rows are normalized to that shape on the way out.
const RECIPIENT_COLUMNS =
  'first_name, last_name, address_line1, address_line2, city, state, zip_code, email, phone'

interface RecipientRow {
  first_name?: string | null
  last_name?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  email?: string | null
  phone?: string | null
}

function normalizeRecipient(row: RecipientRow): Record<string, unknown> {
  return {
    first_name: row.first_name ?? '',
    last_name: row.last_name ?? '',
    address_line_1: row.address_line1 ?? '',
    address_line_2: row.address_line2 ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    zip_code: row.zip_code ?? '',
    company: '',
    email: row.email ?? '',
    phone: row.phone ?? '',
  }
}

/**
 * The list id arrives from `orders.metadata.order_state`, which is whatever the
 * client posted to /api/orders/submit — that route validates the Stripe intent
 * but accepts the wizard blob as-is. Dispatch then reads recipients with the
 * service role, which bypasses RLS, so without this check any customer could
 * name another tenant's list and have its PII exported to our print vendor.
 *
 * Mirrors the gate in app/api/accuzip/upload/route.ts. The principal is the
 * order's owner, never the actor: an admin re-dispatching must not lend their
 * privileges to a list the customer could not read themselves.
 */
async function assertListReadableByOrderOwner(
  supabase: ServiceClient,
  listId: string,
  ownerId: string | null | undefined
): Promise<void> {
  if (!ownerId) {
    throw new Error('Order has no owner recorded — refusing to dispatch its mailing list')
  }

  const { data: list, error } = await supabase
    .from('mailing_lists')
    .select('id, created_by, team_id')
    .eq('id', listId)
    .maybeSingle()

  if (error) throw new Error(`Failed to load mailing list: ${error.message}`)
  if (!list) throw new Error('Mailing list for this order was not found')

  const listRow = list as { created_by?: string | null; team_id?: string | null }
  let readable = listRow.created_by === ownerId

  if (!readable && listRow.team_id) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('team_id')
      .eq('user_id', ownerId)
      .maybeSingle()
    const profileRow = profile as { team_id?: string | null } | null
    readable = Boolean(profileRow?.team_id && profileRow.team_id === listRow.team_id)
  }

  if (!readable) {
    throw new Error(
      'Order references a mailing list its owner cannot access — refusing to dispatch'
    )
  }
}

export async function loadRecipients(
  supabase: ServiceClient,
  order: RecipientSourceOrder
): Promise<Record<string, unknown>[]> {
  const listData = resolveListData(order)

  if (listData.selectedListId) {
    await assertListReadableByOrderOwner(supabase, listData.selectedListId, order.created_by)

    const { data, error } = await supabase
      .from('mailing_list_records')
      .select(RECIPIENT_COLUMNS)
      .eq('mailing_list_id', listData.selectedListId)
    if (error) throw new Error(`Failed to load recipients: ${error.message}`)
    return ((data ?? []) as unknown as RecipientRow[]).map(normalizeRecipient)
  }

  // Manual records live in the order's own wizard state — nothing to authorize.
  return (listData.manualRecords ?? []) as Record<string, unknown>[]
}
