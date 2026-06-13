/**
 * Background Job Queue System
 *
 * Job STATE is persisted to the `background_jobs` Postgres table via the
 * service-role client, so status survives serverless instance recycling and a
 * different instance can read authoritative progress. The async work may still
 * run in-process, but the DB row — not an in-memory Map — is the source of
 * truth. Pure mapping logic lives in ./job-mappers; processors in
 * ./job-processors.
 */
import 'server-only'
import { createClient } from '@/utils/supabase/service'
import { releaseBatchSlot } from '@/lib/system/batch-limits'
import {
  type Job,
  type JobData,
  type JobMetadata,
  type JobResult,
  type JobRow,
  type JobType,
  clampProgress,
  estimateTimeRemaining,
  fromJobRow,
  generateJobId,
  toInsertRow,
} from './job-mappers'

export type {
  Job,
  JobData,
  JobMetadata,
  JobProgress,
  JobResult,
  JobStatus,
  JobType,
} from './job-mappers'

const TABLE = 'background_jobs'

// Same-instance listeners only (best effort). Cross-instance consumers must
// poll getJob, which reads the authoritative DB row.
const jobCallbacks = new Map<string, (job: Job) => void>()

function db() {
  return createClient()
}

async function fetchRow(jobId: string): Promise<JobRow | null> {
  const { data, error } = await db()
    .from(TABLE)
    .select('*')
    .eq('id', jobId)
    .maybeSingle()
  if (error) {
    console.error(`Job fetch error for ${jobId}:`, error)
    return null
  }
  return (data as JobRow | null) ?? null
}

async function applyRowUpdate(
  jobId: string,
  patch: Partial<JobRow>
): Promise<Job | null> {
  const { data, error } = await db()
    .from(TABLE)
    .update(patch)
    .eq('id', jobId)
    .select('*')
    .maybeSingle()
  if (error || !data) {
    if (error) console.error(`Job update error for ${jobId}:`, error)
    return null
  }
  const job = fromJobRow(data as JobRow)
  notify(job)
  return job
}

function notify(job: Job): void {
  const callback = jobCallbacks.get(job.id)
  if (callback) callback(job)
}

/**
 * Create and persist a new background job, then kick off in-process work.
 * Returns the persisted Job. Async because the row is written before return so
 * any instance can immediately read it.
 */
export async function createJob(
  type: JobType,
  data: JobData,
  userId: string,
  metadata?: JobMetadata
): Promise<Job> {
  const job: Job = {
    id: generateJobId(),
    type,
    status: 'pending',
    progress: 0,
    data,
    createdAt: new Date(),
    userId,
    metadata,
  }

  const { error } = await db().from(TABLE).insert(toInsertRow(job))
  if (error) {
    console.error('Job creation error:', error)
    throw new Error('Failed to persist background job')
  }

  // Kick off processing without blocking the caller. Dynamic import breaks the
  // job-queue <-> job-processors require cycle (processors import the mutators
  // below). Failures are caught and recorded on the row.
  void import('./job-processors').then(({ processJob }) =>
    processJob(job.id).catch((err) => {
      console.error(`Job ${job.id} dispatch failed:`, err)
    })
  )

  return job
}

/** Get a job by id from the authoritative DB row. */
export async function getJob(jobId: string): Promise<Job | undefined> {
  const row = await fetchRow(jobId)
  return row ? fromJobRow(row) : undefined
}

/** Get all jobs for a user from the DB, newest first. */
export async function getUserJobs(userId: string): Promise<Job[]> {
  const { data, error } = await db()
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error(`User jobs fetch error for ${userId}:`, error)
    return []
  }
  return (data as JobRow[] | null)?.map(fromJobRow) ?? []
}

/** Mark a job as running (transitions pending -> running, stamps started_at). */
export async function startJob(jobId: string): Promise<Job | undefined> {
  const row = await fetchRow(jobId)
  if (!row || row.status !== 'pending') return undefined
  return (await applyRowUpdate(jobId, {
    status: 'running',
    started_at: new Date().toISOString(),
  })) ?? undefined
}

/** Update job progress (0-100) and optionally merge metadata. */
export async function updateJobProgress(
  jobId: string,
  progress: number,
  _message?: string,
  metadata?: Partial<JobMetadata>
): Promise<void> {
  const row = await fetchRow(jobId)
  if (!row) return

  const nextProgress = clampProgress(progress)
  const mergedMetadata: JobMetadata = { ...row.metadata, ...metadata }

  const startedAt = row.started_at ? new Date(row.started_at) : undefined
  const remaining = estimateTimeRemaining(startedAt, nextProgress)
  if (remaining !== undefined) {
    mergedMetadata.estimatedTimeRemaining = remaining
  }

  await applyRowUpdate(jobId, {
    progress: nextProgress,
    metadata: mergedMetadata,
  })
}

/** Complete a job successfully and release its batch slot. */
export async function completeJob(
  jobId: string,
  result: JobResult
): Promise<void> {
  const row = await fetchRow(jobId)
  if (!row) return

  await applyRowUpdate(jobId, {
    status: 'completed',
    progress: 100,
    result: result ?? null,
    completed_at: new Date().toISOString(),
  })

  releaseBatchSlot(row.user_id)
  jobCallbacks.delete(jobId)
}

/** Fail a job with an error message and release its batch slot. */
export async function failJob(jobId: string, error: string): Promise<void> {
  const row = await fetchRow(jobId)
  if (!row) return

  await applyRowUpdate(jobId, {
    status: 'failed',
    error,
    completed_at: new Date().toISOString(),
  })

  releaseBatchSlot(row.user_id)
  jobCallbacks.delete(jobId)
}

/**
 * Cancel a job. Returns false if it is missing or already terminal. Uses a
 * status-guarded conditional update so two instances cannot both "cancel".
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  const row = await fetchRow(jobId)
  if (!row || row.status === 'completed' || row.status === 'failed') {
    return false
  }

  const { data, error } = await db()
    .from(TABLE)
    .update({ status: 'cancelled', completed_at: new Date().toISOString() })
    .eq('id', jobId)
    .in('status', ['pending', 'running', 'cancelled'])
    .select('*')
    .maybeSingle()

  if (error || !data) {
    if (error) console.error(`Job cancel error for ${jobId}:`, error)
    return false
  }

  notify(fromJobRow(data as JobRow))
  releaseBatchSlot(row.user_id)
  jobCallbacks.delete(jobId)
  return true
}

/**
 * Register a best-effort callback for job updates on THIS instance only.
 * Cross-instance consumers must poll getJob.
 */
export function onJobUpdate(jobId: string, callback: (job: Job) => void): void {
  jobCallbacks.set(jobId, callback)
}

/** Delete old terminal jobs. Returns the number of rows removed. */
export async function cleanupOldJobs(
  maxAge: number = 24 * 60 * 60 * 1000
): Promise<number> {
  const cutoff = new Date(Date.now() - maxAge).toISOString()
  const { data, error } = await db()
    .from(TABLE)
    .delete()
    .lt('completed_at', cutoff)
    .in('status', ['completed', 'failed', 'cancelled'])
    .select('id')
  if (error) {
    console.error('Job cleanup error:', error)
    return 0
  }
  return (data as { id: string }[] | null)?.length ?? 0
}
