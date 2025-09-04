// =================================================================================
// Yellow Letter Shop (YLS) - Comprehensive Database Types
// =================================================================================
// This file contains the complete TypeScript types that correspond to your Supabase 
// database schema from migration 003_comprehensive_database_schema.sql
// This is the single source of truth for your database schema types.

// =================================================================================
// Core Enum Types - Match SQL Enums Exactly
// =================================================================================

// User and subscription types
export type SubscriptionPlan = 'free' | 'pro' | 'team' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'unpaid';
export type UserRole = 'free_user' | 'pro_user' | 'team_member' | 'team_manager' | 'enterprise_member' | 'enterprise_manager' | 'admin' | 'super_admin';

// Order and campaign types
export type OrderStatus = 'draft' | 'submitted' | 'processing' | 'shipped' | 'completed' | 'failed';
export type CampaignStatus = 'draft' | 'pending_payment' | 'paid' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';
export type CampaignType = 'single' | 'split' | 'recurring';
export type FulfillmentType = 'full_service' | 'ship_to_user' | 'print_only';
export type PostageType = 'first_class_forever' | 'first_class_discounted' | 'standard_class';

// Payment and processing types
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
export type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'corrected';
export type DeliveryStatus = 'pending' | 'printed' | 'shipped' | 'delivered' | 'returned';

// Data source and design types
export type SourceType = 'upload' | 'list_builder' | 'manual' | 'imported';
export type DesignType = 'letter' | 'postcard' | 'envelope' | 'self_mailer';

// Vendor and tracking types
export type VendorType = 'print' | 'skip_tracing' | 'data_enrichment' | 'mailing' | 'hybrid';
export type SkipTraceStatus = 'not_requested' | 'pending' | 'enriched' | 'failed';

// Permission and sharing types
export type PermissionLevel = 'view_only' | 'edit' | 'admin' | 'owner';
export type ResourceType = 'mailing_list' | 'template' | 'design' | 'contact_card' | 'asset';

// Tag system types
export type TagCategory = 'system' | 'list_management' | 'demographics' | 'geography' | 'campaign' | 'custom';
export type TagVisibility = 'public' | 'private' | 'system';

// RBAC and project types
export type ProjectRole = 'owner' | 'admin' | 'manager' | 'contributor' | 'viewer';
export type RbacResourceType = 'mailing_list' | 'campaign' | 'template' | 'record' | 'tag' | 'analytics' | 'design';
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage_permissions' | 'export' | 'share';

// Bulk operations types  
export type BulkOperationType = 'tag_assign' | 'tag_remove' | 'delete_records' | 'update_fields' | 'export_records' | 'deduplicate' | 'validate_addresses' | 'enrich_data';
export type BulkOperationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Access control types
export type AccessRequestStatus = 'pending' | 'approved' | 'denied' | 'expired' | 'withdrawn';

// Analytics and tracking types
export type AnalyticsEventType = 'page_view' | 'feature_use' | 'api_call' | 'export' | 'campaign_create';
export type ChangeType = 'create' | 'update' | 'delete' | 'import' | 'export' | 'deduplicate' | 'merge';

// =================================================================================
// Core Tables - Enhanced with Comprehensive Schema
// =================================================================================

