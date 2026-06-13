import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  DEFAULT_PRICING,
  type PricingConfig,
  type MailPieceFormat,
  type PaperStock,
  type Finish,
  type PostageType,
} from './pricing'

interface PricingRow {
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
      if (row.key in cfg.printing && typeof amt === 'number') cfg.printing[row.key as MailPieceFormat] = amt
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

/**
 * Build the live pricing config from the admin-managed pricing_config table,
 * overlaying active rows onto DEFAULT_PRICING. Any failure or missing row falls
 * back to the default, so pricing never breaks if the table is empty/unseeded.
 */
export async function loadPricingConfig(supabase: SupabaseClient): Promise<PricingConfig> {
  try {
    const { data, error } = await supabase
      .from('pricing_config')
      .select('category, key, unit_amount, tier_config, metadata, is_active')
      .eq('is_active', true)
    if (error || !data?.length) return DEFAULT_PRICING
    const cfg = cloneDefault()
    for (const row of data as PricingRow[]) applyRow(cfg, row)
    return cfg
  } catch {
    return DEFAULT_PRICING
  }
}
