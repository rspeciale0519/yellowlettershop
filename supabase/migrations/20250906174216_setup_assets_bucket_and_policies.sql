-- Create 'assets' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for assets bucket (user-scoped by path prefix)
-- Users can upload files only under their own user-id folder: auth.uid()/...
DROP POLICY IF EXISTS "Assets: users can upload to their folder" ON storage.objects;
CREATE POLICY "Assets: users can upload to their folder" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'assets'
  AND name LIKE auth.uid()::text || '/%'
);

-- Users can read their own files
DROP POLICY IF EXISTS "Assets: users can read own files" ON storage.objects;
CREATE POLICY "Assets: users can read own files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'assets'
  AND name LIKE auth.uid()::text || '/%'
);

-- Users can update their own files
DROP POLICY IF EXISTS "Assets: users can update own files" ON storage.objects;
CREATE POLICY "Assets: users can update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'assets'
  AND name LIKE auth.uid()::text || '/%'
);

-- Users can delete their own files
DROP POLICY IF EXISTS "Assets: users can delete own files" ON storage.objects;
CREATE POLICY "Assets: users can delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'assets'
  AND name LIKE auth.uid()::text || '/%'
);
