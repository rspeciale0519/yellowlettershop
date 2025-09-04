-- =================================================================================
-- Yellow Letter Shop (YLS) - Comprehensive Database Schema
-- Migration: 003_comprehensive_database_schema.sql
-- =================================================================================
-- This migration creates the complete database schema for the YLS platform
-- including all features: mailing lists, campaigns, list builder, version history,
-- analytics, team collaboration, vendor management, and file assets.

-- =================================================================================
-- Core Enums and Types
-- =================================================================================

-- User and subscription types
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'team', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'unpaid');
CREATE TYPE user_role AS ENUM ('free_user', 'pro_user', 'team_member', 'team_manager', 'enterprise_member', 'enterprise_manager', 'admin', 'super_admin');

-- Order and campaign types
CREATE TYPE order_status AS ENUM ('draft', 'submitted', 'processing', 'shipped', 'completed', 'failed');
CREATE TYPE campaign_status AS ENUM ('draft', 'pending_payment', 'paid', 'in_production', 'shipped', 'delivered', 'cancelled');
CREATE TYPE campaign_type AS ENUM ('single', 'split', 'recurring');
CREATE TYPE fulfillment_type AS ENUM ('full_service', 'ship_to_user', 'print_only');
CREATE TYPE postage_type AS ENUM ('first_class_forever', 'first_class_discounted', 'standard_class');

-- Payment and processing types
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'failed', 'refunded');
CREATE TYPE validation_status AS ENUM ('pending', 'valid', 'invalid', 'corrected');
CREATE TYPE delivery_status AS ENUM ('pending', 'printed', 'shipped', 'delivered', 'returned');

-- Data source and design types
CREATE TYPE source_type AS ENUM ('upload', 'list_builder', 'manual', 'imported');
CREATE TYPE design_type AS ENUM ('letter', 'postcard', 'envelope', 'self_mailer');

-- Vendor and tracking types
CREATE TYPE vendor_type AS ENUM ('print', 'skip_tracing', 'data_enrichment', 'mailing', 'hybrid');
CREATE TYPE skip_trace_status AS ENUM ('not_requested', 'pending', 'enriched', 'failed');

-- Permission and sharing types
CREATE TYPE permission_level AS ENUM ('view_only', 'edit', 'admin', 'owner');
CREATE TYPE resource_type AS ENUM ('mailing_list', 'template', 'design', 'contact_card', 'asset');

-- Analytics and tracking types
CREATE TYPE analytics_event_type AS ENUM ('page_view', 'feature_use', 'api_call', 'export', 'campaign_create');
CREATE TYPE change_type AS ENUM ('create', 'update', 'delete', 'import', 'export', 'deduplicate', 'merge');

-- =================================================================================
-- Core Tables (Enhanced/Updated)
-- =================================================================================

-- Enhanced user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    subscription_plan subscription_plan DEFAULT 'free' NOT NULL,
    subscription_status subscription_status DEFAULT 'active' NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    team_id uuid,
    role user_role DEFAULT 'free_user' NOT NULL,
    settings jsonb DEFAULT '{}' NOT NULL,
    onboarding_completed boolean DEFAULT false NOT NULL,
    last_login_at timestamp with time zone,
    full_name text,
    company_name text,
    avatar_url text,
    timezone text DEFAULT 'America/New_York',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enhanced teams table
CREATE TABLE IF NOT EXISTS teams (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    plan subscription_plan DEFAULT 'team' NOT NULL,
    max_seats integer DEFAULT 3 NOT NULL,
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    settings jsonb DEFAULT '{}' NOT NULL,
    auto_grant_access boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enhanced contact cards table
CREATE TABLE IF NOT EXISTS contact_cards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    name text NOT NULL,
    company text,
    first_name text NOT NULL,
    last_name text NOT NULL,
    street_address text NOT NULL,
    suite_unit_apt text,
    city text NOT NULL,
    state text NOT NULL,
    zip_code text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_soft_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contact_cards_owner_check CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR 
        (user_id IS NULL AND team_id IS NOT NULL)
    )
);

