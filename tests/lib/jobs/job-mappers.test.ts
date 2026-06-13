import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  type Job,
  type JobRow,
  clampProgress,
  estimateTimeRemaining,
  fromJobRow,
  generateJobId,
  toInsertRow,
} from '../../../lib/jobs/job-mappers'

describe('generateJobId', () => {
  it('produces a job_-prefixed id', () => {
    assert.match(generateJobId(), /^job_\d+_[a-z0-9]+$/)
  })
  it('is unique across calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateJobId()))
    assert.equal(ids.size, 50)
  })
})

describe('clampProgress', () => {
  it('clamps into 0-100 and rounds', () => {
    assert.equal(clampProgress(-10), 0)
    assert.equal(clampProgress(150), 100)
    assert.equal(clampProgress(33.6), 34)
  })
  it('treats non-finite values as 0', () => {
    assert.equal(clampProgress(Number.NaN), 0)
    assert.equal(clampProgress(Number.POSITIVE_INFINITY), 0)
    assert.equal(clampProgress(Number.NEGATIVE_INFINITY), 0)
  })
})

describe('estimateTimeRemaining', () => {
  it('returns undefined without a start or progress', () => {
    assert.equal(estimateTimeRemaining(undefined, 50), undefined)
    assert.equal(estimateTimeRemaining(new Date(), 0), undefined)
  })
  it('derives remaining seconds from elapsed and percent done', () => {
    const started = new Date(1_000_000)
    // 10s elapsed at 50% => ~10s remaining
    const remaining = estimateTimeRemaining(started, 50, 1_010_000)
    assert.equal(remaining, 10)
  })
  it('returns 0 once effectively complete', () => {
    const started = new Date(1_000_000)
    assert.equal(estimateTimeRemaining(started, 100, 1_010_000), 0)
  })
})

describe('toInsertRow', () => {
  it('maps a domain Job onto row columns with null defaults', () => {
    const job: Job = {
      id: 'job_1',
      type: 'import_spreadsheet',
      status: 'pending',
      progress: 0,
      data: { foo: 'bar' },
      createdAt: new Date('2026-06-13T00:00:00.000Z'),
      userId: 'user-1',
    }
    const row = toInsertRow(job)
    assert.equal(row.id, 'job_1')
    assert.equal(row.user_id, 'user-1')
    assert.equal(row.type, 'import_spreadsheet')
    assert.equal(row.status, 'pending')
    assert.equal(row.result, null)
    assert.equal(row.error, null)
    assert.deepEqual(row.metadata, {})
    assert.equal(row.created_at, '2026-06-13T00:00:00.000Z')
    assert.equal(row.started_at, null)
    assert.equal(row.completed_at, null)
  })
})

describe('fromJobRow', () => {
  const baseRow: JobRow = {
    id: 'job_2',
    user_id: 'user-2',
    type: 'validate_emails',
    status: 'running',
    progress: 42,
    data: { emails: ['a@b.com'] },
    result: null,
    error: null,
    metadata: { totalRecords: 5 },
    created_at: '2026-06-13T00:00:00.000Z',
    started_at: '2026-06-13T00:00:01.000Z',
    completed_at: null,
  }

  it('reconstructs a Job from a row', () => {
    const job = fromJobRow(baseRow)
    assert.equal(job.id, 'job_2')
    assert.equal(job.userId, 'user-2')
    assert.equal(job.type, 'validate_emails')
    assert.equal(job.status, 'running')
    assert.equal(job.progress, 42)
    assert.deepEqual(job.metadata, { totalRecords: 5 })
    assert.ok(job.startedAt instanceof Date)
    assert.equal(job.completedAt, undefined)
  })

  it('falls back safely on unknown enum values', () => {
    const job = fromJobRow({ ...baseRow, type: 'bogus', status: 'weird' })
    assert.equal(job.type, 'import_spreadsheet')
    assert.equal(job.status, 'pending')
  })

  it('round-trips insert -> row -> Job for the stable fields', () => {
    const original: Job = {
      id: 'job_3',
      type: 'export_records',
      status: 'completed',
      progress: 100,
      data: { recordCount: 10 },
      result: { exported: 10 },
      error: undefined,
      createdAt: new Date('2026-06-13T01:00:00.000Z'),
      startedAt: new Date('2026-06-13T01:00:01.000Z'),
      completedAt: new Date('2026-06-13T01:00:05.000Z'),
      userId: 'user-3',
      metadata: { totalRecords: 10 },
    }
    const row = toInsertRow(original)
    const back = fromJobRow(row)
    assert.equal(back.id, original.id)
    assert.equal(back.type, original.type)
    assert.equal(back.status, original.status)
    assert.equal(back.progress, original.progress)
    assert.deepEqual(back.data, original.data)
    assert.deepEqual(back.result, original.result)
    assert.deepEqual(back.metadata, original.metadata)
    assert.equal(back.createdAt.toISOString(), original.createdAt.toISOString())
    assert.equal(back.completedAt?.toISOString(), original.completedAt?.toISOString())
  })
})
