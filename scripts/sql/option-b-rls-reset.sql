-- Option B: Replace recursive RLS with minimal, non-recursive owner checks
-- Applies to: public.user_profiles, public.mailing_lists, public.mailing_list_records
-- Usage: Run this in Supabase SQL editor or psql connected to your project.

-- 1) Drop existing policies on the target tables (whatever their names are)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('user_profiles','mailing_lists','mailing_list_records')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 2) Ensure RLS is enabled (devs sometimes disable during debugging)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailing_list_records ENABLE ROW LEVEL SECURITY;

-- 3) Minimal, non-recursive policies
-- user_profiles: a user can only see/update/insert their own profile row
CREATE POLICY up_select ON public.user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY up_update ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Optional: allow users to create their profile row (if not auto-provisioned)
CREATE POLICY up_insert ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- mailing_lists: owned by user_id
CREATE POLICY ml_select ON public.mailing_lists
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY ml_insert ON public.mailing_lists
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY ml_update ON public.mailing_lists
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- mailing_list_records: rows belong to a list; allow access if the user owns that list
-- Note: This references mailing_lists but does NOT reference user_profiles, avoiding recursion.
CREATE POLICY mlr_select ON public.mailing_list_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mailing_lists ml
      WHERE ml.id = mailing_list_id AND ml.user_id = auth.uid()
    )
  );

CREATE POLICY mlr_insert ON public.mailing_list_records
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mailing_lists ml
      WHERE ml.id = mailing_list_id AND ml.user_id = auth.uid()
    )
  );

CREATE POLICY mlr_update ON public.mailing_list_records
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mailing_lists ml
      WHERE ml.id = mailing_list_id AND ml.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mailing_lists ml
      WHERE ml.id = mailing_list_id AND ml.user_id = auth.uid()
    )
  );

CREATE POLICY mlr_delete ON public.mailing_list_records
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mailing_lists ml
      WHERE ml.id = mailing_list_id AND ml.user_id = auth.uid()
    )
  );

-- 4) Grants (ensure the API roles can use the tables; Supabase often sets these, but this is safe)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mailing_lists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mailing_list_records TO authenticated;

-- 5) Verify (run this query manually in your console to review)
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('user_profiles','mailing_lists','mailing_list_records');