-- Enhanced mailing lists table
CREATE TABLE IF NOT EXISTS mailing_lists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    created_by uuid REFERENCES auth.users(id) NOT NULL,
    name text NOT NULL,
    description text,
    record_count integer DEFAULT 0 NOT NULL,
    estimated_cost decimal(10,2),
    source_type source_type DEFAULT 'upload' NOT NULL,
    source_criteria_id uuid, -- References list_builder_criteria
    file_url text,
    is_active boolean DEFAULT true NOT NULL,
    last_used_at timestamp with time zone,
    validation_status validation_status DEFAULT 'pending',
    validation_results jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mailing_lists_owner_check CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR 
        (user_id IS NULL AND team_id IS NOT NULL)
    )
);

-- =================================================================================
-- List Builder System
-- =================================================================================

-- List builder criteria storage (JSONB for complex search criteria)
CREATE TABLE list_builder_criteria (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text, -- For saved templates
    description text,
    criteria_data jsonb NOT NULL, -- All filter criteria as JSON
    estimated_count integer,
    last_count_check timestamp with time zone,
    is_template boolean DEFAULT false, -- True for saved templates
    api_provider text DEFAULT 'melissa' NOT NULL, -- melissa, accuzip, etc
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- API usage tracking for billing
CREATE TABLE api_usage_tracking (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    api_provider text NOT NULL, -- melissa, accuzip, etc
    endpoint text NOT NULL,
    request_count integer DEFAULT 1 NOT NULL,
    total_cost decimal(10,4) DEFAULT 0 NOT NULL,
    criteria_id uuid REFERENCES list_builder_criteria(id),
    billing_period date DEFAULT date_trunc('month', now()) NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT api_usage_owner_check CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR 
        (user_id IS NULL AND team_id IS NOT NULL)
    )
);

-- =================================================================================
-- Mailing List Records and Data
-- =================================================================================

-- Mailing list records with flexible JSONB structure
CREATE TABLE mailing_list_records (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    mailing_list_id uuid REFERENCES mailing_lists(id) ON DELETE CASCADE NOT NULL,
    record_data jsonb NOT NULL, -- All record fields as JSON for flexibility
    validation_status validation_status DEFAULT 'pending',
    validation_results jsonb DEFAULT '{}',
    skip_trace_status skip_trace_status DEFAULT 'not_requested',
    skip_trace_data jsonb DEFAULT '{}',
    last_used_in_campaign timestamp with time zone,
    times_mailed integer DEFAULT 0 NOT NULL,
    response_status text, -- 'converted', 'called', 'do_not_contact', etc
    response_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tags system for flexible categorization
CREATE TABLE tags (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    name text NOT NULL,
    color text DEFAULT '#3B82F6', -- Hex color code
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tags_owner_check CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR 
        (user_id IS NULL AND team_id IS NOT NULL)
    ),
    CONSTRAINT unique_tag_name_per_owner UNIQUE (user_id, team_id, name)
);

-- Many-to-many relationship for tagging resources
CREATE TABLE resource_tags (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
    resource_type resource_type NOT NULL,
    resource_id uuid NOT NULL, -- Can reference mailing_lists, campaigns, etc
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(tag_id, resource_type, resource_id)
);

-- =================================================================================
-- Version History & Rollback System (Excel-style Undo/Redo)
-- =================================================================================

-- Sequential operation log for granular undo/redo
CREATE TABLE change_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sequence_number bigserial NOT NULL, -- Global sequence for undo/redo order
    resource_type resource_type NOT NULL,
    resource_id uuid NOT NULL,
    change_type change_type NOT NULL,
    field_name text, -- Specific field changed (for granular changes)
    old_value jsonb, -- Previous value
    new_value jsonb, -- New value
    batch_id uuid, -- Group related changes (e.g., bulk import)
    description text,
    is_undoable boolean DEFAULT true NOT NULL,
    undone_at timestamp with time zone, -- When this change was undone
    undone_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Snapshots for quick restore points
