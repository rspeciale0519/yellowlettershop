// Pure assembly of AccuZip validation-job results. The actual HTTP call is
// injected so the order-flow route stays testable and the simulation that
// used to live here (Math.random deliverability) can never return.

export interface AccuzipRecord {
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

export interface RecordVerdict {
  valid: boolean
  errors?: string[]
  standardized?: {
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
    plus4?: string
  }
}

export interface ValidatedRecord extends AccuzipRecord {
  is_deliverable: boolean
  standardized_address: {
    address_line_1: string
    address_line_2: string
    city: string
    state: string
    zip: string
    zip_plus_4: string | null
  }
  validation_errors: string[] | null
}

export interface ValidationResults {
  validatedRecords: ValidatedRecord[]
  deliverableCount: number
  undeliverableCount: number
}

export function buildValidationResults(
  records: AccuzipRecord[],
  verdictFor: (record: AccuzipRecord) => RecordVerdict
): ValidationResults {
  const validatedRecords = records.map((record): ValidatedRecord => {
    const verdict = verdictFor(record)
    const std = verdict.standardized
    return {
      ...record,
      is_deliverable: verdict.valid,
      standardized_address: std
        ? {
            address_line_1: std.line1,
            address_line_2: std.line2 ?? '',
            city: std.city,
            state: std.state,
            zip: std.zip,
            zip_plus_4: std.plus4 ?? null,
          }
        : {
            address_line_1: record.address_line_1,
            address_line_2: record.address_line_2,
            city: record.city,
            state: record.state,
            zip: record.zip,
            zip_plus_4: null,
          },
      validation_errors: verdict.errors && verdict.errors.length > 0 ? verdict.errors : null,
    }
  })

  const deliverableCount = validatedRecords.filter((r) => r.is_deliverable).length
  return {
    validatedRecords,
    deliverableCount,
    undeliverableCount: validatedRecords.length - deliverableCount,
  }
}
