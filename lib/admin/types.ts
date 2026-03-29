import type { User } from '@supabase/supabase-js';

export type AdminRole = 'admin' | 'super_admin';

export interface AdminUser {
  user: User;
  userId: string;
  role: AdminRole;
  fullName: string | null;
  email: string;
}

export type AdminAction =
  | 'pricing_created'
  | 'pricing_updated'
  | 'pricing_deactivated'
  | 'pricing_reactivated'
  | 'user_status_changed'
  | 'user_role_changed'
  | 'user_password_reset'
  | 'user_impersonated'
  | 'user_note_added'
  | 'user_credit_added'
  | 'order_status_changed'
  | 'order_payment_captured'
  | 'order_refunded'
  | 'order_vendor_assigned'
  | 'settings_updated';

export type PricingCategory =
  | 'mail_piece'
  | 'paper_stock'
  | 'finish'
  | 'postage'
  | 'shipping'
  | 'volume_discount'
  | 'address_validation'
  | 'add_on_service'
  | 'design_service';

export type PricingModel = 'flat' | 'per_unit' | 'tiered' | 'volume_discount';

export interface PricingTier {
  min: number;
  max: number | null;
  price: number;
}

export interface PricingConfig {
  id: string;
  category: PricingCategory;
  key: string;
  displayName: string;
  description: string | null;
  pricingModel: PricingModel;
  unitAmount: number | null;
  unitLabel: string | null;
  tierConfig: PricingTier[] | null;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePricingInput {
  category: PricingCategory;
  key: string;
  displayName: string;
  description?: string;
  pricingModel: PricingModel;
  unitAmount?: number;
  unitLabel?: string;
  tierConfig?: PricingTier[];
  isPublic?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdatePricingInput {
  displayName?: string;
  description?: string;
  unitAmount?: number;
  unitLabel?: string;
  tierConfig?: PricingTier[];
  isActive?: boolean;
  isPublic?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface AdminUserFilters {
  search?: string;
  role?: string;
  status?: 'active' | 'suspended' | 'banned';
  sortBy?: 'created_at' | 'full_name' | 'email' | 'last_sign_in_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AdminOrderFilters {
  search?: string;
  status?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  sortBy?: 'created_at' | 'submitted_at' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  action: AdminAction;
  targetType: string;
  targetId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}
