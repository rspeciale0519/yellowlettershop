-- Fix infinite recursion in user_profiles RLS policies
-- Drop problematic policies that caused recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Fix user_assets policy that referenced user_profiles (causing issues for new users)
DROP POLICY IF EXISTS "User assets owner access" ON user_assets;
CREATE POLICY "User assets owner access" ON user_assets 
FOR SELECT USING (user_id = auth.uid());

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to auto-create user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for existing users that don't have one
INSERT INTO public.user_profiles (user_id)
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;