// =================================================================================
// Core Database Types
// =================================================================================
// This file contains the TypeScript types that correspond to your Supabase tables.
// It is the single source of truth for your database schema.

// ---------------------------------------------------------------------------------
// Custom Enum Types
// ---------------------------------------------------------------------------------

export type OrderStatus = 'draft' | 'submitted' | 'processing' | 'shipped' | 'completed' | 'failed';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'archived';

// ---------------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------------

export type UserProfile = {
  id: string; // Corresponds to auth.users.id
  full_name?: string;
  company_name?: string;
  avatar_url?: string;
  updated_at?: string;
};

export type MailingList = {
  id: string;
  name: string;
  description?: string;
  record_count: number;
  created_at: string;
  created_by: string;
  modified_at?: string;
  modified_by?: string;
  tags: Tag[];
  campaigns: Campaign[];
  metadata?: Record<string, any>;
  criteria?: Record<string, any>;
  version: number;
};

export type MailingListRecord = {
  id: string;
  mailing_list_id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  county?: string;
  property_type?: string;
  estimated_value?: number;
  status: 'active' | 'doNotContact' | 'returnedMail';
  created_at: string;
  created_by: string;
  modified_at?: string;
  modified_by?: string;
  metadata?: Record<string, any>;
  is_valid?: boolean;
  validation_errors?: any;
};

export type Tag = {
  id: string;
  name: string;
  color?: string;
};

export type Campaign = {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  active_order_id?: string;
  created_at: string;
  created_by: string;
  scheduled_at?: string;
  sent_at?: string;
  completed_at?: string;
};

export type MailPiece = {
  id: string;
  name: string;
  description?: string;
  dimensions?: string;
  type?: string; // e.g., 'postcard', 'letter'
  metadata?: Record<string, any>;
  created_at: string;
  created_by: string;
};

export type Order = {
  id: string;
  campaign_id: string;
  mail_piece_id: string;
  vendor_order_id?: string;
  status: OrderStatus;
  record_count: number;
  cost_per_piece?: number;
  total_cost?: number;
  mail_class?: string;
  postage_type?: string;
  submitted_at?: string;
  expected_delivery_date?: string;
  metadata?: Record<string, any>;
  created_at: string;
  created_by: string;
};
