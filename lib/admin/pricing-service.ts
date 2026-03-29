import { createServiceClient } from '@/utils/supabase/service';
import { logAdminAction } from './audit-logger';
import type {
  PricingConfig,
  PricingCategory,
  CreatePricingInput,
  UpdatePricingInput,
} from './types';

function mapRow(row: Record<string, unknown>): PricingConfig {
  return {
    id: row.id as string,
    category: row.category as PricingConfig['category'],
    key: row.key as string,
    displayName: row.display_name as string,
    description: row.description as string | null,
    pricingModel: row.pricing_model as PricingConfig['pricingModel'],
    unitAmount: row.unit_amount as number | null,
    unitLabel: row.unit_label as string | null,
    tierConfig: row.tier_config as PricingConfig['tierConfig'],
    isActive: row.is_active as boolean,
    isPublic: row.is_public as boolean,
    sortOrder: row.sort_order as number,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdBy: row.created_by as string | null,
    updatedBy: row.updated_by as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getAllPricing(
  category?: PricingCategory,
  includeInactive = false
): Promise<PricingConfig[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from('pricing_config')
    .select('*')
    .order('sort_order', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }
  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch pricing: ${error.message}`);
  return (data ?? []).map(mapRow);
}

export async function getPricingById(id: string): Promise<PricingConfig | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('pricing_config')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return mapRow(data);
}

export async function createPricing(
  input: CreatePricingInput,
  actorId: string
): Promise<PricingConfig> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('pricing_config')
    .insert({
      category: input.category,
      key: input.key,
      display_name: input.displayName,
      description: input.description ?? null,
      pricing_model: input.pricingModel,
      unit_amount: input.unitAmount ?? null,
      unit_label: input.unitLabel ?? null,
      tier_config: input.tierConfig ?? null,
      is_public: input.isPublic ?? true,
      sort_order: input.sortOrder ?? 0,
      metadata: input.metadata ?? {},
      created_by: actorId,
      updated_by: actorId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create pricing: ${error.message}`);

  const created = mapRow(data);

  await logPricingChange(created.id, actorId, 'create', null, data);
  await logAdminAction({
    actorId,
    action: 'pricing_created',
    targetType: 'pricing_config',
    targetId: created.id,
    newValue: { category: input.category, key: input.key, displayName: input.displayName },
  });

  return created;
}

export async function updatePricing(
  id: string,
  input: UpdatePricingInput,
  actorId: string,
  reason?: string
): Promise<PricingConfig> {
  const supabase = createServiceClient();

  const existing = await getPricingById(id);
  if (!existing) throw new Error('Pricing entry not found');

  const updates: Record<string, unknown> = { updated_by: actorId, updated_at: new Date().toISOString() };
  if (input.displayName !== undefined) updates.display_name = input.displayName;
  if (input.description !== undefined) updates.description = input.description;
  if (input.unitAmount !== undefined) updates.unit_amount = input.unitAmount;
  if (input.unitLabel !== undefined) updates.unit_label = input.unitLabel;
  if (input.tierConfig !== undefined) updates.tier_config = input.tierConfig;
  if (input.isActive !== undefined) updates.is_active = input.isActive;
  if (input.isPublic !== undefined) updates.is_public = input.isPublic;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;
  if (input.metadata !== undefined) updates.metadata = input.metadata;

  const { data, error } = await supabase
    .from('pricing_config')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update pricing: ${error.message}`);

  const changeType = input.isActive === false ? 'deactivate' : input.isActive === true ? 'reactivate' : 'update';
  await logPricingChange(id, actorId, changeType, existing, data, reason);

  const action = input.isActive === false ? 'pricing_deactivated' : input.isActive === true ? 'pricing_reactivated' : 'pricing_updated';
  await logAdminAction({
    actorId,
    action,
    targetType: 'pricing_config',
    targetId: id,
    oldValue: { unitAmount: existing.unitAmount, tierConfig: existing.tierConfig },
    newValue: input as Record<string, unknown>,
  });

  return mapRow(data);
}

export async function getPricingHistory(
  pricingConfigId?: string,
  limit = 50
): Promise<Record<string, unknown>[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from('pricing_change_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (pricingConfigId) {
    query = query.eq('pricing_config_id', pricingConfigId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch pricing history: ${error.message}`);
  return data ?? [];
}

async function logPricingChange(
  configId: string,
  changedBy: string,
  changeType: string,
  oldValues: unknown,
  newValues: unknown,
  reason?: string
): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase.from('pricing_change_log').insert({
      pricing_config_id: configId,
      changed_by: changedBy,
      change_type: changeType,
      old_values: oldValues,
      new_values: newValues,
      reason: reason ?? null,
    });
  } catch (error) {
    console.error('Failed to log pricing change:', error);
  }
}