CREATE TABLE data_snapshots (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_type resource_type NOT NULL,
    resource_id uuid NOT NULL,
    snapshot_data jsonb NOT NULL, -- Full state snapshot
    snapshot_type text DEFAULT 'auto' NOT NULL, -- auto, manual, pre_destructive
    description text,
    created_by uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- =================================================================================
-- Analytics & Performance Tracking
-- =================================================================================

-- User engagement analytics
CREATE TABLE user_analytics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id text,
    event_type analytics_event_type NOT NULL,
    page_path text,
    feature_name text,
    duration_seconds integer,
    metadata jsonb DEFAULT '{}',
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Campaign performance metrics
CREATE TABLE campaign_metrics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id uuid NOT NULL, -- References campaigns table
    response_rate decimal(5,4), -- User-entered response rate (0.0-1.0)
    conversions integer DEFAULT 0,
    conversion_value decimal(10,2),
    removal_requests integer DEFAULT 0, -- People who asked to be removed
    notes text,
    updated_by uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Short link tracking (yls.to/xyz123 system)
CREATE TABLE short_links (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id uuid NOT NULL, -- References campaigns table
    record_id uuid REFERENCES mailing_list_records(id),
    short_code text UNIQUE NOT NULL, -- The "xyz123" part
    target_url text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Short link click analytics
CREATE TABLE short_link_clicks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    short_link_id uuid REFERENCES short_links(id) ON DELETE CASCADE NOT NULL,
    clicked_at timestamp with time zone DEFAULT now() NOT NULL,
    ip_address inet,
    user_agent text,
    referrer text,
    location_data jsonb, -- Geographic data if available
    metadata jsonb DEFAULT '{}'
);

-- =================================================================================
-- File Assets & Media Library
-- =================================================================================

-- User/team asset storage
CREATE TABLE user_assets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    uploaded_by uuid REFERENCES auth.users(id) NOT NULL,
    filename text NOT NULL,
    original_filename text NOT NULL,
    file_type text NOT NULL, -- 'image', 'font', 'document', etc
    mime_type text NOT NULL,
    file_size bigint NOT NULL,
    file_path text NOT NULL, -- Storage path
    file_url text NOT NULL, -- Access URL
    is_public boolean DEFAULT false, -- For team sharing
    metadata jsonb DEFAULT '{}', -- Dimensions, etc
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_assets_owner_check CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR 
        (user_id IS NULL AND team_id IS NOT NULL)
    )
);

-- Asset permissions for granular access control
CREATE TABLE asset_permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id uuid REFERENCES user_assets(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    permission_level permission_level DEFAULT 'view_only' NOT NULL,
    granted_by uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(asset_id, user_id)
);

-- =================================================================================
-- Team Collaboration & Resource Sharing
-- =================================================================================

-- Resource sharing permissions
CREATE TABLE resource_permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_type resource_type NOT NULL,
    resource_id uuid NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    permission_level permission_level DEFAULT 'view_only' NOT NULL,
    granted_by uuid REFERENCES auth.users(id) NOT NULL,
    auto_granted boolean DEFAULT false, -- True if granted automatically via team membership
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(resource_type, resource_id, user_id)
);

-- Team invitations
CREATE TABLE team_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    email text NOT NULL,
    role user_role DEFAULT 'team_member' NOT NULL,
    invited_by uuid REFERENCES auth.users(id) NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + interval '7 days') NOT NULL,
    accepted_at timestamp with time zone,
    accepted_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- =================================================================================
-- Vendor Management System
-- =================================================================================

