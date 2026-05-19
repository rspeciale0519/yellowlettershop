import type { RecipientDTO } from "@/components/designer/preview/recipient-dto"

// Pure. Self-contained sender shape (no ContactCard/@/types coupling).
export interface SenderInput {
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  email?: string
}

export interface TokenContext {
  values: Record<string, string>
}

function s(v: string | undefined): string {
  return v ?? ""
}

/** Flat canonical token map consumed by the token engine. */
export function buildTokenContext(recipient: RecipientDTO, sender: SenderInput): TokenContext {
  const fullName = [recipient.firstName, recipient.lastName].filter(Boolean).join(" ")
  return {
    values: {
      first_name: s(recipient.firstName),
      last_name: s(recipient.lastName),
      full_name: fullName,
      address_line_1: s(recipient.addressLine1),
      address_line_2: s(recipient.addressLine2),
      mailing_address: s(recipient.addressLine1),
      property_address: s(recipient.addressLine1),
      city: s(recipient.city),
      state: s(recipient.state),
      zip_code: s(recipient.zipCode),
      company: s(recipient.company),
      email: s(recipient.email),
      phone: s(recipient.phone),
      sender_first: s(sender.firstName),
      sender_last: s(sender.lastName),
      sender_phone: s(sender.phone),
      sender_company: s(sender.company),
      sender_email: s(sender.email),
    },
  }
}