export type UserProfile = {
  id: string;
  user_id: string; // Corresponds to auth.users.id
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  team_id?: string;
  role: UserRole;
  settings: Record<string, any>;
  onboarding_completed: boolean;
  last_login_at?: string;
  full_name?: string;
  company_name?: string;
  avatar_url?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type Team = {
  id: string;
  name: string;
  plan: SubscriptionPlan;
  max_seats: number;
  owner_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  settings: Record<string, any>;
  auto_grant_access: boolean;
  created_at: string;
  updated_at: string;
};

export type ContactCard = {
  id: string;
  user_id?: string;
  team_id?: string;
  name: string;
  company?: string;
  first_name: string;
  last_name: string;
  street_address: string;
  suite_unit_apt?: string;
  city: string;
  state: string;
  zip_code: string;
  email: string;
  phone: string;
  is_default: boolean;
  is_soft_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type MailingList = {
  id: string;
  user_id?: string;
  team_id?: string;
  created_by: string;
  name: string;
  description?: string;
  record_count: number;
  estimated_cost?: number;
  source_type: SourceType;
  source_criteria_id?: string; // References list_builder_criteria
  file_url?: string;
  is_active: boolean;
  last_used_at?: string;
  validation_status: ValidationStatus;
  validation_results: Record<string, any>;
  created_at: string;
  updated_at?: string;
  
  // Relations
  tags?: Tag[];
  campaigns?: Campaign[];
  records?: MailingListRecord[];
  source_criteria?: ListBuilderCriteria;
};

// =================================================================================
// List Builder System Types
// =================================================================================

export type ListBuilderCriteria = {
  id: string;
  user_id: string;
  name?: string; // For saved templates
  description?: string;
  criteria_data: Record<string, any>; // All filter criteria as JSON
  estimated_count?: number;
  last_count_check?: string;
  is_template: boolean;
  api_provider: string; // melissa, accuzip, etc
  created_at: string;
  updated_at: string;
};

export type ApiUsageTracking = {
  id: string;
  user_id?: string;
  team_id?: string;
  api_provider: string;
  endpoint: string;
  request_count: number;
  total_cost: number;
  criteria_id?: string;
  billing_period: string; // Date string
  metadata: Record<string, any>;
  created_at: string;
};

// =================================================================================
// Mailing List Records and Data Types
// =================================================================================

export type MailingListRecord = {
  id: string;
  mailing_list_id: string;
  record_data: Record<string, any>; // All record fields as JSON for flexibility
  validation_status: ValidationStatus;
  validation_results: Record<string, any>;
  skip_trace_status: SkipTraceStatus;
  skip_trace_data: Record<string, any>;
  last_used_in_campaign?: string;
  times_mailed: number;
  response_status?: string; // 'converted', 'called', 'do_not_contact', etc
  response_notes?: string;
  created_at: string;
  updated_at: string;
  
  // Enhanced tag relationships
  tags?: RecordTag[];
  mailing_list?: MailingList;
};

export type Tag = {
  id: string;
  user_id?: string;
  team_id?: string;
  name: string;
  color: string;
  description?: string;
  category: TagCategory;
  is_system: boolean;
  visibility: TagVisibility;
  parent_tag_id?: string;
  sort_order: number;
  metadata: Record<string, any>;
  created_at: string;
  
  // Relations
  parent_tag?: Tag;
  child_tags?: Tag[];
};

export type ResourceTag = {
  id: string;
  tag_id: string;
  resource_type: ResourceType;
  resource_id: string;
  created_at: string;
  
  // Relations
  tag?: Tag;
};

export type RecordTag = {
  id: string;
  record_id: string;
  tag_id: string;
  tag_value?: string;
  assigned_by?: string;
  assigned_at: string;
  metadata: Record<string, any>;
  
  // Relations
  tag?: Tag;
  record?: MailingListRecord;
  assigned_user?: UserProfile;
};

export type TagCategoryConfig = {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  is_system: boolean;
  sort_order: number;
  created_at: string;
};

// =================================================================================
// Version History & Rollback System Types (Excel-style Undo/Redo)
// =================================================================================

export type ChangeHistory = {
  id: string;
  user_id: string;
  sequence_number: number; // Global sequence for undo/redo order
  resource_type: ResourceType;
  resource_id: string;
  change_type: ChangeType;
  field_name?: string; // Specific field changed (for granular changes)
  old_value?: Record<string, any>; // Previous value
  new_value?: Record<string, any>; // New value
  batch_id?: string; // Group related changes (e.g., bulk import)
  description?: string;
  is_undoable: boolean;
  undone_at?: string; // When this change was undone
  undone_by?: string;
  created_at: string;
};

export type DataSnapshot = {
  id: string;
  resource_type: ResourceType;
  resource_id: string;
  snapshot_data: Record<string, any>; // Full state snapshot
  snapshot_type: string; // auto, manual, pre_destructive
  description?: string;
  created_by: string;
  created_at: string;
};

// =================================================================================
// Analytics & Performance Tracking Types
// =================================================================================

export type UserAnalytics = {
  id: string;
  user_id: string;
  session_id?: string;
  event_type: AnalyticsEventType;
  page_path?: string;
  feature_name?: string;
  duration_seconds?: number;
  metadata: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
};

export type CampaignMetrics = {
  id: string;
  campaign_id: string;
  response_rate?: number; // User-entered response rate (0.0-1.0)
  conversions: number;
  conversion_value?: number;
  removal_requests: number; // People who asked to be removed
  notes?: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  campaign?: Campaign;
};

export type ShortLink = {
  id: string;
  campaign_id: string;
  record_id?: string;
  short_code: string; // The "xyz123" part
  target_url: string;
  created_at: string;
  
  // Relations
  campaign?: Campaign;
  record?: MailingListRecord;
  clicks?: ShortLinkClick[];
};

export type ShortLinkClick = {
  id: string;
  short_link_id: string;
  clicked_at: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  location_data?: Record<string, any>; // Geographic data if available
  metadata: Record<string, any>;
  
  // Relations
  short_link?: ShortLink;
};

// =================================================================================
// File Assets & Media Library Types
// =================================================================================

export type UserAsset = {
  id: string;
  user_id?: string;
  team_id?: string;
  uploaded_by: string;
  filename: string;
  original_filename: string;
  file_type: string; // 'image', 'font', 'document', etc
  mime_type: string;
  file_size: number;
  file_path: string; // Storage path
  file_url: string; // Access URL
  is_public: boolean; // For team sharing
  metadata: Record<string, any>; // Dimensions, etc
  created_at: string;
  
  // Relations
  permissions?: AssetPermission[];
};

export type AssetPermission = {
  id: string;
  asset_id: string;
  user_id: string;
  permission_level: PermissionLevel;
  granted_by: string;
  created_at: string;
  
  // Relations
  asset?: UserAsset;
  user?: UserProfile;
  granted_by_user?: UserProfile;
};

// =================================================================================
// Team Collaboration & Resource Sharing Types
// =================================================================================

export type ResourcePermission = {
  id: string;
  resource_type: ResourceType;
  resource_id: string;
  user_id: string;
  permission_level: PermissionLevel;
  granted_by: string;
  auto_granted: boolean; // True if granted automatically via team membership
  created_at: string;
  
  // Relations
  user?: UserProfile;
  granted_by_user?: UserProfile;
};

export type TeamInvitation = {
  id: string;
  team_id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  expires_at: string;
  accepted_at?: string;
  accepted_by?: string;
  created_at: string;
  
  // Relations
  team?: Team;
  invited_by_user?: UserProfile;
  accepted_by_user?: UserProfile;
};

// =================================================================================
// Vendor Management System Types
// =================================================================================

export type Vendor = {
  id: string;
  name: string;
  vendor_type: VendorType;
  contact_email: string;
  contact_phone?: string;
  contact_person?: string;
  address?: string;
  services_offered: string[]; // Array of service names
  pricing_tiers: Record<string, any>; // Flexible pricing structure
  turnaround_time_days?: number;
  shipping_cost_base?: number;
  minimum_order_quantity: number;
  quality_rating: number; // 1.00 to 5.00
  is_active: boolean;
  notes?: string;
  contract_terms: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Relations
  performance_records?: VendorPerformance[];
  communications?: VendorCommunication[];
};

export type VendorPerformance = {
  id: string;
  vendor_id: string;
  order_id?: string;
  campaign_id?: string;
  metric_type: string; // 'on_time_delivery', 'quality_score', 'error_rate', etc
  metric_value: number;
  measurement_date: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
  
  // Relations
  vendor?: Vendor;
};

export type VendorCommunication = {
  id: string;
  vendor_id: string;
  order_id?: string;
  direction: string; // 'inbound', 'outbound'
  subject?: string;
  message_body?: string;
  attachments: any[]; // Array of file references
  email_metadata: Record<string, any>; // Message IDs, etc
  created_by?: string;
  created_at: string;
  
  // Relations
  vendor?: Vendor;
  created_by_user?: UserProfile;
};

// =================================================================================
// Campaign and Order Management Types
// =================================================================================

export type Campaign = {
  id: string;
  user_id?: string;
  team_id?: string;
  created_by: string;
  name: string;
  campaign_type: CampaignType;
  mailing_list_id: string;
  contact_card_id: string;
  design_data: Record<string, any>; // FPD design configuration
  design_type: DesignType;
  fulfillment_type: FulfillmentType;
  postage_type?: PostageType;
  
  // Split campaign configuration
  total_drops: number; // Number of drops for split campaigns
  drop_interval_days: number; // Days between drops
  
  // Recurring campaign settings
  parent_campaign_id?: string; // For recurring campaigns
  recurrence_count: number; // How many times to repeat
  recurrence_interval_days: number; // Days between recurrences
  
  // Dependencies
  depends_on_campaign_id?: string; // Campaign dependency
  
  status: CampaignStatus;
  total_cost?: number;
  estimated_delivery_date?: string;
  
  // Approval tracking
  design_approved_at?: string;
  design_approved_by?: string;
  final_approved_at?: string;
  final_approved_by?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  mailing_list?: MailingList;
  contact_card?: ContactCard;
  drops?: CampaignDrop[];
  parent_campaign?: Campaign;
  child_campaigns?: Campaign[];
  depends_on_campaign?: Campaign;
  dependent_campaigns?: Campaign[];
  metrics?: CampaignMetrics;
  short_links?: ShortLink[];
};

export type CampaignDrop = {
  id: string;
  campaign_id: string;
  drop_number: number; // 1, 2, 3, etc
  record_count: number;
  scheduled_mail_date?: string;
  actual_mail_date?: string;
  vendor_id?: string;
  vendor_order_id?: string; // External vendor's order ID
  status: DeliveryStatus;
  tracking_info: Record<string, any>;
  cost?: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  campaign?: Campaign;
  vendor?: Vendor;
  records?: CampaignDropRecord[];
};

export type CampaignDropRecord = {
  id: string;
  campaign_drop_id: string;
  record_id: string;
  personalized_data: Record<string, any>; // Personalization for this specific mailing
  created_at: string;
  
  // Relations
  campaign_drop?: CampaignDrop;
  record?: MailingListRecord;
};

// =================================================================================
// Payment and Billing System Types
// =================================================================================

export type PaymentTransaction = {
  id: string;
  user_id?: string;
  team_id?: string;
  campaign_id?: string;
  stripe_payment_intent_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method_id?: string;
  failure_reason?: string;
  authorized_at?: string;
  captured_at?: string;
  refunded_at?: string;
  refund_amount?: number;
  metadata: Record<string, any>;
  created_at: string;
  
  // Relations
  campaign?: Campaign;
};

// =================================================================================
// Legacy/Compatibility Types (Keeping for backward compatibility)
// =================================================================================

export type MailingListVersion = {
  id: string;
  mailing_list_id: string;
  version_number: number;
  snapshot_type: 'manual' | 'auto_save' | 'before_dedup' | 'before_merge' | 'before_delete';
  metadata?: Record<string, any>;
  record_count: number;
  records_snapshot: Record<string, any>; // JSONB compressed snapshot
  created_by?: string;
  created_at: string;
};

export type MailingListAuditLog = {
  id: string;
  mailing_list_id: string;
  record_id?: string;
  action_type: 'create' | 'update' | 'delete' | 'dedup' | 'merge' | 'restore';
  before_data?: Record<string, any>;
  after_data?: Record<string, any>;
  user_id: string;
  session_id?: string;
  created_at: string;
};

export type SavedDesign = {
  id: string;
  user_id?: string;
  team_id?: string;
  name: string;
  description?: string;
  design_type: DesignType;
  design_data: Record<string, any>; // JSONB customizer state
  thumbnail_url?: string;
  is_template: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
};

export type SystemTemplate = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  design_type: DesignType;
  design_data: Record<string, any>; // JSONB design configuration
  thumbnail_url?: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
};

export type Order = {
  id: string;
  campaign_id: string;
  user_id: string;
  stripe_payment_intent_id?: string;
  amount_authorized?: number;
  amount_captured?: number;
  payment_status: PaymentStatus;
  vendor_assignments?: Record<string, any>[]; // JSONB array
  proof_urls?: string[]; // JSONB array
  proof_approved_at?: string;
  proof_approved_by?: string;
  tracking_numbers?: string[]; // JSONB array
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
};

// Legacy usage tracking types
export type MailingListUsage = {
  id: string;
  mailing_list_id: string;
  campaign_id?: string;
  user_id: string;
  usage_type: 'campaign' | 'export' | 'preview' | 'merge' | 'split';
  record_count?: number;
  created_at: string;
};

export type RecordUsage = {
  id: string;
  record_id: string;
  campaign_id?: string;
  usage_type: 'mailed' | 'exported' | 'skip_traced';
  created_at: string;
};

export type ShortLinkTracking = {
  id: string;
  short_code: string;
  campaign_id?: string;
  record_id?: string;
  target_url?: string;
  clicks: Record<string, any>[]; // JSONB array of click data
  total_clicks: number;
  created_at: string;
};

export type SkipTraceOrder = {
  id: string;
  user_id: string;
  vendor_id?: string;
  record_ids: string[]; // Array of record IDs
  status: 'pending' | 'submitted' | 'processing' | 'completed' | 'failed';
  cost?: number;
  submitted_at?: string;
  completed_at?: string;
  results_file_url?: string;
  created_at: string;
};

export type Webhook = {
  id: string;
  user_id?: string;
  team_id?: string;
  url: string;
  events: string[]; // Array of event types
  secret?: string;
  is_active: boolean;
  retry_count: number;
  created_at: string;
};

export type WebhookDelivery = {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>; // JSONB payload
  response_status?: number;
  response_body?: string;
  delivery_attempts: number;
  delivered_at?: string;
  created_at: string;
};

// =================================================================================
// Schema Version Information
// =================================================================================

export type SchemaVersion = {
  id: string;
  version: string;
  description?: string;
  applied_at: string;
};

// =================================================================================
// Utility Types for Frontend Development
// =================================================================================

// Insert types (for creating new records)
export type InsertUserProfile = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
export type InsertTeam = Omit<Team, 'id' | 'created_at' | 'updated_at'>;
export type InsertContactCard = Omit<ContactCard, 'id' | 'created_at' | 'updated_at'>;
export type InsertMailingList = Omit<MailingList, 'id' | 'created_at' | 'updated_at' | 'tags' | 'campaigns' | 'records' | 'source_criteria'>;
export type InsertCampaign = Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'mailing_list' | 'contact_card' | 'drops' | 'parent_campaign' | 'child_campaigns' | 'depends_on_campaign' | 'dependent_campaigns' | 'metrics' | 'short_links'>;

// Update types (for updating existing records)
export type UpdateUserProfile = Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type UpdateTeam = Partial<Omit<Team, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateMailingList = Partial<Omit<MailingList, 'id' | 'created_at' | 'updated_at' | 'tags' | 'campaigns' | 'records' | 'source_criteria'>>;
export type UpdateCampaign = Partial<Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'mailing_list' | 'contact_card' | 'drops' | 'parent_campaign' | 'child_campaigns' | 'depends_on_campaign' | 'dependent_campaigns' | 'metrics' | 'short_links'>>;

// Query result types with relations
export type MailingListWithRelations = MailingList & {
  tags: Tag[];
  campaigns: Campaign[];
  records: MailingListRecord[];
  source_criteria?: ListBuilderCriteria;
};

export type CampaignWithRelations = Campaign & {
  mailing_list: MailingList;
  contact_card: ContactCard;
  drops: CampaignDrop[];
  metrics?: CampaignMetrics;
  short_links: ShortLink[];
};

// =================================================================================
// RBAC and Project System Types
// =================================================================================

export type Project = {
  id: string;
  name: string;
  description?: string;
  type: string; // 'campaign', 'template_set', 'general'
  status: string; // 'active', 'archived', 'completed'
  
  // Ownership and team association
  owner_id: string;
  team_id?: string;
  
  // Project settings
  is_public: boolean;
  settings: Record<string, any>;
  
  // Metadata
  created_at: string;
  updated_at: string;
  archived_at?: string;
  
  // Relations
  owner?: UserProfile;
  team?: Team;
  members?: ProjectMember[];
  mailing_lists?: MailingList[];
  tags?: Tag[];
};

export type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  
  // Permission overrides (JSON object with resource_type -> permissions mapping)
  permission_overrides: Record<string, Record<string, boolean>>;
  
  // Invitation and membership metadata
  invited_by?: string;
  invited_at: string;
  joined_at?: string;
  
  // Relations
  project?: Project;
  user?: UserProfile;
  invited_by_user?: UserProfile;
};

