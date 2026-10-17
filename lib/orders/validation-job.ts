const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface ValidationJobRow {
  id: string
  user_id: string
  status: string
  deliverable_count: number | null
}

export type JobCountOk = { ok: true; recordCount: number; jobId: string }
export type JobCountErr = { ok: false; status: number; error: string }
export type JobCountResult = JobCountOk | JobCountErr

type Loose = Record<string, unknown>

export function extractValidationJobId(orderState: Loose): string | null {
  const validation = (orderState.accuzipValidation ?? orderState.addressValidation) as
    | Loose
    | undefined
  const candidates = [validation?.jobId, validation?.orderId, orderState.validationJobId]
  for (const value of candidates) {
    if (typeof value === 'string' && UUID_RE.test(value)) return value
  }
  return null
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
  return { ok: true, recordCount, jobId: job.id }
}

export type JobQueryClient = { from: (table: string) => any }

export async function fetchValidationJobById(
  supabase: JobQueryClient,
  jobId: string
): Promise<ValidationJobRow | null> {
  const { data, error } = await supabase
    .from('accuzip_validation_jobs')
    .select('id, user_id, status, deliverable_count')
    .eq('id', jobId)
    .maybeSingle()
  if (error || !data) return null
  return data
}