-- Comprehensive vendor directory
CREATE TABLE vendors (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    vendor_type vendor_type NOT NULL,
    contact_email text NOT NULL,
    contact_phone text,
    contact_person text,
    address text,
    services_offered text[], -- Array of service names
    pricing_tiers jsonb DEFAULT '{}', -- Flexible pricing structure
    turnaround_time_days integer,
    shipping_cost_base decimal(10,2),
    minimum_order_quantity integer DEFAULT 1,
    quality_rating decimal(3,2) DEFAULT 5.00, -- 1.00 to 5.00
    is_active boolean DEFAULT true,
    notes text,
    contract_terms jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Vendor performance tracking
CREATE TABLE vendor_performance (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
    order_id uuid, -- References orders table when created
    campaign_id uuid, -- References campaigns table when created
    metric_type text NOT NULL, -- 'on_time_delivery', 'quality_score', 'error_rate', etc
    metric_value decimal(10,4) NOT NULL,
    measurement_date date DEFAULT current_date NOT NULL,
    notes text,
    recorded_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Vendor communication history
CREATE TABLE vendor_communications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
    order_id uuid, -- References orders table when created
    direction text NOT NULL, -- 'inbound', 'outbound'
    subject text,
    message_body text,
    attachments jsonb DEFAULT '[]', -- Array of file references
    email_metadata jsonb DEFAULT '{}', -- Message IDs, etc
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- =================================================================================
-- Campaign and Order Management
-- =================================================================================

-- Enhanced campaigns table
CREATE TABLE campaigns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    created_by uuid REFERENCES auth.users(id) NOT NULL,
    name text NOT NULL,
    campaign_type campaign_type DEFAULT 'single' NOT NULL,
    mailing_list_id uuid REFERENCES mailing_lists(id) NOT NULL,
    contact_card_id uuid REFERENCES contact_cards(id) NOT NULL,
    design_data jsonb DEFAULT '{}', -- FPD design configuration
    design_type design_type DEFAULT 'letter' NOT NULL,
    fulfillment_type fulfillment_type DEFAULT 'full_service' NOT NULL,
    postage_type postage_type DEFAULT 'first_class_forever',
    
    -- Split campaign configuration
    total_drops integer DEFAULT 1, -- Number of drops for split campaigns
    drop_interval_days integer DEFAULT 7, -- Days between drops
    
    -- Recurring campaign settings
    parent_campaign_id uuid REFERENCES campaigns(id), -- For recurring campaigns
    recurrence_count integer DEFAULT 1, -- How many times to repeat
    recurrence_interval_days integer DEFAULT 30, -- Days between recurrences
    
    -- Dependencies
    depends_on_campaign_id uuid REFERENCES campaigns(id), -- Campaign dependency
    
    status campaign_status DEFAULT 'draft' NOT NULL,
    total_cost decimal(10,2),
    estimated_delivery_date date,
    
    -- Approval tracking
    design_approved_at timestamp with time zone,
    design_approved_by uuid REFERENCES auth.users(id),
    final_approved_at timestamp with time zone,
    final_approved_by uuid REFERENCES auth.users(id),
    
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT campaigns_owner_check CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR 
        (user_id IS NULL AND team_id IS NOT NULL)
    )
);

-- Campaign drops for split campaigns (one campaign, multiple drops)
CREATE TABLE campaign_drops (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
    drop_number integer NOT NULL, -- 1, 2, 3, etc
    record_count integer NOT NULL,
    scheduled_mail_date date,
    actual_mail_date date,
    vendor_id uuid REFERENCES vendors(id),
    vendor_order_id text, -- External vendor's order ID
    status delivery_status DEFAULT 'pending' NOT NULL,
    tracking_info jsonb DEFAULT '{}',
    cost decimal(10,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(campaign_id, drop_number)
);

-- Records included in specific campaign drops
CREATE TABLE campaign_drop_records (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_drop_id uuid REFERENCES campaign_drops(id) ON DELETE CASCADE NOT NULL,
    record_id uuid REFERENCES mailing_list_records(id) ON DELETE CASCADE NOT NULL,
    personalized_data jsonb DEFAULT '{}', -- Personalization for this specific mailing
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(campaign_drop_id, record_id)
);

-- =================================================================================
-- Payment and Billing System
-- =================================================================================

-- Payment transactions
CREATE TABLE payment_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    campaign_id uuid REFERENCES campaigns(id),
    stripe_payment_intent_id text UNIQUE,
    amount decimal(10,2) NOT NULL,
    currency text DEFAULT 'USD' NOT NULL,
    status payment_status DEFAULT 'pending' NOT NULL,
    payment_method_id text,
    failure_reason text,
    authorized_at timestamp with time zone,
    captured_at timestamp with time zone,
    refunded_at timestamp with time zone,
    refund_amount decimal(10,2),
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payment_owner_check CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR 
        (user_id IS NULL AND team_id IS NOT NULL)
    )
);

