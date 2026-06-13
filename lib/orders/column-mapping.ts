// Validate that a list's column mapping covers the fields required to mail a
// piece. A mere `isComplete` UI flag isn't enough — without these the address
// fails validation downstream with a cryptic error.

export const REQUIRED_MAPPING_FIELDS = ['address', 'city', 'state', 'zipCode'] as const

type Mapping = Record<string, unknown> | null | undefined

function isMapped(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/** Required fields that are not mapped to a source column. */
export function missingRequiredMappings(mapping: Mapping): string[] {
  return REQUIRED_MAPPING_FIELDS.filter((field) => !isMapped(mapping?.[field]))
}

export function isMappingComplete(mapping: Mapping): boolean {
  return missingRequiredMappings(mapping).length === 0
}
