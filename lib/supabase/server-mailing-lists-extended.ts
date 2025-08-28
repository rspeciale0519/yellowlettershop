import { createServerClient } from '@/utils/supabase/server';
import type { MailingListRecord } from '@/types/supabase';

export async function bulkImportRecords(
  listId: string,
  records: Partial<MailingListRecord>[],
  deduplicationField?: string
): Promise<{ success: number; failed: number; duplicates: number }> {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();

  let success = 0;
  let failed = 0;
  let duplicates = 0;

  const batchSize = 100;
  const SAFE_COLUMN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    if (deduplicationField) {
      if (!SAFE_COLUMN.test(String(deduplicationField))) {
        throw new Error(`Invalid deduplication field: ${deduplicationField}`)
      }
      
      const fieldValues = batch
        .map(r => (r as any)[deduplicationField as string])
        .filter(v => v !== null && v !== undefined)
      const uniqueFieldValues = Array.from(new Set(fieldValues))

      if (uniqueFieldValues.length > 0) {
        const { data: existingRecords, error: selectError } = await supabase
          .from('mailing_list_records')
          .select(deduplicationField)
          .eq('mailing_list_id', listId)
          .in(deduplicationField, uniqueFieldValues)
        
        if (selectError) {
          failed += batch.length;
          continue;
        }
        
        const existingValues = new Set(
          existingRecords?.map((r: any) => r[deduplicationField]) || []
        );

        const uniqueRecords: Partial<MailingListRecord>[] = [];
        for (const record of batch) {
          if (existingValues.has((record as any)[deduplicationField])) {
            duplicates++;
          } else {
            uniqueRecords.push(record);
          }
        }

        if (uniqueRecords.length > 0) {
          const recordsWithMetadata = uniqueRecords.map((record) => ({
            ...record,
            mailing_list_id: listId,
            created_by: userData?.user?.id,
            is_valid: true,
            created_at: new Date().toISOString(),
          }));

          const { error } = await supabase
            .from('mailing_list_records')
            .insert(recordsWithMetadata);

          if (error) {
            failed += uniqueRecords.length;
          } else {
            success += uniqueRecords.length;
          }
        }
      }
    } else {
      const recordsWithMetadata = batch.map((record) => ({
        ...record,
        mailing_list_id: listId,
        created_by: userData?.user?.id,
        is_valid: true,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('mailing_list_records')
        .insert(recordsWithMetadata);

      if (error) {
        failed += batch.length;
      } else {
        success += batch.length;
      }
    }
  }

  const { count } = await supabase
    .from('mailing_list_records')
    .select('*', { count: 'exact', head: true })
    .eq('mailing_list_id', listId);

  await supabase
    .from('mailing_lists')
    .update({ record_count: count || 0 })
    .eq('id', listId);

  return { success, failed, duplicates };
}
