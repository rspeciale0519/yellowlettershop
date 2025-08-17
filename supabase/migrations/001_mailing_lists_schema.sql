-- Create mailing lists table
CREATE TABLE IF NOT EXISTS public.mailing_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  record_count INTEGER DEFAULT 0,
  criteria JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  purchase_count INTEGER DEFAULT 0
);

-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create mailing list tags junction table
CREATE TABLE IF NOT EXISTS public.mailing_list_tags (
  mailing_list_id UUID REFERENCES public.mailing_lists(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (mailing_list_id, tag_id)
);

-- Create mailing list records table
CREATE TABLE IF NOT EXISTS public.mailing_list_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mailing_list_id UUID REFERENCES public.mailing_lists(id) ON DELETE CASCADE,
  
  -- Contact Information
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  middle_name VARCHAR(100),
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Address Information
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  county VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Property Information
  property_type VARCHAR(50),
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  square_feet INTEGER,
  lot_size DECIMAL(10, 2),
  year_built INTEGER,
  estimated_value DECIMAL(12, 2),
  last_sale_date DATE,
  last_sale_price DECIMAL(12, 2),
  
  -- Mortgage Information
  loan_type VARCHAR(50),
  loan_amount DECIMAL(12, 2),
  interest_rate DECIMAL(5, 3),
  loan_to_value DECIMAL(5, 2),
  origination_date DATE,
  maturity_date DATE,
  lender_name VARCHAR(255),
  
  -- Demographics
  age INTEGER,
  gender VARCHAR(20),
  marital_status VARCHAR(20),
  income DECIMAL(12, 2),
  net_worth DECIMAL(15, 2),
  home_ownership VARCHAR(20),
  occupation VARCHAR(100),
  education_level VARCHAR(50),
  
  -- Foreclosure Information
  foreclosure_status VARCHAR(50),
  filing_date DATE,
  auction_date DATE,
  redemption_date DATE,
  
  -- Predictive Analytics
  likely_to_move BOOLEAN,
  likely_to_sell BOOLEAN,
  likely_to_refinance BOOLEAN,
  motivation_score INTEGER,
  
  -- Metadata
  data_source VARCHAR(50),
  external_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_valid BOOLEAN DEFAULT true,
  validation_errors JSONB
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  type VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create campaign mailing lists junction table
CREATE TABLE IF NOT EXISTS public.campaign_mailing_lists (
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  mailing_list_id UUID REFERENCES public.mailing_lists(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (campaign_id, mailing_list_id)
);

-- Create mailing list versions table for history tracking
CREATE TABLE IF NOT EXISTS public.mailing_list_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mailing_list_id UUID REFERENCES public.mailing_lists(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  record_count INTEGER,
  criteria JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_description TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_mailing_lists_created_by ON public.mailing_lists(created_by);
CREATE INDEX idx_mailing_lists_is_active ON public.mailing_lists(is_active);
CREATE INDEX idx_mailing_lists_created_at ON public.mailing_lists(created_at);

CREATE INDEX idx_mailing_list_records_list_id ON public.mailing_list_records(mailing_list_id);
CREATE INDEX idx_mailing_list_records_state ON public.mailing_list_records(state);
CREATE INDEX idx_mailing_list_records_city ON public.mailing_list_records(city);
CREATE INDEX idx_mailing_list_records_zip ON public.mailing_list_records(zip_code);
CREATE INDEX idx_mailing_list_records_property_type ON public.mailing_list_records(property_type);
CREATE INDEX idx_mailing_list_records_foreclosure ON public.mailing_list_records(foreclosure_status);
CREATE INDEX idx_mailing_list_records_email ON public.mailing_list_records(email);
CREATE INDEX idx_mailing_list_records_phone ON public.mailing_list_records(phone);

CREATE INDEX idx_tags_name ON public.tags(name);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_created_by ON public.campaigns(created_by);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mailing_lists_updated_at BEFORE UPDATE ON public.mailing_lists 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mailing_list_records_updated_at BEFORE UPDATE ON public.mailing_list_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update record count
CREATE OR REPLACE FUNCTION update_mailing_list_record_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.mailing_lists 
    SET record_count = record_count + 1 
    WHERE id = NEW.mailing_list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.mailing_lists 
    SET record_count = record_count - 1 
    WHERE id = OLD.mailing_list_id;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_list_record_count_on_insert 
  AFTER INSERT ON public.mailing_list_records 
  FOR EACH ROW EXECUTE FUNCTION update_mailing_list_record_count();

CREATE TRIGGER update_list_record_count_on_delete 
  AFTER DELETE ON public.mailing_list_records 
  FOR EACH ROW EXECUTE FUNCTION update_mailing_list_record_count();

-- Row Level Security (RLS) Policies
ALTER TABLE public.mailing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailing_list_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailing_list_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_mailing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailing_list_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own mailing lists" ON public.mailing_lists
  FOR SELECT USING (auth.uid() = created_by OR is_active = true);

CREATE POLICY "Users can create mailing lists" ON public.mailing_lists
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own mailing lists" ON public.mailing_lists
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own mailing lists" ON public.mailing_lists
  FOR DELETE USING (auth.uid() = created_by);

-- Similar policies for other tables
CREATE POLICY "Users can view records of their lists" ON public.mailing_list_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mailing_lists 
      WHERE id = mailing_list_records.mailing_list_id 
      AND (created_by = auth.uid() OR is_active = true)
    )
  );

CREATE POLICY "Users can manage records of their lists" ON public.mailing_list_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mailing_lists 
      WHERE id = mailing_list_records.mailing_list_id 
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "All users can view tags" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "Users can create tags" ON public.tags
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can manage their campaign" ON public.campaigns
  FOR ALL USING (auth.uid() = created_by);

-- Grant necessary permissions
GRANT ALL ON public.mailing_lists TO authenticated;
GRANT ALL ON public.mailing_list_records TO authenticated;
GRANT ALL ON public.tags TO authenticated;
GRANT ALL ON public.mailing_list_tags TO authenticated;
GRANT ALL ON public.campaigns TO authenticated;
GRANT ALL ON public.campaign_mailing_lists TO authenticated;
GRANT ALL ON public.mailing_list_versions TO authenticated;
