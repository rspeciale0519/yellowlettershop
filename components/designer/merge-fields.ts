export type MergeField = {
  key: string
  label: string
  group: "Recipient" | "Property" | "Sender"
}

export const MERGE_FIELDS: MergeField[] = [
  { key: "first_name", label: "First Name", group: "Recipient" },
  { key: "last_name", label: "Last Name", group: "Recipient" },
  { key: "full_name", label: "Full Name", group: "Recipient" },
  { key: "address_line_1", label: "Address", group: "Recipient" },
  { key: "mailing_address", label: "Mailing Address", group: "Recipient" },
  { key: "property_address", label: "Property Address", group: "Property" },
  { key: "city", label: "City", group: "Property" },
  { key: "state", label: "State", group: "Property" },
  { key: "zip_code", label: "ZIP Code", group: "Property" },
  { key: "sender_first", label: "Sender First", group: "Sender" },
  { key: "sender_last", label: "Sender Last", group: "Sender" },
  { key: "sender_phone", label: "Sender Phone", group: "Sender" },
  { key: "sender_company", label: "Sender Company", group: "Sender" },
  { key: "sender_email", label: "Sender Email", group: "Sender" },
]

export function tokenForField(key: string) {
  return `{{${key}}}`
}
