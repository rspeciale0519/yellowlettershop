// Pure mapping + helper logic for the background job queue, separated from the
// Supabase store so it is unit testable without a database (mirrors the
// rate-limit policy/index split). No I/O, no `server-only`, no Supabase here.

export type JobType =
  | 'import_spreadsheet'
  | 'validate_emails'
  | 'validate_addresses'
  | 'duplicate_detection'
  | 'export_records'
  | 'bulk_update'

export type JobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

// Job payloads are heterogeneous per type and persisted as jsonb, so they are
// modeled as opaque records/values and narrowed by the individual processors.
export type JobData = Record<string, unknown>
export type JobResult = unknown

export interface JobMetadata {
  totalRecords?: number
  processedRecords?: number
  validRecords?: number
  errorRecords?: number
  estimatedTimeRemaining?: number
}

export interface Job {
  id: string
  type: JobType
  status: JobStatus
  progress: number // 0-100
  data: JobData
  result?: JobResult
  error?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  userId: string
  metadata?: JobMetadata
}

export interface JobProgress {
  current: number
  total: number
  message: string
  percentage: number
}

// Shape of a `background_jobs` row. Columns mirror the table defined in
// supabase/migrations/20260613000000_consolidate_db1_model.sql.
export interface JobRow {
  id: string
  user_id: string
  type: string
  status: string
  progress: number
  data: JobData
  result: JobResult | null
  error: string | null
  metadata: JobMetadata
  created_at: string
  started_at: string | null
  completed_at: string | null
}

const JOB_STATUSES: readonly JobStatus[] = [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]

const JOB_TYPES: readonly JobType[] = [
  'import_spreadsheet',
  'validate_emails',
  'validate_addresses',
  'duplicate_detection',
  'export_records',
  'bulk_update',
]

/** Generate a unique job id (also used as the table primary key). */
export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

/** Clamp a raw progress value into the table's 0-100 contract. */
export function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0
  return Math.min(100, Math.max(0, Math.round(progress)))
}

/**
 * Seconds of work remaining, estimated from elapsed time and percent done.
 * Returns undefined when it cannot be derived (no start, no progress yet).
 */
export function estimateTimeRemaining(
  startedAt: Date | undefined,
  progress: number,
  now: number = Date.now()
): number | undefined {
  if (!startedAt || progress <= 0) return undefined
  const elapsed = now - startedAt.getTime()
  if (elapsed <= 0) return undefined
  const estimatedTotal = (elapsed / progress) * 100
  const remaining = Math.max(0, estimatedTotal - elapsed)
  return Math.round(remaining / 1000)
}

function isJobStatus(value: string): value is JobStatus {
  return (JOB_STATUSES as readonly string[]).includes(value)
}

function isJobType(value: string): value is JobType {
  return (JOB_TYPES as readonly string[]).includes(value)
}

function toIsoOrNull(date: Date | undefined): string | null {
  return date ? date.toISOString() : null
}

function fromIso(value: string | null): Date | undefined {
  if (!value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

/** Map a domain Job onto the row columns for insert. */
export function toInsertRow(job: Job): JobRow {
  return {
    id: job.id,
    user_id: job.userId,
    type: job.type,
    status: job.status,
    progress: clampProgress(job.progress),
    data: job.data,
    result: job.result ?? null,
    error: job.error ?? null,
    metadata: job.metadata ?? {},
    created_at: job.createdAt.toISOString(),
    started_at: toIsoOrNull(job.startedAt),
    completed_at: toIsoOrNull(job.completedAt),
  }
}

/** Reconstruct a domain Job from a persisted row (authoritative read). */
export function fromJobRow(row: JobRow): Job {
  return {
    id: row.id,
    userId: row.user_id,
    type: isJobType(row.type) ? row.type : 'import_spreadsheet',
    status: isJobStatus(row.status) ? row.status : 'pending',
    progress: clampProgress(row.progress),
    data: row.data ?? {},
    result: row.result ?? undefined,
    error: row.error ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: fromIso(row.created_at) ?? new Date(),
    startedAt: fromIso(row.started_at),
    completedAt: fromIso(row.completed_at),
  }
}
