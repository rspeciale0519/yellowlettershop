-- Pricing configuration table: stores all configurable pricing
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN (
    'mail_piece', 'paper_stock', 'finish', 'postage',
    'shipping', 'volume_discount', 'address_validation',
    'add_on_service', 'design_service'
  )),
  key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  pricing_model TEXT NOT NULL DEFAULT 'flat' CHECK (pricing_model IN (
    'flat', 'per_unit', 'tiered', 'volume_discount'
  )),
  unit_amount INTEGER,
  unit_label TEXT,
  tier_config JSONB,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, key)
);

-- Pricing change log for audit trail
CREATE TABLE IF NOT EXISTS pricing_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_config_id UUID REFERENCES pricing_config(id) ON DELETE SET NULL,
  changed_by UUID REFERENCES auth.users(id) NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'deactivate', 'reactivate')),
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_config_category ON pricing_config(category, is_active);
CREATE INDEX idx_pricing_config_key ON pricing_config(key);
CREATE INDEX idx_pricing_change_log_config ON pricing_change_log(pricing_config_id, created_at DESC);
CREATE INDEX idx_pricing_change_log_actor ON pricing_change_log(changed_by, created_at DESC);