export type RolePermission = {
  id: string;
  role: ProjectRole;
  resource_type: RbacResourceType;
  action: PermissionAction;
  allowed: boolean;
};

// User project view with role information
export type UserProject = Project & {
  user_role?: ProjectRole;
  permission_overrides?: Record<string, Record<string, boolean>>;
  member_since?: string;
};

// Project member summary
export type ProjectMemberSummary = {
  project_id: string;
  project_name: string;
  member_count: number;
  owners: number;
  admins: number;
  managers: number;
  contributors: number;
  viewers: number;
};

// Permission check helper type
export type PermissionCheck = {
  user_id: string;
  project_id: string;
  resource_type: RbacResourceType;
  action: PermissionAction;
  allowed: boolean;
};

// Insert and update types for RBAC tables
export type InsertProject = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'owner' | 'team' | 'members' | 'mailing_lists' | 'tags'>;
export type UpdateProject = Partial<Omit<Project, 'id' | 'created_at' | 'updated_at' | 'owner_id' | 'owner' | 'team' | 'members' | 'mailing_lists' | 'tags'>>;

export type InsertProjectMember = Omit<ProjectMember, 'id' | 'invited_at' | 'project' | 'user' | 'invited_by_user'>;
export type UpdateProjectMember = Partial<Omit<ProjectMember, 'id' | 'project_id' | 'user_id' | 'invited_at' | 'project' | 'user' | 'invited_by_user'>>;

