import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_PRICING, type PricingConfig } from './pricing'
import { buildPricingConfig, type PricingRow } from './pricing-config-data'

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
    return buildPricingConfig(data as PricingRow[])
  } catch {
    return DEFAULT_PRICING
  }
}
