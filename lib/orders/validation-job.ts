import { z } from 'zod'
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface ValidationJobRow {
  id: string
  user_id: string
  status: string
  deliverable_count: number | null
  validated_records?: unknown
}

const recipientSchema = z.object({
  is_deliverable: z.boolean(),
  standardized_address: z.object({ address_line_1: z.string().min(1), address_line_2: z.string().optional(), city: z.string().min(1), state: z.string().min(1), zip: z.string().min(1) }),
}).passthrough()
export type VerifiedRecipient = z.infer<typeof recipientSchema> & { address_line_1: string; city: string; state: string; zip: string; zip_code: string }
export type JobCountOk = { ok: true; recordCount: number; jobId: string; recipients: VerifiedRecipient[]; totalRecords: number }
export type JobCountErr = { ok: false; status: number; error: string }
export type JobCountResult = JobCountOk | JobCountErr

type Loose = Record<string, unknown>

export function extractValidationJobId(orderState: Loose): string | null {
  const candidates = [orderState.accuzipValidation, orderState.addressValidation].flatMap(value => {
    const validation = value as Loose | undefined
    return [validation?.jobId, validation?.orderId]
  }).concat(orderState.validationJobId).filter(value => value !== undefined && value !== null && value !== '')
  if (!candidates.length || candidates.some(value => typeof value !== 'string' || !UUID_RE.test(value))) return null
  const ids = [...new Set(candidates as string[])]
  return ids.length === 1 ? ids[0] : null
}

export function evaluateOwnedFinishedJob(
  job: ValidationJobRow | null,
  userId: string
): JobCountResult {
  if (!job) return { ok: false, status: 404, error: 'Validation job not found' }
  if (job.user_id !== userId) {
    return { ok: false, status: 403, error: 'Validation job does not belong to this account' }
  }
  if (job.status !== 'completed') {
    return { ok: false, status: 400, error: 'Validation job is not finished' }
  }
  const recordCount = job.deliverable_count ?? 0
  if (!Number.isInteger(recordCount) || recordCount < 1) {
    return { ok: false, status: 400, error: 'Validation job has no deliverable records' }
  }
  const records = z.array(z.object({ is_deliverable: z.boolean() }).passthrough()).safeParse(job.validated_records)
  if (!records.success) return { ok: false, status: 400, error: 'Invalid validation recipient snapshot' }
  const deliverable = z.array(recipientSchema).safeParse(records.data.filter(row => row.is_deliverable))
  if (!deliverable.success || deliverable.data.length !== recordCount) return { ok: false, status: 400, error: 'Validation count does not match its recipient snapshot' }
  const recipients = deliverable.data.map(record => ({ ...record, ...record.standardized_address, zip_code: record.standardized_address.zip }))
  return { ok: true, recordCount: recipients.length, jobId: job.id, recipients, totalRecords: records.data.length }
}

export type JobQueryClient = { from: (table: string) => any }

export async function fetchValidationJobById(
  supabase: JobQueryClient,
  jobId: string,
  userId: string
): Promise<ValidationJobRow | null> {
  const { data, error } = await supabase
    .from('accuzip_validation_jobs')
    .select('id, user_id, status, deliverable_count, validated_records')
    .eq('id', jobId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data
}
