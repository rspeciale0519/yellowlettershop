-- Admin notes on user accounts
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Account credit/balance management
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund_credit', 'promotional', 'adjustment')),
  description TEXT NOT NULL,
  reference_id TEXT,
  reference_type TEXT,
  balance_after DECIMAL(10,2) NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add status column to user_profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN account_status TEXT DEFAULT 'active'
      CHECK (account_status IN ('active', 'suspended', 'banned'));
  END IF;
END $$;

CREATE INDEX idx_user_notes_user ON user_notes(user_id, created_at DESC);
CREATE INDEX idx_user_credits_user ON user_credits(user_id, created_at DESC);
CREATE INDEX idx_user_credits_balance ON user_credits(user_id, balance_after);
