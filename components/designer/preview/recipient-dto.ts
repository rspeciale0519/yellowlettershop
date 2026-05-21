// Pure, dependency-free recipient shape + mappers for the designer preview.
//
// Deliberately self-contained: it does NOT import the broken
// `lib/supabase/mailing-lists` / `@/types/supabase` chain. The server route
// (`app/api/designer/recipients`) maps raw DB rows through `mapRowToRecipientDTO`
// so typechecked client code only ever sees this clean shape.

export interface RecipientDTO {
  id: string
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  company: string
  email: string
  phone: string
}

function str(value: unknown): string {
  if (value === null || value === undefined) return ''
  return typeof value === 'string' ? value : String(value)
}

/** Map a raw `mailing_list_records` row (snake_case, nullable) to a clean DTO. */
export function mapRowToRecipientDTO(row: Record<string, unknown>): RecipientDTO {
  return {
    id: str(row.id),
    firstName: str(row.first_name),
    lastName: str(row.last_name),
    addressLine1: str(row.address_line1 ?? row.address_line_1),
    addressLine2: str(row.address_line2 ?? row.address_line_2),
    city: str(row.city),
    state: str(row.state),
    zipCode: str(row.zip_code ?? row.zipcode),
    company: str(row.company),
    email: str(row.email),
    phone: str(row.phone),
  }
}

export type RecipientsQuery =
  | { kind: 'lists' }
  | { kind: 'records'; listId?: string; search?: string; limit: number; offset: number }

const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

function clampLimit(raw: string | null): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT
  return Math.min(MAX_LIMIT, Math.floor(n))
}

function clampOffset(raw: string | null): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.floor(n)
}

/** Parse + sanitize the recipients route query string. Pure & total. */
export function parseRecipientsQuery(params: URLSearchParams): RecipientsQuery {
  if (params.get('kind') === 'lists') return { kind: 'lists' }
  return {
    kind: 'records',
    listId: params.get('listId') || undefined,
    search: params.get('search') || undefined,
    limit: clampLimit(params.get('limit')),
    offset: clampOffset(params.get('offset')),
  }
}
