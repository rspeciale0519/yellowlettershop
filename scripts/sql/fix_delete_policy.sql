-- Fix missing DELETE policy for mailing_list_records
-- This allows users to delete records from lists they own

CREATE POLICY mlr_delete ON public.mailing_list_records
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mailing_lists ml
      WHERE ml.id = mailing_list_id AND ml.user_id = auth.uid()
    )
  );