-- =================================================================================
-- Indexes for Performance
-- =================================================================================

-- User and team indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_team_id ON user_profiles(team_id);
CREATE INDEX idx_teams_owner_id ON teams(owner_id);

-- Mailing list indexes
CREATE INDEX idx_mailing_lists_user_id ON mailing_lists(user_id);
CREATE INDEX idx_mailing_lists_team_id ON mailing_lists(team_id);
CREATE INDEX idx_mailing_lists_created_by ON mailing_lists(created_by);
CREATE INDEX idx_mailing_list_records_mailing_list_id ON mailing_list_records(mailing_list_id);

-- Campaign indexes
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_team_id ON campaigns(team_id);
CREATE INDEX idx_campaigns_mailing_list_id ON campaigns(mailing_list_id);
CREATE INDEX idx_campaigns_parent_campaign_id ON campaigns(parent_campaign_id);
CREATE INDEX idx_campaign_drops_campaign_id ON campaign_drops(campaign_id);
CREATE INDEX idx_campaign_drop_records_drop_id ON campaign_drop_records(campaign_drop_id);

-- Version history indexes (critical for performance)
CREATE INDEX idx_change_history_user_id ON change_history(user_id);
CREATE INDEX idx_change_history_sequence ON change_history(sequence_number);
CREATE INDEX idx_change_history_resource ON change_history(resource_type, resource_id);
CREATE INDEX idx_change_history_batch ON change_history(batch_id);

-- Analytics indexes
CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_event_time ON user_analytics(event_type, created_at);
CREATE INDEX idx_short_link_clicks_link_id ON short_link_clicks(short_link_id);
CREATE INDEX idx_api_usage_user_team ON api_usage_tracking(user_id, team_id);
CREATE INDEX idx_api_usage_billing_period ON api_usage_tracking(billing_period);

-- Asset and permission indexes
CREATE INDEX idx_user_assets_user_id ON user_assets(user_id);
CREATE INDEX idx_user_assets_team_id ON user_assets(team_id);
CREATE INDEX idx_resource_permissions_resource ON resource_permissions(resource_type, resource_id);
CREATE INDEX idx_asset_permissions_asset_id ON asset_permissions(asset_id);

-- Vendor indexes
CREATE INDEX idx_vendor_performance_vendor_id ON vendor_performance(vendor_id);
CREATE INDEX idx_vendor_communications_vendor_id ON vendor_communications(vendor_id);

-- =================================================================================
-- Row Level Security (RLS) Policies
-- =================================================================================

-- Enable RLS on all major tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailing_list_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_builder_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_drop_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- User profiles - users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.user_id = auth.uid() 
        AND up.role IN ('admin', 'super_admin')
    )
);

-- Teams - members can view their team
CREATE POLICY "Team members can view own team" ON teams FOR SELECT USING (
    id IN (
        SELECT team_id FROM user_profiles 
        WHERE user_id = auth.uid() AND team_id IS NOT NULL
    )
);
CREATE POLICY "Team owners can update team" ON teams FOR UPDATE USING (owner_id = auth.uid());

-- Contact cards - user/team scoped access
CREATE POLICY "Contact cards user access" ON contact_cards FOR ALL USING (
    user_id = auth.uid() OR 
    team_id IN (
        SELECT team_id FROM user_profiles 
        WHERE user_id = auth.uid() AND team_id IS NOT NULL
    )
);

