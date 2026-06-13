// Pure helpers for persisting a wizard CSV upload into mailing_list_records.
//
// The order wizard maps the user's source columns to YLS field keys
// (first_name, address_line_1, …). This module turns those mapped rows into
// normalized `mailing_list_records` insert rows: the recognized fields land in
// their real typed columns; everything else is preserved in `additional_data`
// (the table's jsonb extras column). Kept pure so it is unit-testable without
// a DB or network.

/** YLS field key -> real mailing_list_records column. */
const FIELD_TO_COLUMN: Record<string, string> = {
  first_name: 'first_name',
  last_name: 'last_name',
  middle_name: 'middle_name',
  full_name: 'full_name',
  email: 'email',
  phone: 'phone',
  address_line_1: 'address_line1',
  address_line_2: 'address_line2',
  city: 'city',
  state: 'state',
  zip_code: 'zip_code',
  property_type: 'property_type',
  bedrooms: 'bedrooms',
  bathrooms: 'bathrooms',
  square_feet: 'square_feet',
  year_built: 'year_built',
  estimated_value: 'estimated_value',
  loan_amount: 'loan_amount',
  loan_type: 'loan_type',
  interest_rate: 'interest_rate',
  age: 'age',
  income: 'income',
  marital_status: 'marital_status',
}

/** Columns that are numeric in the schema and must be coerced or dropped. */
const NUMERIC_COLUMNS = new Set([
  'bedrooms',
  'bathrooms',
  'square_feet',
  'year_built',
  'estimated_value',
  'loan_amount',
  'interest_rate',
  'age',
  'income',
])

const INTEGER_COLUMNS = new Set(['bedrooms', 'square_feet', 'year_built', 'age'])

export interface MailingListRecordInsert {
  mailing_list_id: string
  first_name?: string
  last_name?: string
  middle_name?: string
  full_name?: string
  email?: string
  phone?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  zip_code?: string
  property_type?: string
  bedrooms?: number
  bathrooms?: number
  square_feet?: number
  year_built?: number
  estimated_value?: number
  loan_amount?: number
  loan_type?: string
  interest_rate?: number
  age?: number
  income?: number
  marital_status?: string
  data_source: string
  validation_status: string
  additional_data: Record<string, unknown>
}

function toStr(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function toNumber(value: unknown, integer: boolean): number | undefined {
  const raw = toStr(value).replace(/[$,%\s]/g, '')
  if (raw === '') return undefined
  const n = Number(raw)
  if (!Number.isFinite(n)) return undefined
  return integer ? Math.trunc(n) : n
}

/**
 * Map one wizard preview/source row into a mailing_list_records insert.
 *
 * @param row          A source row keyed by the original column header.
 * @param mappedFields YLS field key -> source column (null when unmapped).
 * @param mailingListId The owning list id.
 */
export function mapRowToRecord(
  row: Record<string, unknown>,
  mappedFields: Record<string, string | null>,
  mailingListId: string
): MailingListRecordInsert {
  // Mapped values are gathered in a typed bag and spread onto the record, so we
  // never cast the struct to a loose index signature (keeps TS strict happy).
  const columns: Record<string, string | number> = {}
  const additionalData: Record<string, unknown> = {}
  const consumedSourceCols = new Set<string>()

  for (const [field, sourceCol] of Object.entries(mappedFields)) {
    if (!sourceCol) continue
    const column = FIELD_TO_COLUMN[field]
    if (!column) continue
    consumedSourceCols.add(sourceCol)

    if (NUMERIC_COLUMNS.has(column)) {
      const n = toNumber(row[sourceCol], INTEGER_COLUMNS.has(column))
      if (n !== undefined) columns[column] = n
      continue
    }

    const v = toStr(row[sourceCol])
    if (v !== '') columns[column] = v
  }

  // Preserve every unmapped source column verbatim in additional_data so no
  // uploaded data is silently lost (extras the user may still want downstream).
  for (const [key, value] of Object.entries(row)) {
    if (consumedSourceCols.has(key)) continue
    const v = toStr(value)
    if (v !== '') additionalData[key] = v
  }

  return {
    mailing_list_id: mailingListId,
    data_source: 'order_upload',
    validation_status: 'pending',
    ...columns,
    additional_data: additionalData,
  }
}

/** Map an array of source rows into mailing_list_records insert rows. */
export function mapRowsToRecords(
  rows: Record<string, unknown>[],
  mappedFields: Record<string, string | null>,
  mailingListId: string
): MailingListRecordInsert[] {
  return rows.map((row) => mapRowToRecord(row, mappedFields, mailingListId))
}

/** AccuZip validation shape (mirrors lib/orders/accuzip-processor AccuzipRecord). */
export interface AccuzipRecordShape {
  id: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  zip: string
  first_name: string
  last_name: string
  email: string
  phone: string
}

/**
 * Build an AccuZip record from a persisted mailing_list_records row. Persisted
 * rows use canonical DB columns (address_line1, zip_code, …), so we read those
 * directly rather than the wizard's source-column mapping; additional_data is a
 * fallback for any field that wasn't promoted to a typed column.
 */
export function dbRecordToAccuzip(
  record: Record<string, unknown>,
  fallbackId: string
): AccuzipRecordShape {
  const extras = (record.additional_data as Record<string, unknown> | null) ?? {}
  const get = (column: string, ...extraKeys: string[]): string => {
    const direct = toStr(record[column])
    if (direct !== '') return direct
    for (const key of extraKeys) {
      const v = toStr(extras[key])
      if (v !== '') return v
    }
    return ''
  }
  return {
    id: toStr(record.id) || fallbackId,
    address_line_1: get('address_line1', 'address_line_1', 'address'),
    address_line_2: get('address_line2', 'address_line_2'),
    city: get('city'),
    state: get('state'),
    zip: get('zip_code', 'zip', 'zipcode'),
    first_name: get('first_name'),
    last_name: get('last_name'),
    email: get('email'),
    phone: get('phone'),
  }
}

/**
 * Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped quotes
 * (""), and commas/newlines inside quotes. Returns objects keyed by header.
 * Used to re-parse the full uploaded file client-side (the wizard preview only
 * holds the first 10 rows).
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = parseCsvRows(text)
  if (rows.length === 0) return []
  const headers = rows[0].map((h) => h.trim())
  const out: Record<string, string>[] = []
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i]
    if (cells.length === 1 && cells[0] === '') continue
    const record: Record<string, string> = {}
    headers.forEach((header, idx) => {
      record[header] = cells[idx] ?? ''
    })
    out.push(record)
  }
  return out
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i]
    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      field = ''
      row = []
    } else {
      field += char
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}
