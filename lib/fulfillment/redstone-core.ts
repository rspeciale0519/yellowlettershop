// Pure Redstone Mail mapping — no IO, no Supabase, no fetch. The client
// (redstone-client.ts) applies these decisions.
//
// Source of truth: docs/temp/vendors/redstone/rsm_api_specs_pre-r631-1.pdf.
// NOTE: the former dev-docs/api-redstone.md was NOT Redstone documentation — it
// was fabricated (wrong host, wrong endpoint, wrong key format) and is archived
// at archive/api-redstone-fabricated-2026-08/. Verified against the live API on
// 2026-08-01.

/** Redstone accepts exactly these four job types. */
export type RedstoneJobType = 'Letter' | 'Post Card' | 'Snap Pack' | 'Self Mailer'

export interface RedstoneOrderInput {
  /** Our order id — becomes Redstone's ext_id and our idempotency key. */
  orderId: string
  campaignName: string
  recordCount: number
  /** Publicly fetchable CSV of recipients. */
  dataUrl: string
  /** Publicly fetchable artwork (the approved proof). */
  artUrl?: string | null
  mailPieceFormat?: string | null
  postageType?: string | null
  serviceLevel?: string | null
  notes?: string | null
  /** YYYY-MM-DD. Redstone rejects past dates. */
  dueDate: string
  /** false only once the integration is signed off by both sides. */
  apiTest: boolean
}

/**
 * Piece format → Redstone job geometry.
 *
 * PROVISIONAL: these mappings are our reading of the spec and must be confirmed
 * with Redstone during onboarding (their doc says they will map our vocabulary
 * to theirs). Keeping the whole table in one place so a correction is one edit.
 */
export function mapJobType(mailPieceFormat?: string | null): {
  jobtype: RedstoneJobType
  postcardH?: string
  postcardW?: string
  num_inserts?: string
} {
  switch (mailPieceFormat) {
    case 'postcard_4x6':
      return { jobtype: 'Post Card', postcardH: '4', postcardW: '6' }
    case 'postcard_5x7':
      return { jobtype: 'Post Card', postcardH: '5', postcardW: '7' }
    case 'letter_folded':
    case 'letter_8_5x11':
      return { jobtype: 'Letter', num_inserts: '1' }
    default:
      // Postcards are the dominant product; default there rather than refuse.
      return { jobtype: 'Post Card', postcardH: '4', postcardW: '6' }
  }
}

/** Our postage option → Redstone's postage_class + postage_type pair. */
export function mapPostage(postageType?: string | null): {
  postage_class: string
  postage_type: string
} {
  switch (postageType) {
    case 'first_class_forever':
      return { postage_class: 'First Class', postage_type: 'Stamp' }
    case 'first_class_discounted':
      return { postage_class: 'First Class', postage_type: 'Permit' }
    case 'standard':
      return { postage_class: 'Standard', postage_type: 'Permit' }
    default:
      return { postage_class: 'First Class', postage_type: 'Stamp' }
  }
}

/**
 * Service level → Redstone distribution type. PROVISIONAL: Redstone's list has
 * no "ship back to the customer" option, so the non-mailing levels use Will
 * Call, which is the closest documented value. Confirm at onboarding.
 */
export function mapDistType(serviceLevel?: string | null): string {
  switch (serviceLevel) {
    case 'full_service':
      return 'None'
    case 'ship_processed':
    case 'print_only':
      return 'Will Call'
    default:
      return 'None'
  }
}

/** Lead time in calendar days before the job is due, by service level. */
const LEAD_DAYS: Record<string, number> = {
  full_service: 7,
  ship_processed: 5,
  print_only: 3,
}

/**
 * Redstone requires a duedate and rejects dates in the past, but we never ask
 * the customer for one — derive it from the service level.
 */
export function deriveDueDate(from: Date, serviceLevel?: string | null): string {
  const days = LEAD_DAYS[serviceLevel ?? ''] ?? 7
  const due = new Date(from.getTime())
  due.setUTCDate(due.getUTCDate() + days)
  return due.toISOString().slice(0, 10)
}

// Redstone's recognized header synonyms (spec 3.1). Our own vendor CSV uses
// Address_1/Zip_Code, which are NOT on their list — hence a separate builder
// rather than reusing dispatch-core's buildRecipientCsv.
const REDSTONE_COLUMNS = [
  'First',
  'Last',
  'address',
  'address2',
  'City',
  'State',
  'zip',
  'Company',
  'Email',
  'Phone',
] as const

const FIELD_KEYS = [
  'first_name',
  'last_name',
  'address_line_1',
  'address_line_2',
  'city',
  'state',
  'zip_code',
  'company',
  'email',
  'phone',
] as const

/**
 * Redstone's spec: "The file should not contain any special characters, UTF-8
 * or upper ASCII sequences." So rather than quoting commas the way normal CSV
 * would, strip the characters that could break a strict parser — their intake
 * is picky and a mangled parse silently mails to the wrong address.
 */
