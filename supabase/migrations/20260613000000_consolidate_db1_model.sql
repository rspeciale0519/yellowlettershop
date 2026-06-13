-- Consolidation: DB1 normalized domain model → YLS-owned DB2.
-- Keeps DB2 user_profiles + keepers (pricing_config/order_drafts/admin_audit_log/
-- user_credits/user_notes/design_templates/pricing_change_log) + all DB2 data.
-- Replaces DB2's 4 EMPTY overlap tables with DB1's versions. Idempotent + transactional.
begin;

-- ENUMS
do $$ begin if not exists (select 1 from pg_type where typname='campaign_status') then create type public.campaign_status as enum ('draft', 'scheduled', 'sending', 'sent', 'archived'); end if; end $$;
do $$ begin if not exists (select 1 from pg_type where typname='order_status') then create type public.order_status as enum ('draft', 'submitted', 'processing', 'shipped', 'completed', 'failed'); end if; end $$;

-- FUNCTIONS (DB1)
CREATE OR REPLACE FUNCTION public.create_audit_log_entry()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO mailing_list_audit_log (
            mailing_list_id, record_id, action_type, after_data, user_id
        ) VALUES (
            NEW.mailing_list_id, NEW.id, 'create', to_jsonb(NEW), auth.uid()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO mailing_list_audit_log (
            mailing_list_id, record_id, action_type, before_data, after_data, user_id
        ) VALUES (
            NEW.mailing_list_id, NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), auth.uid()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO mailing_list_audit_log (
            mailing_list_id, record_id, action_type, before_data, user_id
        ) VALUES (
            OLD.mailing_list_id, OLD.id, 'delete', to_jsonb(OLD), auth.uid()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;
CREATE OR REPLACE FUNCTION public.update_mailing_list_record_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE mailing_lists 
        SET record_count = record_count + 1,
            updated_at = NOW()
        WHERE id = NEW.mailing_list_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE mailing_lists 
        SET record_count = record_count - 1,
            updated_at = NOW()
        WHERE id = OLD.mailing_list_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- DROP DB2's empty overlap tables (verified 0 rows) to replace with DB1's
drop table if exists public.orders cascade;
drop table if exists public.campaigns cascade;
drop table if exists public.contact_cards cascade;
drop table if exists public.mailing_lists cascade;

-- Augment DB2's kept user_profiles with team_id so DB1 team-scoped
-- policies work (DB1 policies are rewritten to user_profiles.user_id below).
alter table public.user_profiles add column if not exists team_id uuid;

-- TABLES (columns only; constraints added after)
create table if not exists public.campaign_mailing_lists (
  campaign_id uuid not null,
  mailing_list_id uuid not null,
  added_at timestamp with time zone default now()
);
create table if not exists public.campaign_records (
  id uuid default uuid_generate_v4() not null,
  campaign_id uuid,
  record_id uuid,
  mailing_list_id uuid,
  drop_number integer,
  scheduled_date timestamp with time zone,
  short_link_code text,
  delivery_status text default 'pending'::text,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone default now()
);
create table if not exists public.campaigns (
  id uuid default gen_random_uuid() not null,
  name varchar(255) not null,
  description text,
  type varchar(50),
  metadata jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid,
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  completed_at timestamp with time zone,
  active_order_id uuid,
  status campaign_status default 'draft'::campaign_status,
  team_id uuid,
  contact_card_id uuid,
  design_id uuid,
  campaign_type text,
  split_config jsonb,
  repeat_config jsonb,
  fulfillment_type text,
  postage_type text,
  total_records integer default 0,
  estimated_cost numeric(10,2),
  actual_cost numeric(10,2),
  scheduled_start_date timestamp with time zone,
  execution_dates jsonb
);
create table if not exists public.contact_cards (
  id uuid default uuid_generate_v4() not null,
  user_id uuid,
  team_id uuid,
  name text not null,
  company text,
  first_name text not null,
  last_name text not null,
  street_address text not null,
  suite_unit_apt text,
  city text not null,
  state text not null,
  zip_code text not null,
  email text not null,
  phone text not null,
  is_default boolean default false,
  is_soft_deleted boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
create table if not exists public.mail_pieces (
  id uuid default gen_random_uuid() not null,
  name varchar(255) not null,
  description text,
  dimensions varchar(50),
  type varchar(50),
  metadata jsonb,
  created_at timestamp with time zone default now(),
  created_by uuid
);
create table if not exists public.mailing_list_records (
  id uuid default gen_random_uuid() not null,
  mailing_list_id uuid,
  first_name varchar(100),
  last_name varchar(100),
  middle_name varchar(100),
  full_name varchar(255),
  email varchar(255),
  phone varchar(20),
  address_line1 varchar(255),
  address_line2 varchar(255),
  city varchar(100),
  state varchar(2),
  zip_code varchar(10),
  county varchar(100),
  latitude numeric(10,8),
  longitude numeric(11,8),
  property_type varchar(50),
  bedrooms integer,
  bathrooms numeric(3,1),
  square_feet integer,
  lot_size numeric(10,2),
  year_built integer,
  estimated_value numeric(12,2),
  last_sale_date date,
  last_sale_price numeric(12,2),
  loan_type varchar(50),
  loan_amount numeric(12,2),
  interest_rate numeric(5,3),
  loan_to_value numeric(5,2),
  origination_date date,
  maturity_date date,
  lender_name varchar(255),
  age integer,
  gender varchar(20),
  marital_status varchar(20),
  income numeric(12,2),
  net_worth numeric(15,2),
  home_ownership varchar(20),
  occupation varchar(100),
  education_level varchar(50),
  foreclosure_status varchar(50),
  filing_date date,
  auction_date date,
  redemption_date date,
  likely_to_move boolean,
  likely_to_sell boolean,
  likely_to_refinance boolean,
  motivation_score integer,
  data_source varchar(50),
  external_id varchar(255),
  metadata jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  is_valid boolean default true,
  validation_errors jsonb,
  modified_by uuid,
  status varchar(50) default 'active'::character varying,
  additional_data jsonb default '{}'::jsonb,
  last_used_at timestamp with time zone,
  usage_count integer default 0,
  validation_status text default 'pending'::text,
  deliverability_score numeric(3,2)
);
create table if not exists public.mailing_list_tags (
  mailing_list_id uuid not null,
  tag_id uuid not null,
  created_at timestamp with time zone default now()
);
create table if not exists public.mailing_list_usage (
  id uuid default uuid_generate_v4() not null,
  mailing_list_id uuid,
  campaign_id uuid,
  user_id uuid not null,
  usage_type text not null,
  record_count integer,
  created_at timestamp with time zone default now()
);
create table if not exists public.mailing_list_versions (
  id uuid default gen_random_uuid() not null,
  mailing_list_id uuid,
  version_number integer not null,
  name varchar(255) not null,
  description text,
  record_count integer,
  criteria jsonb,
  metadata jsonb,
  created_at timestamp with time zone default now(),
  created_by uuid,
  change_description text,
  snapshot jsonb
);
create table if not exists public.mailing_lists (
  id uuid default gen_random_uuid() not null,
  name varchar(255) not null,
  description text,
  record_count integer default 0,
  criteria jsonb,
  metadata jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid,
  is_active boolean default true,
  last_used_at timestamp with time zone,
  purchase_count integer default 0,
  team_id uuid,
  estimated_cost numeric(10,2),
  source_type text,
  source_criteria jsonb,
  file_url text
);
create table if not exists public.orders (
  id uuid default gen_random_uuid() not null,
  campaign_id uuid,
  mail_piece_id uuid,
  vendor_order_id varchar(255),
  status order_status default 'draft'::order_status,
  record_count integer default 0,
  cost_per_piece numeric(10,4),
  total_cost numeric(12,2),
  mail_class varchar(50),
  postage_type varchar(50),
  submitted_at timestamp with time zone,
  expected_delivery_date date,
  metadata jsonb,
  created_at timestamp with time zone default now(),
  created_by uuid,
  stripe_payment_intent_id text,
  amount_authorized numeric(10,2),
  amount_captured numeric(10,2),
  payment_status text default 'pending'::text,
  vendor_assignments jsonb,
  proof_urls jsonb,
  proof_approved_at timestamp with time zone,
  proof_approved_by uuid,
  tracking_numbers jsonb,
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone
);
create table if not exists public.proof_annotations (
  id uuid default uuid_generate_v4() not null,
  order_id uuid,
  page_number integer not null,
  x_coordinate numeric(6,3),
  y_coordinate numeric(6,3),
  comment text not null,
  status text default 'open'::text,
  created_by uuid not null,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default now()
);
create table if not exists public.record_usage (
  id uuid default uuid_generate_v4() not null,
  record_id uuid,
  campaign_id uuid,
  usage_type text not null,
  created_at timestamp with time zone default now()
);
create table if not exists public.saved_designs (
  id uuid default uuid_generate_v4() not null,
  user_id uuid,
  team_id uuid,
  name text not null,
  description text,
  design_type text,
  design_data jsonb not null,
  thumbnail_url text,
  is_template boolean default false,
  usage_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
create table if not exists public.short_link_tracking (
  id uuid default uuid_generate_v4() not null,
  short_code text not null,
  campaign_id uuid,
  record_id uuid,
  target_url text,
  clicks jsonb default '[]'::jsonb,
  total_clicks integer default 0,
  created_at timestamp with time zone default now()
);
create table if not exists public.skip_trace_orders (
  id uuid default uuid_generate_v4() not null,
  user_id uuid not null,
  vendor_id uuid,
  record_ids uuid[] not null,
  status text default 'pending'::text,
  cost numeric(10,2),
  submitted_at timestamp with time zone,
  completed_at timestamp with time zone,
  results_file_url text,
  created_at timestamp with time zone default now()
);
create table if not exists public.system_templates (
  id uuid default uuid_generate_v4() not null,
  name text not null,
  description text,
  category text,
  design_type text,
  design_data jsonb not null,
  thumbnail_url text,
  is_active boolean default true,
  usage_count integer default 0,
  created_at timestamp with time zone default now()
);
create table if not exists public.tags (
  id uuid default gen_random_uuid() not null,
  name varchar(100) not null,
  color varchar(7),
  description text,
  created_at timestamp with time zone default now(),
  created_by uuid,
  user_id uuid,
  team_id uuid,
  category text
);
create table if not exists public.teams (
  id uuid default uuid_generate_v4() not null,
  name text not null,
  plan text not null,
  max_seats integer default 3 not null,
  owner_id uuid not null,
  stripe_subscription_id text,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
create table if not exists public.vendors (
  id uuid default uuid_generate_v4() not null,
  name text not null,
  vendor_type text[] not null,
  contact_info jsonb not null,
  pricing_tiers jsonb,
  performance_metrics jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
create table if not exists public.webhook_deliveries (
  id uuid default uuid_generate_v4() not null,
  webhook_id uuid,
  event_type text not null,
  payload jsonb not null,
  response_status integer,
  response_body text,
  delivery_attempts integer default 1,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone default now()
);
create table if not exists public.webhooks (
  id uuid default uuid_generate_v4() not null,
  user_id uuid,
  team_id uuid,
  url text not null,
  events text[] not null,
  secret text,
  is_active boolean default true,
  retry_count integer default 3,
  created_at timestamp with time zone default now()
);

-- CONSTRAINTS — PK/UNIQUE/CHECK first (so FKs can reference them), then FKs
do $$ begin if not exists (select 1 from pg_constraint where conname='campaign_mailing_lists_pkey' and connamespace='public'::regnamespace) then alter table public.campaign_mailing_lists add constraint campaign_mailing_lists_pkey PRIMARY KEY (campaign_id, mailing_list_id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='campaign_records_campaign_id_record_id_key' and connamespace='public'::regnamespace) then alter table public.campaign_records add constraint campaign_records_campaign_id_record_id_key UNIQUE (campaign_id, record_id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='campaign_records_short_link_code_key' and connamespace='public'::regnamespace) then alter table public.campaign_records add constraint campaign_records_short_link_code_key UNIQUE (short_link_code); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='campaign_records_pkey' and connamespace='public'::regnamespace) then alter table public.campaign_records add constraint campaign_records_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='campaign_records_delivery_status_check' and connamespace='public'::regnamespace) then alter table public.campaign_records add constraint campaign_records_delivery_status_check CHECK ((delivery_status = ANY (ARRAY['pending'::text, 'printed'::text, 'shipped'::text, 'delivered'::text, 'returned'::text]))); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='campaigns_pkey' and connamespace='public'::regnamespace) then alter table public.campaigns add constraint campaigns_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='campaigns_campaign_type_check' and connamespace='public'::regnamespace) then alter table public.campaigns add constraint campaigns_campaign_type_check CHECK ((campaign_type = ANY (ARRAY['single'::text, 'split'::text, 'recurring'::text]))); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='campaigns_fulfillment_type_check' and connamespace='public'::regnamespace) then alter table public.campaigns add constraint campaigns_fulfillment_type_check CHECK ((fulfillment_type = ANY (ARRAY['full_service'::text, 'ship_to_user'::text, 'print_only'::text]))); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='campaigns_postage_type_check' and connamespace='public'::regnamespace) then alter table public.campaigns add constraint campaigns_postage_type_check CHECK ((postage_type = ANY (ARRAY['first_class_forever'::text, 'first_class_discounted'::text, 'standard_class'::text]))); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='contact_cards_pkey' and connamespace='public'::regnamespace) then alter table public.contact_cards add constraint contact_cards_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mail_pieces_pkey' and connamespace='public'::regnamespace) then alter table public.mail_pieces add constraint mail_pieces_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_list_records_pkey' and connamespace='public'::regnamespace) then alter table public.mailing_list_records add constraint mailing_list_records_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_list_records_validation_status_check' and connamespace='public'::regnamespace) then alter table public.mailing_list_records add constraint mailing_list_records_validation_status_check CHECK ((validation_status = ANY (ARRAY['pending'::text, 'valid'::text, 'invalid'::text, 'corrected'::text]))); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_list_tags_pkey' and connamespace='public'::regnamespace) then alter table public.mailing_list_tags add constraint mailing_list_tags_pkey PRIMARY KEY (mailing_list_id, tag_id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_list_usage_pkey' and connamespace='public'::regnamespace) then alter table public.mailing_list_usage add constraint mailing_list_usage_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_list_usage_usage_type_check' and connamespace='public'::regnamespace) then alter table public.mailing_list_usage add constraint mailing_list_usage_usage_type_check CHECK ((usage_type = ANY (ARRAY['campaign'::text, 'export'::text, 'preview'::text, 'merge'::text, 'split'::text]))); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_list_versions_pkey' and connamespace='public'::regnamespace) then alter table public.mailing_list_versions add constraint mailing_list_versions_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_lists_pkey' and connamespace='public'::regnamespace) then alter table public.mailing_lists add constraint mailing_lists_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_lists_source_type_check' and connamespace='public'::regnamespace) then alter table public.mailing_lists add constraint mailing_lists_source_type_check CHECK ((source_type = ANY (ARRAY['upload'::text, 'list_builder'::text, 'manual'::text, 'imported'::text]))); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='orders_pkey' and connamespace='public'::regnamespace) then alter table public.orders add constraint orders_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='orders_payment_status_check' and connamespace='public'::regnamespace) then alter table public.orders add constraint orders_payment_status_check CHECK ((payment_status = ANY (ARRAY['pending'::text, 'authorized'::text, 'captured'::text, 'failed'::text, 'refunded'::text]))); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='proof_annotations_pkey' and connamespace='public'::regnamespace) then alter table public.proof_annotations add constraint proof_annotations_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='proof_annotations_status_check' and connamespace='public'::regnamespace) then alter table public.proof_annotations add constraint proof_annotations_status_check CHECK ((status = ANY (ARRAY['open'::text, 'resolved'::text]))); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='record_usage_pkey' and connamespace='public'::regnamespace) then alter table public.record_usage add constraint record_usage_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='record_usage_usage_type_check' and connamespace='public'::regnamespace) then alter table public.record_usage add constraint record_usage_usage_type_check CHECK ((usage_type = ANY (ARRAY['mailed'::text, 'exported'::text, 'skip_traced'::text]))); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='saved_designs_pkey' and connamespace='public'::regnamespace) then alter table public.saved_designs add constraint saved_designs_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='saved_designs_design_type_check' and connamespace='public'::regnamespace) then alter table public.saved_designs add constraint saved_designs_design_type_check CHECK ((design_type = ANY (ARRAY['letter'::text, 'postcard'::text, 'envelope'::text, 'self_mailer'::text]))); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='short_link_tracking_short_code_key' and connamespace='public'::regnamespace) then alter table public.short_link_tracking add constraint short_link_tracking_short_code_key UNIQUE (short_code); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='short_link_tracking_pkey' and connamespace='public'::regnamespace) then alter table public.short_link_tracking add constraint short_link_tracking_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='skip_trace_orders_pkey' and connamespace='public'::regnamespace) then alter table public.skip_trace_orders add constraint skip_trace_orders_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='skip_trace_orders_status_check' and connamespace='public'::regnamespace) then alter table public.skip_trace_orders add constraint skip_trace_orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'submitted'::text, 'processing'::text, 'completed'::text, 'failed'::text]))); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='system_templates_pkey' and connamespace='public'::regnamespace) then alter table public.system_templates add constraint system_templates_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='system_templates_design_type_check' and connamespace='public'::regnamespace) then alter table public.system_templates add constraint system_templates_design_type_check CHECK ((design_type = ANY (ARRAY['letter'::text, 'postcard'::text, 'envelope'::text, 'self_mailer'::text]))); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='tags_pkey' and connamespace='public'::regnamespace) then alter table public.tags add constraint tags_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='teams_stripe_subscription_id_key' and connamespace='public'::regnamespace) then alter table public.teams add constraint teams_stripe_subscription_id_key UNIQUE (stripe_subscription_id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='teams_pkey' and connamespace='public'::regnamespace) then alter table public.teams add constraint teams_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='teams_plan_check' and connamespace='public'::regnamespace) then alter table public.teams add constraint teams_plan_check CHECK ((plan = ANY (ARRAY['team'::text, 'enterprise'::text]))); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='vendors_pkey' and connamespace='public'::regnamespace) then alter table public.vendors add constraint vendors_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='webhook_deliveries_pkey' and connamespace='public'::regnamespace) then alter table public.webhook_deliveries add constraint webhook_deliveries_pkey PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='webhooks_pkey' and connamespace='public'::regnamespace) then alter table public.webhooks add constraint webhooks_pkey PRIMARY KEY (id); end if; end $$;
-- foreign keys (after all PK/UNIQUE exist)
do $$ begin if not exists (select 1 from pg_constraint where conname='campaign_mailing_lists_campaign_id_fkey' and connamespace='public'::regnamespace) then alter table public.campaign_mailing_lists add constraint campaign_mailing_lists_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='campaign_mailing_lists_mailing_list_id_fkey' and connamespace='public'::regnamespace) then alter table public.campaign_mailing_lists add constraint campaign_mailing_lists_mailing_list_id_fkey FOREIGN KEY (mailing_list_id) REFERENCES mailing_lists(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='campaign_records_campaign_id_fkey' and connamespace='public'::regnamespace) then alter table public.campaign_records add constraint campaign_records_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='campaign_records_mailing_list_id_fkey' and connamespace='public'::regnamespace) then alter table public.campaign_records add constraint campaign_records_mailing_list_id_fkey FOREIGN KEY (mailing_list_id) REFERENCES mailing_lists(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='campaign_records_record_id_fkey' and connamespace='public'::regnamespace) then alter table public.campaign_records add constraint campaign_records_record_id_fkey FOREIGN KEY (record_id) REFERENCES mailing_list_records(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='campaigns_active_order_id_fkey' and connamespace='public'::regnamespace) then alter table public.campaigns add constraint campaigns_active_order_id_fkey FOREIGN KEY (active_order_id) REFERENCES orders(id) ON DELETE SET NULL; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='campaigns_contact_card_id_fkey' and connamespace='public'::regnamespace) then alter table public.campaigns add constraint campaigns_contact_card_id_fkey FOREIGN KEY (contact_card_id) REFERENCES contact_cards(id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='campaigns_created_by_fkey' and connamespace='public'::regnamespace) then alter table public.campaigns add constraint campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='campaigns_team_id_fkey' and connamespace='public'::regnamespace) then alter table public.campaigns add constraint campaigns_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='contact_cards_team_id_fkey' and connamespace='public'::regnamespace) then alter table public.contact_cards add constraint contact_cards_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='contact_cards_user_id_fkey' and connamespace='public'::regnamespace) then alter table public.contact_cards add constraint contact_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mail_pieces_created_by_fkey' and connamespace='public'::regnamespace) then alter table public.mail_pieces add constraint mail_pieces_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_list_records_mailing_list_id_fkey' and connamespace='public'::regnamespace) then alter table public.mailing_list_records add constraint mailing_list_records_mailing_list_id_fkey FOREIGN KEY (mailing_list_id) REFERENCES mailing_lists(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_list_records_modified_by_fkey' and connamespace='public'::regnamespace) then alter table public.mailing_list_records add constraint mailing_list_records_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES auth.users(id) ON DELETE SET NULL; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_list_tags_mailing_list_id_fkey' and connamespace='public'::regnamespace) then alter table public.mailing_list_tags add constraint mailing_list_tags_mailing_list_id_fkey FOREIGN KEY (mailing_list_id) REFERENCES mailing_lists(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_list_tags_tag_id_fkey' and connamespace='public'::regnamespace) then alter table public.mailing_list_tags add constraint mailing_list_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_list_usage_campaign_id_fkey' and connamespace='public'::regnamespace) then alter table public.mailing_list_usage add constraint mailing_list_usage_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_list_usage_mailing_list_id_fkey' and connamespace='public'::regnamespace) then alter table public.mailing_list_usage add constraint mailing_list_usage_mailing_list_id_fkey FOREIGN KEY (mailing_list_id) REFERENCES mailing_lists(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_list_usage_user_id_fkey' and connamespace='public'::regnamespace) then alter table public.mailing_list_usage add constraint mailing_list_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_list_versions_created_by_fkey' and connamespace='public'::regnamespace) then alter table public.mailing_list_versions add constraint mailing_list_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_list_versions_mailing_list_id_fkey' and connamespace='public'::regnamespace) then alter table public.mailing_list_versions add constraint mailing_list_versions_mailing_list_id_fkey FOREIGN KEY (mailing_list_id) REFERENCES mailing_lists(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_lists_created_by_fkey' and connamespace='public'::regnamespace) then alter table public.mailing_lists add constraint mailing_lists_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='mailing_lists_team_id_fkey' and connamespace='public'::regnamespace) then alter table public.mailing_lists add constraint mailing_lists_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='orders_campaign_id_fkey' and connamespace='public'::regnamespace) then alter table public.orders add constraint orders_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='orders_created_by_fkey' and connamespace='public'::regnamespace) then alter table public.orders add constraint orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='orders_mail_piece_id_fkey' and connamespace='public'::regnamespace) then alter table public.orders add constraint orders_mail_piece_id_fkey FOREIGN KEY (mail_piece_id) REFERENCES mail_pieces(id) ON DELETE SET NULL; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='orders_proof_approved_by_fkey' and connamespace='public'::regnamespace) then alter table public.orders add constraint orders_proof_approved_by_fkey FOREIGN KEY (proof_approved_by) REFERENCES auth.users(id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='proof_annotations_created_by_fkey' and connamespace='public'::regnamespace) then alter table public.proof_annotations add constraint proof_annotations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='proof_annotations_order_id_fkey' and connamespace='public'::regnamespace) then alter table public.proof_annotations add constraint proof_annotations_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='proof_annotations_resolved_by_fkey' and connamespace='public'::regnamespace) then alter table public.proof_annotations add constraint proof_annotations_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='record_usage_campaign_id_fkey' and connamespace='public'::regnamespace) then alter table public.record_usage add constraint record_usage_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='record_usage_record_id_fkey' and connamespace='public'::regnamespace) then alter table public.record_usage add constraint record_usage_record_id_fkey FOREIGN KEY (record_id) REFERENCES mailing_list_records(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='saved_designs_team_id_fkey' and connamespace='public'::regnamespace) then alter table public.saved_designs add constraint saved_designs_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='saved_designs_user_id_fkey' and connamespace='public'::regnamespace) then alter table public.saved_designs add constraint saved_designs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='short_link_tracking_campaign_id_fkey' and connamespace='public'::regnamespace) then alter table public.short_link_tracking add constraint short_link_tracking_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='short_link_tracking_record_id_fkey' and connamespace='public'::regnamespace) then alter table public.short_link_tracking add constraint short_link_tracking_record_id_fkey FOREIGN KEY (record_id) REFERENCES mailing_list_records(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='skip_trace_orders_user_id_fkey' and connamespace='public'::regnamespace) then alter table public.skip_trace_orders add constraint skip_trace_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='skip_trace_orders_vendor_id_fkey' and connamespace='public'::regnamespace) then alter table public.skip_trace_orders add constraint skip_trace_orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='tags_created_by_fkey' and connamespace='public'::regnamespace) then alter table public.tags add constraint tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='tags_team_id_fkey' and connamespace='public'::regnamespace) then alter table public.tags add constraint tags_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='tags_user_id_fkey' and connamespace='public'::regnamespace) then alter table public.tags add constraint tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='teams_owner_id_fkey' and connamespace='public'::regnamespace) then alter table public.teams add constraint teams_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='webhook_deliveries_webhook_id_fkey' and connamespace='public'::regnamespace) then alter table public.webhook_deliveries add constraint webhook_deliveries_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='webhooks_team_id_fkey' and connamespace='public'::regnamespace) then alter table public.webhooks add constraint webhooks_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id); end if; end $$;
do $$ begin if not exists (select 1 from pg_constraint where conname='webhooks_user_id_fkey' and connamespace='public'::regnamespace) then alter table public.webhooks add constraint webhooks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; end if; end $$;
-- user_profiles.team_id → teams (augmented column; team-scoped access)
do $$ begin if not exists (select 1 from pg_constraint where conname='user_profiles_team_id_fkey' and connamespace='public'::regnamespace) then alter table public.user_profiles add constraint user_profiles_team_id_fkey foreign key (team_id) references public.teams(id); end if; end $$;

-- INDEXES
CREATE UNIQUE INDEX IF NOT EXISTS campaign_mailing_lists_pkey ON public.campaign_mailing_lists USING btree (campaign_id, mailing_list_id);
CREATE UNIQUE INDEX IF NOT EXISTS campaign_records_campaign_id_record_id_key ON public.campaign_records USING btree (campaign_id, record_id);
CREATE UNIQUE INDEX IF NOT EXISTS campaign_records_pkey ON public.campaign_records USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS campaign_records_short_link_code_key ON public.campaign_records USING btree (short_link_code);
CREATE INDEX IF NOT EXISTS idx_campaign_records_campaign_id ON public.campaign_records USING btree (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_records_delivery_status ON public.campaign_records USING btree (delivery_status);
CREATE INDEX IF NOT EXISTS idx_campaign_records_record_id ON public.campaign_records USING btree (record_id);
CREATE INDEX IF NOT EXISTS idx_campaign_records_short_link_code ON public.campaign_records USING btree (short_link_code);
CREATE UNIQUE INDEX IF NOT EXISTS campaigns_pkey ON public.campaigns USING btree (id);
CREATE INDEX IF NOT EXISTS idx_campaigns_contact_card_id ON public.campaigns USING btree (contact_card_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON public.campaigns USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_start_date ON public.campaigns USING btree (scheduled_start_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns USING btree (status);
CREATE INDEX IF NOT EXISTS idx_campaigns_team_id ON public.campaigns USING btree (team_id);
CREATE UNIQUE INDEX IF NOT EXISTS contact_cards_pkey ON public.contact_cards USING btree (id);
CREATE INDEX IF NOT EXISTS idx_contact_cards_is_default ON public.contact_cards USING btree (is_default) WHERE (is_default = true);
CREATE INDEX IF NOT EXISTS idx_contact_cards_team_id ON public.contact_cards USING btree (team_id);
CREATE INDEX IF NOT EXISTS idx_contact_cards_user_id ON public.contact_cards USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_cards_user_name_unique ON public.contact_cards USING btree (user_id, name) WHERE (is_soft_deleted = false);
CREATE UNIQUE INDEX IF NOT EXISTS mail_pieces_pkey ON public.mail_pieces USING btree (id);
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_additional_data ON public.mailing_list_records USING gin (additional_data);
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_city ON public.mailing_list_records USING btree (city);
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_email ON public.mailing_list_records USING btree (email);
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_foreclosure ON public.mailing_list_records USING btree (foreclosure_status);
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_full_name ON public.mailing_list_records USING btree (full_name);
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_list_id ON public.mailing_list_records USING btree (mailing_list_id);
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_phone ON public.mailing_list_records USING btree (phone);
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_property_type ON public.mailing_list_records USING btree (property_type);
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_state ON public.mailing_list_records USING btree (state);
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_usage ON public.mailing_list_records USING btree (last_used_at, usage_count);
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_validation_status ON public.mailing_list_records USING btree (validation_status);
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_zip ON public.mailing_list_records USING btree (zip_code);
CREATE UNIQUE INDEX IF NOT EXISTS mailing_list_records_pkey ON public.mailing_list_records USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS mailing_list_tags_pkey ON public.mailing_list_tags USING btree (mailing_list_id, tag_id);
CREATE INDEX IF NOT EXISTS idx_mailing_list_usage_list_date ON public.mailing_list_usage USING btree (mailing_list_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mailing_list_usage_user_id ON public.mailing_list_usage USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS mailing_list_usage_pkey ON public.mailing_list_usage USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS mailing_list_versions_pkey ON public.mailing_list_versions USING btree (id);
CREATE INDEX IF NOT EXISTS idx_mailing_lists_created_at ON public.mailing_lists USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_mailing_lists_created_by ON public.mailing_lists USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_mailing_lists_is_active ON public.mailing_lists USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_mailing_lists_last_used_at ON public.mailing_lists USING btree (last_used_at);
CREATE INDEX IF NOT EXISTS idx_mailing_lists_source_criteria ON public.mailing_lists USING gin (source_criteria);
CREATE INDEX IF NOT EXISTS idx_mailing_lists_source_type ON public.mailing_lists USING btree (source_type);
CREATE INDEX IF NOT EXISTS idx_mailing_lists_team_id ON public.mailing_lists USING btree (team_id);
CREATE UNIQUE INDEX IF NOT EXISTS mailing_lists_pkey ON public.mailing_lists USING btree (id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders USING btree (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON public.orders USING btree (stripe_payment_intent_id);
CREATE UNIQUE INDEX IF NOT EXISTS orders_pkey ON public.orders USING btree (id);
CREATE INDEX IF NOT EXISTS idx_proof_annotations_order_id ON public.proof_annotations USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_proof_annotations_status ON public.proof_annotations USING btree (status);
CREATE UNIQUE INDEX IF NOT EXISTS proof_annotations_pkey ON public.proof_annotations USING btree (id);
CREATE INDEX IF NOT EXISTS idx_record_usage_campaign_id ON public.record_usage USING btree (campaign_id);
CREATE INDEX IF NOT EXISTS idx_record_usage_record_date ON public.record_usage USING btree (record_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS record_usage_pkey ON public.record_usage USING btree (id);
CREATE INDEX IF NOT EXISTS idx_saved_designs_design_type ON public.saved_designs USING btree (design_type);
CREATE INDEX IF NOT EXISTS idx_saved_designs_team_id ON public.saved_designs USING btree (team_id);
CREATE INDEX IF NOT EXISTS idx_saved_designs_user_id ON public.saved_designs USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS saved_designs_pkey ON public.saved_designs USING btree (id);
CREATE INDEX IF NOT EXISTS idx_short_link_tracking_campaign_id ON public.short_link_tracking USING btree (campaign_id);
CREATE INDEX IF NOT EXISTS idx_short_link_tracking_short_code ON public.short_link_tracking USING btree (short_code);
CREATE UNIQUE INDEX IF NOT EXISTS short_link_tracking_pkey ON public.short_link_tracking USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS short_link_tracking_short_code_key ON public.short_link_tracking USING btree (short_code);
CREATE INDEX IF NOT EXISTS idx_skip_trace_orders_status ON public.skip_trace_orders USING btree (status);
CREATE INDEX IF NOT EXISTS idx_skip_trace_orders_user_id ON public.skip_trace_orders USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS skip_trace_orders_pkey ON public.skip_trace_orders USING btree (id);
CREATE INDEX IF NOT EXISTS idx_system_templates_category ON public.system_templates USING btree (category);
CREATE INDEX IF NOT EXISTS idx_system_templates_design_type ON public.system_templates USING btree (design_type);
CREATE UNIQUE INDEX IF NOT EXISTS system_templates_pkey ON public.system_templates USING btree (id);
CREATE INDEX IF NOT EXISTS idx_tags_category ON public.tags USING btree (category);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags USING btree (name);
CREATE INDEX IF NOT EXISTS idx_tags_team_id ON public.tags USING btree (team_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_team_name_unique ON public.tags USING btree (team_id, name) WHERE (team_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_user_name_unique ON public.tags USING btree (user_id, name) WHERE ((team_id IS NULL) AND (user_id IS NOT NULL));
CREATE UNIQUE INDEX IF NOT EXISTS tags_pkey ON public.tags USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS teams_pkey ON public.teams USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS teams_stripe_subscription_id_key ON public.teams USING btree (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_vendors_vendor_type ON public.vendors USING gin (vendor_type);
CREATE UNIQUE INDEX IF NOT EXISTS vendors_pkey ON public.vendors USING btree (id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON public.webhook_deliveries USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON public.webhook_deliveries USING btree (webhook_id);
CREATE UNIQUE INDEX IF NOT EXISTS webhook_deliveries_pkey ON public.webhook_deliveries USING btree (id);
CREATE INDEX IF NOT EXISTS idx_webhooks_team_id ON public.webhooks USING btree (team_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON public.webhooks USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS webhooks_pkey ON public.webhooks USING btree (id);

-- RLS
alter table public.campaign_mailing_lists enable row level security;
alter table public.campaign_records enable row level security;
alter table public.campaigns enable row level security;
alter table public.contact_cards enable row level security;
alter table public.mail_pieces enable row level security;
alter table public.mailing_list_records enable row level security;
alter table public.mailing_list_tags enable row level security;
alter table public.mailing_list_usage enable row level security;
alter table public.mailing_list_versions enable row level security;
alter table public.mailing_lists enable row level security;
alter table public.orders enable row level security;
alter table public.record_usage enable row level security;
alter table public.saved_designs enable row level security;
alter table public.short_link_tracking enable row level security;
alter table public.skip_trace_orders enable row level security;
alter table public.system_templates enable row level security;
alter table public.tags enable row level security;
alter table public.teams enable row level security;
alter table public.vendors enable row level security;
alter table public.webhook_deliveries enable row level security;
alter table public.webhooks enable row level security;

-- POLICIES
drop policy if exists "Users can view own campaign records" on public.campaign_records;
create policy "Users can view own campaign records" on public.campaign_records as permissive for select to public using ((campaign_id IN ( SELECT campaigns.id
   FROM campaigns
  WHERE (campaigns.created_by = auth.uid()))));
drop policy if exists "Users can manage own campaigns" on public.campaigns;
create policy "Users can manage own campaigns" on public.campaigns as permissive for all to public using (((created_by = auth.uid()) OR ((team_id IS NOT NULL) AND (team_id IN ( SELECT user_profiles.team_id
   FROM user_profiles
  WHERE (user_profiles.user_id = auth.uid()))))));
drop policy if exists "Users can manage their campaign" on public.campaigns;
create policy "Users can manage their campaign" on public.campaigns as permissive for all to public using ((auth.uid() = created_by));
drop policy if exists "Team members can view team contact cards" on public.contact_cards;
create policy "Team members can view team contact cards" on public.contact_cards as permissive for select to public using ((team_id IN ( SELECT user_profiles.team_id
   FROM user_profiles
  WHERE (user_profiles.user_id = auth.uid()))));
drop policy if exists "Users can manage own contact cards" on public.contact_cards;
create policy "Users can manage own contact cards" on public.contact_cards as permissive for all to public using ((user_id = auth.uid()));
drop policy if exists "All users can view mail pieces" on public.mail_pieces;
create policy "All users can view mail pieces" on public.mail_pieces as permissive for select to public using (true);
drop policy if exists "Users can manage records in own lists" on public.mailing_list_records;
create policy "Users can manage records in own lists" on public.mailing_list_records as permissive for all to public using ((mailing_list_id IN ( SELECT mailing_lists.id
   FROM mailing_lists
  WHERE ((mailing_lists.created_by = auth.uid()) OR ((mailing_lists.team_id IS NOT NULL) AND (mailing_lists.team_id IN ( SELECT user_profiles.team_id
           FROM user_profiles
          WHERE (user_profiles.user_id = auth.uid()))))))));
drop policy if exists "Users can manage records of their lists" on public.mailing_list_records;
create policy "Users can manage records of their lists" on public.mailing_list_records as permissive for all to public using ((EXISTS ( SELECT 1
   FROM mailing_lists
  WHERE ((mailing_lists.id = mailing_list_records.mailing_list_id) AND (mailing_lists.created_by = auth.uid())))));
drop policy if exists "Users can view records of their lists" on public.mailing_list_records;
create policy "Users can view records of their lists" on public.mailing_list_records as permissive for select to public using ((EXISTS ( SELECT 1
   FROM mailing_lists
  WHERE ((mailing_lists.id = mailing_list_records.mailing_list_id) AND ((mailing_lists.created_by = auth.uid()) OR (mailing_lists.is_active = true))))));
drop policy if exists "Users can manage tags on own lists" on public.mailing_list_tags;
create policy "Users can manage tags on own lists" on public.mailing_list_tags as permissive for all to public using ((mailing_list_id IN ( SELECT mailing_lists.id
   FROM mailing_lists
  WHERE ((mailing_lists.created_by = auth.uid()) OR ((mailing_lists.team_id IS NOT NULL) AND (mailing_lists.team_id IN ( SELECT user_profiles.team_id
           FROM user_profiles
          WHERE (user_profiles.user_id = auth.uid()))))))));
drop policy if exists "Users can view own list usage" on public.mailing_list_usage;
create policy "Users can view own list usage" on public.mailing_list_usage as permissive for select to public using ((user_id = auth.uid()));
drop policy if exists "Team members can view team mailing lists" on public.mailing_lists;
create policy "Team members can view team mailing lists" on public.mailing_lists as permissive for select to public using ((team_id IN ( SELECT user_profiles.team_id
   FROM user_profiles
  WHERE (user_profiles.user_id = auth.uid()))));
drop policy if exists "Users can create mailing lists" on public.mailing_lists;
create policy "Users can create mailing lists" on public.mailing_lists as permissive for insert to public with check ((auth.uid() = created_by));
drop policy if exists "Users can delete their own mailing lists" on public.mailing_lists;
create policy "Users can delete their own mailing lists" on public.mailing_lists as permissive for delete to public using ((auth.uid() = created_by));
drop policy if exists "Users can manage own mailing lists" on public.mailing_lists;
create policy "Users can manage own mailing lists" on public.mailing_lists as permissive for all to public using (((created_by = auth.uid()) OR ((team_id IS NOT NULL) AND (team_id IN ( SELECT user_profiles.team_id
   FROM user_profiles
  WHERE (user_profiles.user_id = auth.uid()))))));
drop policy if exists "Users can update their own mailing lists" on public.mailing_lists;
create policy "Users can update their own mailing lists" on public.mailing_lists as permissive for update to public using ((auth.uid() = created_by));
drop policy if exists "Users can view their own mailing lists" on public.mailing_lists;
create policy "Users can view their own mailing lists" on public.mailing_lists as permissive for select to public using (((auth.uid() = created_by) OR (is_active = true)));
drop policy if exists "Users can manage own orders" on public.orders;
create policy "Users can manage own orders" on public.orders as permissive for all to public using ((created_by = auth.uid()));
drop policy if exists "Users can manage their own orders" on public.orders;
create policy "Users can manage their own orders" on public.orders as permissive for all to public using ((auth.uid() = created_by));
drop policy if exists "Users can view own record usage" on public.record_usage;
create policy "Users can view own record usage" on public.record_usage as permissive for select to public using ((campaign_id IN ( SELECT campaigns.id
   FROM campaigns
  WHERE (campaigns.created_by = auth.uid()))));
drop policy if exists "Users can manage own designs" on public.saved_designs;
create policy "Users can manage own designs" on public.saved_designs as permissive for all to public using (((user_id = auth.uid()) OR ((team_id IS NOT NULL) AND (team_id IN ( SELECT user_profiles.team_id
   FROM user_profiles
  WHERE (user_profiles.user_id = auth.uid()))))));
drop policy if exists "All users can view system templates" on public.system_templates;
create policy "All users can view system templates" on public.system_templates as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "All users can view tags" on public.tags;
create policy "All users can view tags" on public.tags as permissive for select to public using (true);
drop policy if exists "Users can create tags" on public.tags;
create policy "Users can create tags" on public.tags as permissive for insert to public with check ((auth.uid() = created_by));
drop policy if exists "Users can manage own tags" on public.tags;
create policy "Users can manage own tags" on public.tags as permissive for all to public using (((created_by = auth.uid()) OR ((team_id IS NOT NULL) AND (team_id IN ( SELECT user_profiles.team_id
   FROM user_profiles
  WHERE (user_profiles.user_id = auth.uid()))))));
drop policy if exists "Team members can view teams" on public.teams;
create policy "Team members can view teams" on public.teams as permissive for select to public using ((id IN ( SELECT user_profiles.team_id
   FROM user_profiles
  WHERE (user_profiles.user_id = auth.uid()))));
drop policy if exists "Team owners can manage teams" on public.teams;
create policy "Team owners can manage teams" on public.teams as permissive for all to public using ((owner_id = auth.uid()));
drop policy if exists "Users can manage own webhooks" on public.webhooks;
create policy "Users can manage own webhooks" on public.webhooks as permissive for all to public using (((user_id = auth.uid()) OR ((team_id IS NOT NULL) AND (team_id IN ( SELECT user_profiles.team_id
   FROM user_profiles
  WHERE (user_profiles.user_id = auth.uid()))))));

-- TRIGGERS (DB1)
drop trigger if exists update_campaigns_updated_at on public.campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
drop trigger if exists update_contact_cards_updated_at on public.contact_cards;
CREATE TRIGGER update_contact_cards_updated_at BEFORE UPDATE ON public.contact_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
drop trigger if exists create_audit_log_trigger on public.mailing_list_records;
CREATE TRIGGER create_audit_log_trigger AFTER INSERT OR DELETE OR UPDATE ON public.mailing_list_records FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();
drop trigger if exists update_list_record_count on public.mailing_list_records;
CREATE TRIGGER update_list_record_count AFTER INSERT OR DELETE OR UPDATE OF is_valid ON public.mailing_list_records FOR EACH ROW EXECUTE FUNCTION update_mailing_list_record_count();
drop trigger if exists update_mailing_list_record_count_trigger on public.mailing_list_records;
CREATE TRIGGER update_mailing_list_record_count_trigger AFTER INSERT OR DELETE ON public.mailing_list_records FOR EACH ROW EXECUTE FUNCTION update_mailing_list_record_count();
drop trigger if exists update_mailing_list_records_updated_at on public.mailing_list_records;
CREATE TRIGGER update_mailing_list_records_updated_at BEFORE UPDATE ON public.mailing_list_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
drop trigger if exists update_mailing_lists_updated_at on public.mailing_lists;
CREATE TRIGGER update_mailing_lists_updated_at BEFORE UPDATE ON public.mailing_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
drop trigger if exists update_saved_designs_updated_at on public.saved_designs;
CREATE TRIGGER update_saved_designs_updated_at BEFORE UPDATE ON public.saved_designs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
drop trigger if exists update_teams_updated_at on public.teams;
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
drop trigger if exists update_vendors_updated_at on public.vendors;
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- HARDENING (persistent jobs, rate-limit RPC, webhook dead letters)
-- Phase 3 production hardening: persistent jobs, distributed rate limiting,
-- webhook dead letters.

-- Background jobs survive serverless instance recycling.
create table if not exists background_jobs (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text not null,
  status       text not null default 'pending'
                 check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  progress     integer not null default 0 check (progress between 0 and 100),
  data         jsonb not null default '{}'::jsonb,
  result       jsonb,
  error        text,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  started_at   timestamptz,
  completed_at timestamptz
);

create index if not exists background_jobs_user_idx on background_jobs(user_id, status);

alter table background_jobs enable row level security;
create policy "users read own jobs"
  on background_jobs for select
  using (auth.uid() = user_id);
-- writes go through the service role only

-- Distributed rate limiting / counters. One row per (key, window-start).
create table if not exists rate_limit_counters (
  key          text not null,
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (key, window_start)
);

-- Atomic check-and-increment: returns the post-increment count for the
-- caller to compare against its limit. Single round trip, race-safe.
create or replace function increment_rate_limit(
  p_key text,
  p_window_seconds integer
) returns integer
language plpgsql
security definer
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  insert into rate_limit_counters as c (key, window_start, count)
  values (p_key, v_window_start, 1)
  on conflict (key, window_start)
  do update set count = c.count + 1
  returning count into v_count;
  return v_count;
end;
$$;

-- Opportunistic cleanup of stale windows (called from the limiter, cheap).
create or replace function cleanup_rate_limit_counters() returns void
language sql
security definer
as $$
  delete from rate_limit_counters where window_start < now() - interval '1 day';
$$;

-- Dead letters for outbound webhook deliveries that exhausted retries.
create table if not exists webhook_dead_letters (
  id           uuid primary key default gen_random_uuid(),
  webhook_id   uuid,
  user_id      uuid,
  event_type   text not null,
  payload      jsonb not null,
  attempts     integer not null,
  last_error   text,
  created_at   timestamptz not null default now()
);

create index if not exists webhook_dead_letters_user_idx on webhook_dead_letters(user_id, created_at);
alter table webhook_dead_letters enable row level security;
create policy "users read own dead letters"
  on webhook_dead_letters for select
  using (auth.uid() = user_id);

commit;