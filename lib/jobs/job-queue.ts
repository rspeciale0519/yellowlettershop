/**
 * Background Job Queue System
 * Handles long-running tasks like large imports without blocking the UI
 */

import { releaseBatchSlot } from '@/lib/system/batch-limits'

export interface Job {
  id: string
  type: JobType
  status: JobStatus
  progress: number // 0-100
  data: any
  result?: any
  error?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  userId: string
  metadata?: {
    totalRecords?: number
    processedRecords?: number
    validRecords?: number
    errorRecords?: number
    estimatedTimeRemaining?: number
  }
}

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

export interface JobProgress {
  current: number
  total: number
  message: string
  percentage: number
}

// In-memory job storage (in production, use Redis or database)
const jobs = new Map<string, Job>()
const jobCallbacks = new Map<string, (job: Job) => void>()

/**
 * Create a new background job
 */
export function createJob(
  type: JobType,
  data: any,
  userId: string,
  metadata?: Job['metadata']
): Job {
  const job: Job = {
    id: generateJobId(),
    type,
    status: 'pending',
    progress: 0,
    data,
    createdAt: new Date(),
    userId,
    metadata
  }

  jobs.set(job.id, job)
  
  // Start processing the job asynchronously
  setTimeout(() => processJob(job.id), 100)
  
  return job
}

/**
 * Get job by ID
 */
export function getJob(jobId: string): Job | undefined {
  return jobs.get(jobId)
}

/**
 * Get all jobs for a user
 */
export function getUserJobs(userId: string): Job[] {
  return Array.from(jobs.values()).filter(job => job.userId === userId)
}

/**
 * Update job progress
 */
export function updateJobProgress(
  jobId: string,
  progress: number,
  message?: string,
  metadata?: Partial<Job['metadata']>
): void {
  const job = jobs.get(jobId)
  if (!job) return

  job.progress = Math.min(100, Math.max(0, progress))
  
  if (metadata) {
    job.metadata = { ...job.metadata, ...metadata }
  }

  // Calculate estimated time remaining
  if (job.startedAt && progress > 0) {
    const elapsed = Date.now() - job.startedAt.getTime()
    const estimatedTotal = (elapsed / progress) * 100
    const remaining = Math.max(0, estimatedTotal - elapsed)
    
    if (job.metadata) {
      job.metadata.estimatedTimeRemaining = Math.round(remaining / 1000) // seconds
    }
  }

  jobs.set(jobId, job)
  
  // Notify callback if registered
  const callback = jobCallbacks.get(jobId)
  if (callback) {
    callback(job)
  }
}

/**
 * Complete a job successfully
 */
export function completeJob(jobId: string, result: any): void {
  const job = jobs.get(jobId)
  if (!job) return

  job.status = 'completed'
  job.progress = 100
  job.result = result
  job.completedAt = new Date()

  // Release batch processing slot
  releaseBatchSlot(job.userId)

  jobs.set(jobId, job)
  
  // Notify callback
  const callback = jobCallbacks.get(jobId)
  if (callback) {
    callback(job)
  }

  // Clean up callback
  jobCallbacks.delete(jobId)
}

/**
 * Fail a job with error
 */
export function failJob(jobId: string, error: string): void {
  const job = jobs.get(jobId)
  if (!job) return

  job.status = 'failed'
  job.error = error
  job.completedAt = new Date()

  // Release batch processing slot
  releaseBatchSlot(job.userId)

  jobs.set(jobId, job)
  
  // Notify callback
  const callback = jobCallbacks.get(jobId)
  if (callback) {
    callback(job)
  }

  // Clean up callback
  jobCallbacks.delete(jobId)
}

/**
 * Cancel a job
 */
export function cancelJob(jobId: string): boolean {
  const job = jobs.get(jobId)
  if (!job || job.status === 'completed' || job.status === 'failed') {
    return false
  }

  job.status = 'cancelled'
  job.completedAt = new Date()

  // Release batch processing slot
  releaseBatchSlot(job.userId)

  jobs.set(jobId, job)
  
  // Notify callback
  const callback = jobCallbacks.get(jobId)
  if (callback) {
    callback(job)
  }

  // Clean up callback
  jobCallbacks.delete(jobId)
  
  return true
}

