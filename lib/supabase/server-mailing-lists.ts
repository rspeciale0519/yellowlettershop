import { createServerClient } from '@/utils/supabase/server'
import type { MailingList } from '@/types/supabase'
import type { CreateMailingListPayload } from '@/lib/supabase/mailing-lists'

export async function createMailingList(list: CreateMailingListPayload): Promise<MailingList> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('mailing_lists')
    .insert({
      ...list,
      created_by: user?.id ?? null,
      version: 1,
    })
    .select()
    .single()

  if (error) throw error
  return data as MailingList
}
