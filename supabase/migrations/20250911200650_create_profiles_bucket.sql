-- Create 'profiles' bucket for user avatar uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for profiles bucket (user-scoped by path prefix)
-- Users can upload files only under their own user-id folder: auth.uid()/...
DROP POLICY IF EXISTS "Profiles: users can upload to their folder" ON storage.objects;
CREATE POLICY "Profiles: users can upload to their folder" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profiles'
  AND name LIKE auth.uid()::text || '/%'
);

-- Users can read their own files
DROP POLICY IF EXISTS "Profiles: users can read own files" ON storage.objects;
CREATE POLICY "Profiles: users can read own files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'profiles'
  AND name LIKE auth.uid()::text || '/%'
);

-- Users can update their own files
DROP POLICY IF EXISTS "Profiles: users can update own files" ON storage.objects;
CREATE POLICY "Profiles: users can update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'profiles'
  AND name LIKE auth.uid()::text || '/%'
);

-- Users can delete their own files
DROP POLICY IF EXISTS "Profiles: users can delete own files" ON storage.objects;
CREATE POLICY "Profiles: users can delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'profiles'
  AND name LIKE auth.uid()::text || '/%'
);

-- Allow public read access to profile images (avatars should be public)
DROP POLICY IF EXISTS "Profiles: public read access" ON storage.objects;
CREATE POLICY "Profiles: public read access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profiles');