-- Mailing lists - user/team scoped access
CREATE POLICY "Mailing lists user access" ON mailing_lists FOR ALL USING (
    user_id = auth.uid() OR 
    team_id IN (
        SELECT team_id FROM user_profiles 
        WHERE user_id = auth.uid() AND team_id IS NOT NULL
    )
);

-- Mailing list records - access through parent list
CREATE POLICY "Mailing list records access" ON mailing_list_records FOR ALL USING (
    mailing_list_id IN (
        SELECT id FROM mailing_lists 
        WHERE user_id = auth.uid() OR 
        team_id IN (
            SELECT team_id FROM user_profiles 
            WHERE user_id = auth.uid() AND team_id IS NOT NULL
        )
    )
);

-- List builder criteria - user only
CREATE POLICY "List builder criteria user access" ON list_builder_criteria FOR ALL USING (user_id = auth.uid());

-- API usage tracking - user/team scoped
CREATE POLICY "API usage tracking access" ON api_usage_tracking FOR ALL USING (
    user_id = auth.uid() OR 
    team_id IN (
        SELECT team_id FROM user_profiles 
        WHERE user_id = auth.uid() AND team_id IS NOT NULL
    )
);

-- Tags - user/team scoped
CREATE POLICY "Tags access" ON tags FOR ALL USING (
    user_id = auth.uid() OR 
    team_id IN (
        SELECT team_id FROM user_profiles 
        WHERE user_id = auth.uid() AND team_id IS NOT NULL
    )
);

-- Change history - user scoped
CREATE POLICY "Change history user access" ON change_history FOR ALL USING (user_id = auth.uid());

-- User analytics - own data only
CREATE POLICY "User analytics own access" ON user_analytics FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admin analytics access" ON user_analytics FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.user_id = auth.uid() 
        AND up.role IN ('admin', 'super_admin')
    )
);

-- Campaigns - user/team scoped
CREATE POLICY "Campaigns access" ON campaigns FOR ALL USING (
    user_id = auth.uid() OR 
    team_id IN (
        SELECT team_id FROM user_profiles 
        WHERE user_id = auth.uid() AND team_id IS NOT NULL
    )
);

-- Campaign drops - access through parent campaign
CREATE POLICY "Campaign drops access" ON campaign_drops FOR ALL USING (
    campaign_id IN (
        SELECT id FROM campaigns 
        WHERE user_id = auth.uid() OR 
        team_id IN (
            SELECT team_id FROM user_profiles 
            WHERE user_id = auth.uid() AND team_id IS NOT NULL
        )
    )
);

-- User assets - user/team scoped with permissions
CREATE POLICY "User assets owner access" ON user_assets FOR ALL USING (
    user_id = auth.uid() OR 
    team_id IN (
        SELECT team_id FROM user_profiles 
        WHERE user_id = auth.uid() AND team_id IS NOT NULL
    )
);

-- Payment transactions - user/team scoped
CREATE POLICY "Payment transactions access" ON payment_transactions FOR ALL USING (
    user_id = auth.uid() OR 
    team_id IN (
        SELECT team_id FROM user_profiles 
        WHERE user_id = auth.uid() AND team_id IS NOT NULL
    )
);

-- =================================================================================
-- Triggers for Updated_At Timestamps
-- =================================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at columns
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_cards_updated_at BEFORE UPDATE ON contact_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mailing_lists_updated_at BEFORE UPDATE ON mailing_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mailing_list_records_updated_at BEFORE UPDATE ON mailing_list_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_list_builder_criteria_updated_at BEFORE UPDATE ON list_builder_criteria FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_drops_updated_at BEFORE UPDATE ON campaign_drops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_metrics_updated_at BEFORE UPDATE ON campaign_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================================
-- Functions for Common Operations
-- =================================================================================

-- Function to automatically grant team permissions for new resources
CREATE OR REPLACE FUNCTION auto_grant_team_permissions()
RETURNS TRIGGER AS $$
DECLARE
    team_settings jsonb;