export function sanitizeRedstoneCell(value: unknown): string {
  if (value == null) return ''
  return String(value)
    .normalize('NFKD')
    // Drop combining marks left by the decomposition (é -> e).
    .replace(/[̀-ͯ]/g, '')
    // Anything outside printable ASCII becomes a space.
    .replace(/[^\x20-\x7E]/g, ' ')
    // Structural characters a bare-CSV parser would trip on.
    .replace(/["',]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildRedstoneCsv(records: Record<string, unknown>[]): string {
  const rows = records.map((record) =>
    FIELD_KEYS.map((key) => sanitizeRedstoneCell(record[key])).join(',')
  )
  return [REDSTONE_COLUMNS.join(','), ...rows].join('\n') + '\n'
}

/**
 * Redstone fetches `data`/`art` itself via cURL, so the URLs must be reachable
 * from the public internet. Local dev URLs fail on their side with an opaque
 * error, so refuse early with something actionable.
 */
export function assertPublicFileUrl(url: string, label: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`${label} URL is not a valid absolute URL`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${label} URL must use http or https`)
  }
  if (parsed.username || parsed.password) {
    throw new Error(`${label} URL must not embed credentials`)
  }
  if (url.length > 2048) {
    throw new Error(`${label} URL exceeds Redstone's 2048-character limit`)
  }
  const host = parsed.hostname.toLowerCase()
  const isLocal =
    host === 'localhost' ||
    host.endsWith('.local') ||
    host === '::1' ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  if (isLocal) {
    throw new Error(
      `${label} URL points at ${host}, which Redstone cannot reach. ` +
        'Dispatching to Redstone requires publicly reachable storage URLs.'
    )
  }
}

/**
 * A vendor opts into API dispatch by setting contact_info.integration to
 * "redstone". Everyone else keeps the email hand-off, which stays the fallback
 * path rather than being replaced.
 */
export function isRedstoneVendor(contactInfo: unknown): boolean {
  if (!contactInfo || typeof contactInfo !== 'object') return false
  const flag = (contactInfo as Record<string, unknown>).integration
  return typeof flag === 'string' && flag.trim().toLowerCase() === 'redstone'
}

/** The JSON body Redstone's createOrder expects. */
export function buildOrderPayload(input: RedstoneOrderInput): Record<string, unknown> {
  assertPublicFileUrl(input.dataUrl, 'Recipient data')
  if (input.artUrl) assertPublicFileUrl(input.artUrl, 'Artwork')

  const job = mapJobType(input.mailPieceFormat)
  const postage = mapPostage(input.postageType)

  return {
    id: input.orderId,
    name: input.campaignName.slice(0, 255),
    duedate: input.dueDate,
    qty_est: String(input.recordCount),
    notes: (input.notes ?? 'Submitted via the Yellow Letter Shop API.').slice(0, 500),
    ...job,
    color: '4/4',
    bleeds: true,
    purls: false,
    qr_code: false,
    streetview: false,
    response_boost: false,
    ...postage,
    dist_type: mapDistType(input.serviceLevel),
    api_test: input.apiTest,
    api_type: 'json',
    data: input.dataUrl,
    ...(input.artUrl ? { art: input.artUrl } : {}),
  }
}

export type RedstoneOutcome =
  /** Redstone accepted the job. */
  | { kind: 'accepted'; message: string }
  /** This order id already exists there — treat as accepted, never resubmit. */
  | { kind: 'duplicate'; message: string }
  /** Worth another attempt (rate limit / maintenance / network). */
  | { kind: 'retryable'; message: string }
  /** A human must look at it. Never retry — it will fail identically. */
  | { kind: 'permanent'; message: string }

/**
 * Classify a createOrder response.
 *
 * Two live-verified quirks drive this:
 *   1. HTTP 200 does NOT mean success — the body carries {"fail":true,...},
 *      which is how a bad API key surfaces ("Where did you come from?").
 *   2. The deployed build answers a malformed payload with an HTML 500 error
 *      page, not the 422 JSON the spec describes (the spec is pre-release).
 *      So a 500 is treated as permanent: retrying re-sends the same bad body.
 */
export function classifyRedstoneResponse(status: number, rawBody: string): RedstoneOutcome {
  if (status === 0) {
    return { kind: 'retryable', message: 'Network error reaching Redstone' }
  }
  if (status === 409) {
    return { kind: 'duplicate', message: 'Redstone already has an order with this id' }
  }
  if (status === 429 || status === 503) {
    return { kind: 'retryable', message: `Redstone is throttling or in maintenance (${status})` }
  }

  let parsed: unknown = null
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    // Non-JSON: the HTML error page. Fall through to the status check.
  }

  if (parsed && typeof parsed === 'object') {
    const body = parsed as Record<string, unknown>
    const msg = typeof body.msg === 'string' ? body.msg : ''
    if (body.fail === false) {
      return { kind: 'accepted', message: msg || 'ok' }
    }
    if (body.fail === true) {
      if (/where did you come from/i.test(msg)) {
        return { kind: 'permanent', message: 'Redstone rejected the API key' }
      }
      if (/duplicate|already exists/i.test(msg)) {
        return { kind: 'duplicate', message: msg }
      }
      return { kind: 'permanent', message: msg || 'Redstone rejected the order' }
    }
  }

  if (status >= 200 && status < 300) {
    return { kind: 'permanent', message: 'Unrecognized response from Redstone' }
  }
  return {
    kind: 'permanent',
    message: `Redstone returned HTTP ${status} — the payload was rejected, a human must review it`,
  }
}