/**
 * Register a callback for job updates
 */
export function onJobUpdate(jobId: string, callback: (job: Job) => void): void {
  jobCallbacks.set(jobId, callback)
}

/**
 * Process a job based on its type
 */
async function processJob(jobId: string): Promise<void> {
  const job = jobs.get(jobId)
  if (!job || job.status !== 'pending') return

  // Mark job as running
  job.status = 'running'
  job.startedAt = new Date()
  jobs.set(jobId, job)

  try {
    switch (job.type) {
      case 'import_spreadsheet':
        await processSpreadsheetImport(jobId, job.data)
        break
      case 'validate_emails':
        await processEmailValidation(jobId, job.data)
        break
      case 'validate_addresses':
        await processAddressValidation(jobId, job.data)
        break
      case 'duplicate_detection':
        await processDuplicateDetection(jobId, job.data)
        break
      case 'export_records':
        await processRecordExport(jobId, job.data)
        break
      case 'bulk_update':
        await processBulkUpdate(jobId, job.data)
        break
      default:
        throw new Error(`Unknown job type: ${job.type}`)
    }
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error)
    failJob(jobId, error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Process spreadsheet import job
 */
async function processSpreadsheetImport(jobId: string, data: any): Promise<void> {
  const { transformedRecords, targetListId, userId, emailValidationResults, addressValidationResults, duplicateResults, completenessResults } = data
  
  updateJobProgress(jobId, 5, 'Starting import process...')
  
  const batchSize = 100
  const totalRecords = transformedRecords.length
  let processedRecords = 0
  let validRecords = 0
  let errorRecords = 0
  const errors: any[] = []

  // Import records in batches
  for (let i = 0; i < transformedRecords.length; i += batchSize) {
    const batch = transformedRecords.slice(i, i + batchSize)
    
    try {
      // Process each record in the batch
      const recordsToInsert = []
      
      for (let j = 0; j < batch.length; j++) {
        const recordIndex = i + j
        const record = batch[j]
        const addressKey = recordIndex.toString()
        
        // Get validation results
        const emailValidation = record.email ? emailValidationResults[record.email] : null
        const addressValidation = addressValidationResults[addressKey]
        const duplicateResult = duplicateResults[addressKey]
        const completenessResult = completenessResults[addressKey]
        
        // Skip duplicates with high confidence
        if (duplicateResult?.isDuplicate && duplicateResult.suggestedAction === 'skip') {
          errorRecords++
          errors.push({
            row: recordIndex + 2,
            errors: [`Duplicate record detected (${duplicateResult.confidence}% confidence)`]
          })
          continue
        }
        
        // Use standardized address if available
        const finalRecord = { ...record }
        if (addressValidation?.standardized) {
          finalRecord.address = addressValidation.standardized.address
          finalRecord.city = addressValidation.standardized.city
          finalRecord.state = addressValidation.standardized.state
          finalRecord.zipCode = addressValidation.standardized.zipCode
        }
        
        recordsToInsert.push({
          ...finalRecord,
          mailing_list_id: targetListId,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          additional_data: {
            email_validation: emailValidation ? {
              score: emailValidation.score,
              deliverable: emailValidation.deliverable,
              issues: emailValidation.issues,
              validated_at: new Date().toISOString()
            } : null,
            address_validation: addressValidation ? {
              score: addressValidation.score,
              deliverable: addressValidation.deliverable,
              issues: addressValidation.issues,
              standardized: addressValidation.standardized,
              validated_at: new Date().toISOString()
            } : null,
            duplicate_check: duplicateResult ? {
              confidence: duplicateResult.confidence,
              suggested_action: duplicateResult.suggestedAction,
              matched_records: duplicateResult.matchedRecords.length,
              checked_at: new Date().toISOString()
            } : null,
            completeness_score: completenessResult ? {
              overall: completenessResult.overall,
              grade: completenessResult.grade,
              usability: completenessResult.usabilityScore,
              breakdown: completenessResult.breakdown,
              issues: completenessResult.issues,
              scored_at: new Date().toISOString()
            } : null
          }
        })
        
        validRecords++
      }
      
      // Insert batch (would use Supabase in real implementation)
      // await supabase.from('mailing_list_records').insert(recordsToInsert)
      
      processedRecords += batch.length
      
      // Update progress
      const progress = Math.round((processedRecords / totalRecords) * 90) + 5 // 5-95%
      updateJobProgress(jobId, progress, `Processed ${processedRecords} of ${totalRecords} records`, {
        totalRecords,
        processedRecords,
        validRecords,
        errorRecords
      })
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 50))
      
    } catch (error) {
      console.error(`Batch import error for records ${i}-${i + batch.length}:`, error)
      errorRecords += batch.length
      errors.push({
        batch: `${i}-${i + batch.length}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  updateJobProgress(jobId, 95, 'Finalizing import...')
  
  // Complete the job
  completeJob(jobId, {
    success: true,
    imported: validRecords,
    errors: errorRecords,
    total: totalRecords,
    errorDetails: errors.length > 0 ? errors : undefined
  })
}

/**
 * Process email validation job
 */
async function processEmailValidation(jobId: string, data: any): Promise<void> {
  updateJobProgress(jobId, 10, 'Starting email validation...')
  
  // Simulate email validation processing
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  updateJobProgress(jobId, 50, 'Validating emails...')
  
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  updateJobProgress(jobId, 90, 'Finalizing validation...')
  
  await new Promise(resolve => setTimeout(resolve, 500))
  
  completeJob(jobId, { validated: data.emails?.length || 0 })
}

/**
 * Process address validation job
 */
async function processAddressValidation(jobId: string, data: any): Promise<void> {
  updateJobProgress(jobId, 10, 'Starting address validation...')
  
  // Simulate address validation processing
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  updateJobProgress(jobId, 60, 'Standardizing addresses...')
  
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  updateJobProgress(jobId, 95, 'Finalizing validation...')
  
  await new Promise(resolve => setTimeout(resolve, 300))
  
  completeJob(jobId, { validated: data.addresses?.length || 0 })
}

/**
 * Process duplicate detection job
 */
async function processDuplicateDetection(jobId: string, data: any): Promise<void> {
  updateJobProgress(jobId, 15, 'Analyzing records for duplicates...')
  
  // Simulate duplicate detection processing
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  updateJobProgress(jobId, 80, 'Generating duplicate report...')
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  completeJob(jobId, { 
    analyzed: data.records?.length || 0,
    duplicates: Math.floor((data.records?.length || 0) * 0.1) // 10% duplicates
  })
}

/**
 * Process record export job
 */
async function processRecordExport(jobId: string, data: any): Promise<void> {
  updateJobProgress(jobId, 20, 'Preparing export...')
  
  // Simulate export processing
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  updateJobProgress(jobId, 70, 'Generating file...')
  
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  updateJobProgress(jobId, 95, 'Finalizing export...')
  
  await new Promise(resolve => setTimeout(resolve, 500))
  
  completeJob(jobId, { 
    exported: data.recordCount || 0,
    fileUrl: '/exports/records-export.csv' // Would be real URL
  })
}

/**
 * Process bulk update job
 */
async function processBulkUpdate(jobId: string, data: any): Promise<void> {
  updateJobProgress(jobId, 10, 'Starting bulk update...')
  
  // Simulate bulk update processing
  await new Promise(resolve => setTimeout(resolve, 2500))
  
  updateJobProgress(jobId, 60, 'Updating records...')
  
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  updateJobProgress(jobId, 90, 'Finalizing updates...')
  
  await new Promise(resolve => setTimeout(resolve, 800))
  
  completeJob(jobId, { 
    updated: data.recordIds?.length || 0
  })
}

/**
 * Generate unique job ID
 */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Clean up old completed jobs (call periodically)
 */
export function cleanupOldJobs(maxAge: number = 24 * 60 * 60 * 1000): void {
  const cutoff = Date.now() - maxAge
  
  for (const [jobId, job] of jobs.entries()) {
    if (job.completedAt && job.completedAt.getTime() < cutoff) {
      jobs.delete(jobId)
      jobCallbacks.delete(jobId)
    }
  }
}
