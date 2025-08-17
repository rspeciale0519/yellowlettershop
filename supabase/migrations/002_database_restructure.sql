-- Create custom types for status fields to ensure data consistency.
CREATE TYPE public.order_status AS ENUM ('draft', 'submitted', 'processing', 'shipped', 'completed', 'failed');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'archived');

-- Best practice: Create a table for user profiles to store app-specific data.
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table to define mail piece templates (e.g., postcard, letter).
CREATE TABLE IF NOT EXISTS public.mail_pieces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL, -- e.g., "4x6 Postcard", "#10 Letter"
  description TEXT,
  dimensions VARCHAR(50), -- e.g., "4x6", "8.5x11"
  type VARCHAR(50), -- e.g., "postcard", "letter"
  metadata JSONB, -- For storing template-specific details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create a central orders table for mail fulfillment.
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  mail_piece_id UUID REFERENCES public.mail_pieces(id) ON DELETE SET NULL,
  vendor_order_id VARCHAR(255), -- For Redstone or other vendor IDs
  status public.order_status DEFAULT 'draft',
  record_count INTEGER DEFAULT 0,
  cost_per_piece DECIMAL(10, 4),
  total_cost DECIMAL(12, 2),
  mail_class VARCHAR(50), -- e.g., "First Class", "Standard"
  postage_type VARCHAR(50), -- e.g., "Stamp", "Indicia"
  submitted_at TIMESTAMP WITH TIME ZONE,
  expected_delivery_date DATE,
  metadata JSONB, -- For vendor-specific request/response data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Modify existing tables to align with the new structure.

-- Add foreign key from campaigns to orders.
ALTER TABLE public.campaigns ADD COLUMN active_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- Drop the old status column and add the new enum-based one.
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS status;
ALTER TABLE public.campaigns ADD COLUMN status public.campaign_status DEFAULT 'draft';

-- Add columns to mailing_list_records for better validation and tracking.
ALTER TABLE public.mailing_list_records ADD COLUMN modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.mailing_list_records ADD COLUMN status VARCHAR(50) DEFAULT 'active'; -- e.g., active, doNotContact, returnedMail

-- Update the mailing_list_versions table to be more comprehensive.
ALTER TABLE public.mailing_list_versions ADD COLUMN snapshot JSONB; -- Store a snapshot of the records at the time of versioning.

-- Refine RLS policies for new tables.
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies for mail_pieces (assuming they are public templates)
CREATE POLICY "All users can view mail pieces" ON public.mail_pieces
  FOR SELECT USING (true);

-- Policies for orders
CREATE POLICY "Users can manage their own orders" ON public.orders
  FOR ALL USING (auth.uid() = created_by);

-- Update the record count function to be more accurate.
-- This function now correctly handles updates to the 'is_valid' flag.
CREATE OR REPLACE FUNCTION public.update_mailing_list_record_count()
RETURNS TRIGGER AS $$
DECLARE
  list_id_to_update UUID;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    list_id_to_update := OLD.mailing_list_id;
  ELSE
    list_id_to_update := NEW.mailing_list_id;
  END IF;

  IF list_id_to_update IS NOT NULL THEN
    UPDATE public.mailing_lists
    SET record_count = (SELECT COUNT(*) FROM public.mailing_list_records WHERE mailing_list_id = list_id_to_update AND is_valid = true)
    WHERE id = list_id_to_update;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop the old triggers before creating the new one.
DROP TRIGGER IF EXISTS update_list_record_count_on_insert ON public.mailing_list_records;
DROP TRIGGER IF EXISTS update_list_record_count_on_delete ON public.mailing_list_records;

-- Create a single, more robust trigger for record count updates.
CREATE TRIGGER update_list_record_count
  AFTER INSERT OR DELETE OR UPDATE OF is_valid ON public.mailing_list_records
  FOR EACH ROW EXECUTE FUNCTION public.update_mailing_list_record_count();

-- Grant permissions for new tables.
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.mail_pieces TO authenticated;
GRANT ALL ON public.orders TO authenticated;
