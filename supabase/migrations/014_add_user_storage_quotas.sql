-- Migration: Add file storage quota system to user_profiles
-- This enables per-user file storage limits based on subscription tiers

-- Add quota columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS file_quota_mb INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS used_storage_mb INTEGER DEFAULT 0;

-- Set quota defaults by subscription plan
UPDATE user_profiles 
SET file_quota_mb = CASE 
  WHEN subscription_plan = 'free' THEN 100        -- 100MB for free tier
  WHEN subscription_plan = 'pro' THEN 1024        -- 1GB for pro tier  
  WHEN subscription_plan = 'team' THEN 5120       -- 5GB for team tier
  WHEN subscription_plan = 'enterprise' THEN 25600 -- 25GB for enterprise tier
  ELSE 100 -- Default to free tier limit
END
WHERE file_quota_mb IS NULL OR file_quota_mb = 100;

-- Create indexes for quota queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_user_profiles_storage_quota 
ON user_profiles (user_id, file_quota_mb, used_storage_mb);

-- Create function to calculate current storage usage
CREATE OR REPLACE FUNCTION calculate_user_storage_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_usage_bytes BIGINT;
  total_usage_mb INTEGER;
BEGIN
  -- Calculate total file size for user
  SELECT COALESCE(SUM(file_size), 0)
  INTO total_usage_bytes
  FROM user_assets 
  WHERE user_id = p_user_id;
  
  -- Convert to MB (rounded up)
  total_usage_mb := CEIL(total_usage_bytes::NUMERIC / (1024 * 1024));
  
  RETURN total_usage_mb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user storage usage
CREATE OR REPLACE FUNCTION update_user_storage_usage(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  current_usage INTEGER;
BEGIN
  -- Calculate current usage
  current_usage := calculate_user_storage_usage(p_user_id);
  
  -- Update user_profiles table
  UPDATE user_profiles 
  SET used_storage_mb = current_usage,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has quota space available
CREATE OR REPLACE FUNCTION check_storage_quota(p_user_id UUID, p_additional_mb INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_quota INTEGER;
  current_usage INTEGER;
BEGIN
  -- Get current quota and usage
  SELECT file_quota_mb, used_storage_mb
  INTO current_quota, current_usage
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- Check if adding the additional storage would exceed quota
  RETURN (current_usage + p_additional_mb) <= current_quota;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update storage usage when assets are added/deleted
CREATE OR REPLACE FUNCTION trigger_update_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- New asset added
    PERFORM update_user_storage_usage(NEW.user_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Asset deleted
    PERFORM update_user_storage_usage(OLD.user_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Asset updated (file size might have changed)
    PERFORM update_user_storage_usage(NEW.user_id);
    IF OLD.user_id != NEW.user_id THEN
      -- User changed, update both
      PERFORM update_user_storage_usage(OLD.user_id);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_user_assets_storage_update ON user_assets;
CREATE TRIGGER trigger_user_assets_storage_update
  AFTER INSERT OR UPDATE OR DELETE ON user_assets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_storage_usage();

-- Update RLS policies to include quota checks
CREATE POLICY "Users can only insert assets within quota" ON user_assets
  FOR INSERT 
  WITH CHECK (
    -- User can only insert if they own the asset or are team member
    (user_id = auth.uid() OR team_id IN (
      SELECT team_id FROM user_profiles WHERE user_id = auth.uid()
    ))
    AND 
    -- Check storage quota (convert bytes to MB)
    check_storage_quota(
      auth.uid(), 
      CEIL(file_size::NUMERIC / (1024 * 1024))::INTEGER
    )
  );

-- Initial storage usage calculation for existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT DISTINCT user_id FROM user_assets
  LOOP
    PERFORM update_user_storage_usage(user_record.user_id);
  END LOOP;
END;
$$;

-- Add helpful comments
COMMENT ON COLUMN user_profiles.file_quota_mb IS 'Maximum file storage quota in megabytes based on subscription plan';
COMMENT ON COLUMN user_profiles.used_storage_mb IS 'Current storage usage in megabytes, automatically updated via triggers';
COMMENT ON FUNCTION calculate_user_storage_usage(UUID) IS 'Calculates total storage usage for a user in megabytes';
COMMENT ON FUNCTION update_user_storage_usage(UUID) IS 'Updates the used_storage_mb field for a user based on actual file sizes';
COMMENT ON FUNCTION check_storage_quota(UUID, INTEGER) IS 'Checks if user has enough quota space for additional storage';
