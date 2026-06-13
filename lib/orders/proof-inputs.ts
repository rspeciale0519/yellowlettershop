import type { RecipientDTO } from '@/components/designer/preview/recipient-dto'
import type { SenderInput } from '@/components/designer/tokens/recipient-map'

export interface ProofInputs {
  designState: Record<string, unknown>
  recipient: RecipientDTO
  sender: SenderInput
  formatId: string
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function emptyRecipient(): RecipientDTO {
  return {
    id: '',
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    company: '',
    email: '',
    phone: '',
  }
}

interface CardLike {
  firstName?: unknown
  lastName?: unknown
  company?: unknown
  phone?: unknown
  email?: unknown
}

interface OrderStateLike {
  designAndContent?: {
    design?: { designJson?: unknown }
    contactCard?: { contactCardData?: CardLike }
  }
  design?: { designJson?: unknown }
  dataAndMapping?: { listData?: { manualRecords?: unknown[] } }
  listData?: { manualRecords?: unknown[] }
  contactCard?: { contactCardData?: CardLike }
}

/**
 * Resolve everything the proof renderer needs out of a raw order state blob.
 * Order state has two generations of shape (consolidated `designAndContent`
 * vs legacy top-level slots) — both are honored, consolidated first.
 * Throws when the order has no design: a proof without artwork is meaningless.
 */
export function resolveProofInputs(orderState: OrderStateLike): ProofInputs {
  const design = orderState.designAndContent?.design ?? orderState.design
  const designState = design?.designJson
  if (!designState || typeof designState !== 'object') {
    throw new Error('Order has no design to proof — complete the design step first')
  }

  const listData = orderState.dataAndMapping?.listData ?? orderState.listData
  const record = (
    Array.isArray(listData?.manualRecords) ? listData.manualRecords[0] : undefined
  ) as Record<string, unknown> | undefined

  const recipient: RecipientDTO = record
    ? {
        ...emptyRecipient(),
        firstName: str(record.first_name),
        lastName: str(record.last_name),
        addressLine1: str(record.address_line_1),
        addressLine2: str(record.address_line_2),
        city: str(record.city),
        state: str(record.state),
        zipCode: str(record.zip_code),
        company: str(record.company),
        email: str(record.email),
        phone: str(record.phone),
      }
    : emptyRecipient()

  const card =
    orderState.designAndContent?.contactCard?.contactCardData ??
    orderState.contactCard?.contactCardData
  const sender: SenderInput = card
    ? {
        firstName: str(card.firstName),
        lastName: str(card.lastName),
        company: str(card.company),
        phone: str(card.phone),
        email: str(card.email),
      }
    : {}

  const formatId =
    str((designState as Record<string, unknown>).formatId) || 'letter_8_5x11'

  return { designState: designState as Record<string, unknown>, recipient, sender, formatId }
}