BEGIN
    -- Only proceed if this is a team resource
    IF NEW.team_id IS NOT NULL THEN
        -- Get team auto-grant setting
        SELECT settings INTO team_settings FROM teams WHERE id = NEW.team_id;
        
        IF (team_settings->>'auto_grant_access')::boolean = true THEN
            -- Grant view permissions to all team members
            INSERT INTO resource_permissions (resource_type, resource_id, user_id, permission_level, granted_by, auto_granted)
            SELECT 
                CASE 
                    WHEN TG_TABLE_NAME = 'mailing_lists' THEN 'mailing_list'::resource_type
                    WHEN TG_TABLE_NAME = 'campaigns' THEN 'template'::resource_type -- Adjust as needed
                    ELSE 'mailing_list'::resource_type -- Default
                END,
                NEW.id,
                up.user_id,
                'view_only'::permission_level,
                NEW.created_by,
                true
            FROM user_profiles up
            WHERE up.team_id = NEW.team_id
            AND up.user_id != NEW.created_by; -- Don't grant to creator (they already have owner access)
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-granting permissions
CREATE TRIGGER auto_grant_mailing_list_permissions
    AFTER INSERT ON mailing_lists
    FOR EACH ROW EXECUTE FUNCTION auto_grant_team_permissions();

CREATE TRIGGER auto_grant_campaign_permissions
    AFTER INSERT ON campaigns
    FOR EACH ROW EXECUTE FUNCTION auto_grant_team_permissions();

-- =================================================================================
-- Initial Data and Configuration
-- =================================================================================

-- Insert default vendor (placeholder)
INSERT INTO vendors (name, vendor_type, contact_email, services_offered) VALUES
('Default Print Vendor', 'print', 'orders@printvendor.com', ARRAY['printing', 'mailing']);

-- =================================================================================
-- Comments and Documentation
-- =================================================================================

COMMENT ON TABLE user_profiles IS 'Enhanced user profiles with subscription and team information';
COMMENT ON TABLE teams IS 'Team/organization management with subscription plans';
COMMENT ON TABLE list_builder_criteria IS 'Stores complex search criteria for MelissaData API list building';
COMMENT ON TABLE api_usage_tracking IS 'Tracks API usage per user/team for billing purposes';
COMMENT ON TABLE change_history IS 'Sequential change log for Excel-style undo/redo functionality';
COMMENT ON TABLE data_snapshots IS 'Point-in-time snapshots for quick restore operations';
COMMENT ON TABLE user_analytics IS 'User engagement tracking for admin dashboard analytics';
COMMENT ON TABLE short_links IS 'Short URL system (yls.to/xyz123) for tracking mail piece engagement';
COMMENT ON TABLE vendor_performance IS 'Tracks vendor performance metrics for quality assurance';
COMMENT ON TABLE campaign_drops IS 'Manages individual drops within split campaigns';
COMMENT ON TABLE resource_permissions IS 'Granular permissions system for team collaboration';

-- =================================================================================
-- Schema Version Information
-- =================================================================================

-- Track schema version for future migrations
CREATE TABLE IF NOT EXISTS schema_version (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    version text NOT NULL,
    description text,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);

INSERT INTO schema_version (version, description) VALUES 
('003', 'Comprehensive YLS database schema with all core features');

-- =================================================================================
-- Completion Notice
-- =================================================================================

-- This completes the comprehensive database schema for Yellow Letter Shop
-- The schema supports all major features:
-- ✅ Enhanced user profiles and team management
-- ✅ List builder with MelissaData integration
-- ✅ Excel-style version history and rollback
-- ✅ Comprehensive analytics and performance tracking  
-- ✅ File assets and media library with permissions
-- ✅ Team collaboration and resource sharing
-- ✅ Vendor management and performance tracking
-- ✅ Campaign management with split and recurring support
-- ✅ Payment processing and billing integration
-- ✅ Row Level Security for multi-tenant isolation
-- ✅ Performance optimized with proper indexing
-- ✅ Auto-updating timestamps and permission management

SELECT 'YLS Database Schema Migration 003 completed successfully!' AS status;