// Bulk operations types
export type BulkOperation = {
  id: string;
  user_id: string;
  type: BulkOperationType;
  target_count: number;
  processed_count: number;
  success_count: number;
  error_count: number;
  status: BulkOperationStatus;
  progress_percentage: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type BulkOperationBatch = {
  id: string;
  operation_id: string;
  batch_number: number;
  batch_size: number;
  processed_count: number;
  success_count: number;
  error_count: number;
  status: BulkOperationStatus;
  started_at?: string;
  completed_at?: string;
  errors: Array<{ record_id: string; error: string }>;
  metadata: Record<string, any>;
  created_at: string;
};

export type UserOperationLimits = {
  id: string;
  user_id: string;
  operations_this_minute: number;
  records_this_minute: number;
  active_operations: number;
  last_reset_at: string;
  total_operations_today: number;
  last_daily_reset_at: string;
  created_at: string;
  updated_at: string;
};

export type BulkOperationConfig = {
  id: string;
  operation_type: BulkOperationType;
  batch_size: number;
  max_concurrent: number;
  timeout_minutes: number;
  retry_attempts: number;
  rate_limit_per_minute: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

// Insert and update types for bulk operations
export type InsertBulkOperation = Omit<BulkOperation, 'id' | 'created_at' | 'updated_at'>;
export type UpdateBulkOperation = Partial<Omit<BulkOperation, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// =================================================================================
// Export All Types
// =================================================================================

// Re-export everything for convenience
export type {
  // Core enums are already exported above
};

// Database table interfaces
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: InsertUserProfile;
        Update: UpdateUserProfile;
      };
      teams: {
        Row: Team;
        Insert: InsertTeam;
        Update: UpdateTeam;
      };
      contact_cards: {
        Row: ContactCard;
        Insert: InsertContactCard;
        Update: Partial<InsertContactCard>;
      };
      mailing_lists: {
        Row: MailingList;
        Insert: InsertMailingList;
        Update: UpdateMailingList;
      };
      mailing_list_records: {
        Row: MailingListRecord;
        Insert: Omit<MailingListRecord, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MailingListRecord, 'id' | 'created_at' | 'updated_at'>>;
      };
      list_builder_criteria: {
        Row: ListBuilderCriteria;
        Insert: Omit<ListBuilderCriteria, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ListBuilderCriteria, 'id' | 'created_at' | 'updated_at'>>;
      };
      campaigns: {
        Row: Campaign;
        Insert: InsertCampaign;
        Update: UpdateCampaign;
      };
      tags: {
        Row: Tag;
        Insert: Omit<Tag, 'id' | 'created_at' | 'parent_tag' | 'child_tags'>;
        Update: Partial<Omit<Tag, 'id' | 'created_at' | 'parent_tag' | 'child_tags'>>;
      };
      resource_tags: {
        Row: ResourceTag;
        Insert: Omit<ResourceTag, 'id' | 'created_at' | 'tag'>;
        Update: Partial<Omit<ResourceTag, 'id' | 'created_at' | 'tag'>>;
      };
      record_tags: {
        Row: RecordTag;
        Insert: Omit<RecordTag, 'id' | 'assigned_at' | 'tag' | 'record' | 'assigned_user'>;
        Update: Partial<Omit<RecordTag, 'id' | 'assigned_at' | 'tag' | 'record' | 'assigned_user'>>;
      };
      tag_categories: {
        Row: TagCategoryConfig;
        Insert: Omit<TagCategoryConfig, 'id' | 'created_at'>;
        Update: Partial<Omit<TagCategoryConfig, 'id' | 'created_at'>>;
      };
      projects: {
        Row: Project;
        Insert: InsertProject;
        Update: UpdateProject;
      };
      project_members: {
        Row: ProjectMember;
        Insert: InsertProjectMember;
        Update: UpdateProjectMember;
      };
      role_permissions: {
        Row: RolePermission;
        Insert: Omit<RolePermission, 'id'>;
        Update: Partial<Omit<RolePermission, 'id'>>;
      };
      bulk_operations: {
        Row: BulkOperation;
        Insert: InsertBulkOperation;
        Update: UpdateBulkOperation;
      };
      bulk_operation_batches: {
        Row: BulkOperationBatch;
        Insert: Omit<BulkOperationBatch, 'id' | 'created_at'>;
        Update: Partial<Omit<BulkOperationBatch, 'id' | 'created_at'>>;
      };
      user_operation_limits: {
        Row: UserOperationLimits;
        Insert: Omit<UserOperationLimits, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserOperationLimits, 'id' | 'created_at' | 'updated_at'>>;
      };
      bulk_operation_config: {
        Row: BulkOperationConfig;
        Insert: Omit<BulkOperationConfig, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BulkOperationConfig, 'id' | 'created_at' | 'updated_at'>>;
      };
      // Add other tables as needed...
    };
  };
}