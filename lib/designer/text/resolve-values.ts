import type { ResolvedValues } from './types'
export function resolveText(text: string, values: ResolvedValues): string {
  return text.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (whole, key: string) => values[key === 'mailing_address' ? 'address_line_1' : key] ?? whole)
}
export const SAMPLE_VALUES: ResolvedValues = { first_name:'Alex', last_name:'Morgan', full_name:'Alex Morgan', address_line_1:'123 Main Street', address_line_2:'', property_address:'123 Main Street', mailing_address:'123 Main Street', city:'Austin', state:'TX', zip_code:'78701', company:'', email:'alex@example.test', phone:'555-0100', sender_first:'Jamie',sender_last:'Taylor',sender_phone:'555-0199',sender_company:'Your Company',sender_email:'jamie@example.test' }
