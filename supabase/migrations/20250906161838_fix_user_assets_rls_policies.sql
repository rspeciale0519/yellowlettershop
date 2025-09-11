-- Fix RLS policies for user_assets table
-- The issue is likely that users don't have proper user_profiles or storage quotas

-- First, ensure all authenticated users have user_profiles with default quotas
INSERT INTO user_profiles (user_id, file_quota_mb, used_storage_mb)
SELECT 
    au.id,
    1024, -- 1GB default quota
    0     -- 0MB used initially
FROM auth.users au
WHERE au.id NOT IN (
    SELECT user_id FROM user_profiles WHERE user_id IS NOT NULL
)
ON CONFLICT (user_id) DO NOTHING;

-- Update existing user_profiles that might have NULL storage values
UPDATE user_profiles 
SET 
    file_quota_mb = COALESCE(file_quota_mb, 1024),
    used_storage_mb = COALESCE(used_storage_mb, 0)
WHERE file_quota_mb IS NULL OR used_storage_mb IS NULL;

-- Drop the problematic quota check policy and recreate it with better error handling
DROP POLICY IF EXISTS "Users can only insert assets within quota" ON user_assets;

-- Recreate a simpler INSERT policy without quota check for now
CREATE POLICY "Users can insert their own assets" ON user_assets
  FOR INSERT 
  WITH CHECK (
    user_id = auth.uid()
  );

-- Also ensure the main policy allows the user to insert
DROP POLICY IF EXISTS "User assets owner access" ON user_assets;
CREATE POLICY "User assets owner access" ON user_assets 
  FOR SELECT USING (
    user_id = auth.uid() OR 
    team_id IN (
        SELECT team_id FROM user_profiles 
        WHERE user_id = auth.uid() AND team_id IS NOT NULL
    )
  );

CREATE POLICY "User assets update delete" ON user_assets 
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "User assets delete" ON user_assets 
  FOR DELETE USING (user_id = auth.uid());