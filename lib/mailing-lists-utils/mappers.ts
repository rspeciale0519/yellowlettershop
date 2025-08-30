import type {
  UITag,
  UICampaign,
  UIMailingList,
  TagInput,
  RawTagData,
  RawCampaignData,
  SupabaseListWithJoins,
} from './types';

function mapTags(raw: TagInput[] | undefined): UITag[] {
  if (!raw || !Array.isArray(raw)) return [];
  // Handle two shapes: [{ id, name, ... }] OR [{ tag: { id, name } }]
  return raw
    .map((t: TagInput) => ('tag' in t ? t.tag : t))
    .filter((t): t is RawTagData =>
      Boolean(
        t &&
          typeof t === 'object' &&
          'id' in t &&
          'name' in t &&
          typeof t.id === 'string' &&
          typeof t.name === 'string'
      )
    )
    .map((t: RawTagData) => ({ id: t.id, name: t.name }));
}

function mapCampaigns(raw: RawCampaignData[] | undefined): UICampaign[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((c: RawCampaignData) => ({
      id: String(c.id ?? ''),
      orderId: String(
        c.active_order_id ?? c.order_id ?? c.vendor_order_id ?? c.id ?? ''
      ),
      mailedDate: String(
        c.sent_at ?? c.completed_at ?? c.scheduled_at ?? c.created_at ?? ''
      ),
      name: c.name,
      status: c.status,
      createdAt: c.created_at,
      scheduledAt: c.scheduled_at,
      sentAt: c.sent_at,
    }))
    .filter((c) => !!c.id);
}

export function mapSupabaseListToUI(
  list: SupabaseListWithJoins
): UIMailingList {
  return {
    id: list.id,
    name: list.name,
    recordCount: list.record_count ?? 0,
    createdAt: list.created_at,
    createdBy: list.created_by,
    modifiedDate: list.modified_at,
    modifiedBy: list.modified_by,
    tags: mapTags(list.tags),
    campaigns: mapCampaigns(list.campaigns),
  };
}

export function mapSupabaseListsToUI(
  lists: SupabaseListWithJoins[]
): UIMailingList[] {
  return (lists || []).map(mapSupabaseListToUI);
}
