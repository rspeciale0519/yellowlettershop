import { MAIL_PIECE_FORMATS } from './mail-formats'
import {
  DEFAULT_PRICING,
  type PricingConfig,
  type MailPieceFormat,
  type PaperStock,
  type Finish,
  type PostageType,
} from './pricing'

export interface PricingRow {
  category: string
  key: string
  unit_amount: number | null
  tier_config: unknown
  metadata: Record<string, unknown> | null
  is_active: boolean
}

/** Deep clone so per-key DB overrides never mutate the shared default. */
function cloneDefault(): PricingConfig {
  return {
    printing: { ...DEFAULT_PRICING.printing },
    paperStock: { ...DEFAULT_PRICING.paperStock },
    finish: { ...DEFAULT_PRICING.finish },
    postage: { ...DEFAULT_PRICING.postage },
    shipping: {
      ship_processed: { ...DEFAULT_PRICING.shipping.ship_processed },
      full_service: { ...DEFAULT_PRICING.shipping.full_service },
    },
    volumeDiscounts: DEFAULT_PRICING.volumeDiscounts.map((t) => ({ ...t })),
  }
}

function applyRow(cfg: PricingConfig, row: PricingRow): void {
  const amt = row.unit_amount
  switch (row.category) {
    case 'mail_piece':
      if (MAIL_PIECE_FORMATS.includes(row.key as MailPieceFormat) && typeof amt === 'number' && Number.isSafeInteger(amt) && amt >= 0) cfg.printing[row.key as MailPieceFormat] = amt
      break
    case 'paper_stock':
      if (row.key in cfg.paperStock && typeof amt === 'number') cfg.paperStock[row.key as PaperStock] = amt
      break
    case 'finish':
      if (row.key in cfg.finish && typeof amt === 'number') cfg.finish[row.key as Finish] = amt
      break
    case 'postage':
      if (row.key in cfg.postage && typeof amt === 'number') cfg.postage[row.key as PostageType] = amt
      break
    case 'shipping': {
      const perPiece = Number((row.metadata as { perPiece?: unknown })?.perPiece ?? 0)
      if (row.key === 'ship_processed' && typeof amt === 'number') {
        cfg.shipping.ship_processed = { base: amt, perPiece }
      } else if (row.key === 'full_service' && typeof amt === 'number') {
        cfg.shipping.full_service = { base: amt, perPiece }
      }
      break
    }
    case 'volume_discount': {
      // tier_config: [{ min, max, price(percent) }] → { minQuantity, discount }
      const tiers = Array.isArray(row.tier_config) ? (row.tier_config as Array<{ min?: number; price?: number }>) : null
      if (tiers?.length) {
        cfg.volumeDiscounts = tiers
          .filter((t) => typeof t.min === 'number' && typeof t.price === 'number')
          .map((t) => ({ minQuantity: t.min as number, discount: (t.price as number) / 100 }))
          .sort((a, b) => b.minQuantity - a.minQuantity)
      }
      break
    }
  }
}


export function buildPricingConfig(rows: PricingRow[]): PricingConfig {
  const config = cloneDefault()
  for (const row of rows) if (row.is_active) applyRow(config, row)
  return config
}
