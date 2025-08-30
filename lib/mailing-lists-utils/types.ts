import type { MailingList as SBMailingList } from '@/types/supabase';
import type {
  AdvancedSearchCriteria,
  MailingHistoryFilter,
  RecordCountFilter,
} from '@/types/advanced-search';

export type UICampaign = {
  id: string;
  orderId: string;
  mailedDate: string;
  name?: string;
  status?: string;
  createdAt?: string;
  scheduledAt?: string;
  sentAt?: string;
};

export type UITag = { id: string; name: string };

export type UIMailingList = {
  id: string;
  name: string;
  recordCount: number;
  createdAt: string;
  createdBy?: string;
  modifiedDate?: string;
  modifiedBy?: string;
  tags: UITag[];
  campaigns: UICampaign[];
};

// Internal types for mapping
export interface RawTagData {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface NestedTagData {
  tag: RawTagData;
  [key: string]: unknown;
}

export type TagInput = RawTagData | NestedTagData;

export interface RawCampaignData {
  id?: string | number;
  name?: string;
  status?: string;
  active_order_id?: string | number;
  order_id?: string | number;
  vendor_order_id?: string | number;
  sent_at?: string;
  completed_at?: string;
  scheduled_at?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface SupabaseListWithJoins
  extends Omit<SBMailingList, 'tags' | 'campaigns'> {
  tags?: TagInput[];
  campaigns?: RawCampaignData[];
  [key: string]: unknown;
}

// Re-export types for external use
export type { AdvancedSearchCriteria, MailingHistoryFilter, RecordCountFilter };
