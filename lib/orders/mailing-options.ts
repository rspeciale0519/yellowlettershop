import type { Finish, MailPieceFormat, MailingOptions, PaperStock, PostageType } from './pricing'

const SERVICE_LEVELS = new Set<MailingOptions['serviceLevel']>([
  'full_service',
  'ship_processed',
  'print_only',
])
const FORMATS = new Set<MailPieceFormat>([
  'postcard_4x6',
  'postcard_5x7',
  'letter_8_5x11',
  'letter_folded',
])
const PAPER = new Set<PaperStock>(['standard_14pt', 'premium_16pt', 'luxury_18pt'])
const FINISHES = new Set<Finish>(['matte', 'gloss', 'uv_coating'])
const POSTAGE = new Set<PostageType>([
  'first_class_forever',
  'first_class_discounted',
  'standard',
])

type Loose = Record<string, unknown>

function optionalEnum<T extends string>(
  value: unknown,
  allowed: Set<T>,
  label: string
): { ok: true; value: T | undefined } | { ok: false; error: string } {
  if (value === undefined || value === null || value === '') return { ok: true, value: undefined }
  if (typeof value !== 'string' || !allowed.has(value as T)) {
    return { ok: false, error: `Unknown ${label}` }
  }
  return { ok: true, value: value as T }
}

export function parseMailingOptions(
  orderState: Loose
): { ok: true; mailingOptions: MailingOptions } | { ok: false; error: string } {
  const mailing = (orderState.mailingOptions ??
    (orderState.campaignSettings as { mailingOptions?: unknown } | undefined)?.mailingOptions) as
    | Loose
    | undefined
  if (!mailing || typeof mailing.serviceLevel !== 'string') {
    return { ok: false, error: 'Mailing options not configured' }
  }
  if (!SERVICE_LEVELS.has(mailing.serviceLevel as MailingOptions['serviceLevel'])) {
    return { ok: false, error: 'Unknown service level' }
  }

  const format = optionalEnum(mailing.mailPieceFormat, FORMATS, 'mail-piece format')
  if (!format.ok) return format
  const paper = optionalEnum(mailing.paperStock, PAPER, 'paper stock')
  if (!paper.ok) return paper
  const finish = optionalEnum(mailing.finish, FINISHES, 'finish')
  if (!finish.ok) return finish
  const postage = optionalEnum(mailing.postageType, POSTAGE, 'postage type')
  if (!postage.ok) return postage

  return {
    ok: true,
    mailingOptions: {
      serviceLevel: mailing.serviceLevel as MailingOptions['serviceLevel'],
      mailPieceFormat: format.value,
      paperStock: paper.value,
      finish: finish.value,
      postageType: postage.value,
      includePostage: typeof mailing.includePostage === 'boolean' ? mailing.includePostage : undefined,
    },
  }
}

export function pricedMailingDefaults(opts: MailingOptions) {
  return {
    mailPieceFormat: opts.mailPieceFormat ?? 'postcard_4x6',
    paperStock: opts.paperStock ?? 'standard_14pt',
    finish: opts.finish ?? 'matte',
    postageType: opts.postageType ?? '',
    postageIncluded: Boolean(opts.includePostage),
  }
}
