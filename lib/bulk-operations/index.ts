import { createSupabaseServerClient } from '@/lib/supabase/server'
import { MailingListRecord } from '@/types/supabase'

// =================================================================================
// Bulk Operation Types
// =================================================================================

export type BulkOperationType = 
  | 'tag_assign' 
  | 'tag_remove' 
  | 'delete_records' 
  | 'update_fields' 
  | 'export_records'
  | 'deduplicate'
  | 'validate_addresses'
  | 'enrich_data'

export type BulkOperationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface BulkOperation {
  id: string
  user_id: string
  type: BulkOperationType
  target_count: number
  processed_count: number
  success_count: number
  error_count: number
  status: BulkOperationStatus
  progress_percentage: number
  started_at?: string
  completed_at?: string
  error_message?: string
  metadata: Record<string, any>
  created_at: string
}

export interface BulkOperationResult {
  operation_id: string
  success: boolean
  processed_count: number
  success_count: number
  error_count: number
  errors?: Array<{
    record_id: string
    error: string
  }>
  metadata?: Record<string, any>
}

// =================================================================================
// Batch Processing Configuration
// =================================================================================

export const BATCH_SIZES = {
  tag_assign: 1000,
  tag_remove: 1000,
  delete_records: 500,
  update_fields: 500,
  export_records: 2000,
  deduplicate: 100,
  validate_addresses: 200,
  enrich_data: 100
}

export const RATE_LIMITS = {
  operations_per_minute: 10,
  records_per_minute: 10000,
  concurrent_operations: 3
}

// =================================================================================
// Core Bulk Operations Service
// =================================================================================

export class BulkOperationsService {
  private async getSupabase() {
    return await createSupabaseServerClient()
  }

  /**
   * Create a bulk operation job
   */
  async createBulkOperation(
    userId: string,
    type: BulkOperationType,
    recordIds: string[],
    metadata: Record<string, any> = {}
  ): Promise<BulkOperation> {
    const operation = {
      user_id: userId,
      type,
      target_count: recordIds.length,
      processed_count: 0,
      success_count: 0,
      error_count: 0,
      status: 'pending' as BulkOperationStatus,
      progress_percentage: 0,
      metadata: {
        ...metadata,
        record_ids: recordIds
      }
    }

    const { data, error } = await (await this.getSupabase())
      .from('bulk_operations')
      .insert([operation])
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get bulk operations for a user
   */
  async getUserBulkOperations(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<BulkOperation[]> {
    const { data, error } = await (await this.getSupabase())
      .from('bulk_operations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  }

  /**
   * Update operation progress
   */
  async updateOperationProgress(
    operationId: string,
    processed: number,
    success: number,
    errors: number,
    status?: BulkOperationStatus
  ): Promise<void> {
    const operation = await this.getOperation(operationId)
    if (!operation) throw new Error('Operation not found')

    const progress = Math.round((processed / operation.target_count) * 100)

    const updates: any = {
      processed_count: processed,
      success_count: success,
      error_count: errors,
      progress_percentage: progress
    }

    if (status) {
      updates.status = status
      if (status === 'processing' && !operation.started_at) {
        updates.started_at = new Date().toISOString()
      }
      if (['completed', 'failed', 'cancelled'].includes(status)) {
        updates.completed_at = new Date().toISOString()
      }
    }

    const { error } = await (await this.getSupabase())
      .from('bulk_operations')
      .update(updates)
      .eq('id', operationId)

    if (error) throw error
  }

  /**
   * Get operation by ID
   */
  async getOperation(operationId: string): Promise<BulkOperation | null> {
    const { data, error } = await (await this.getSupabase())
      .from('bulk_operations')
      .select('*')
      .eq('id', operationId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  /**
   * Cancel an operation
   */
  async cancelOperation(operationId: string, userId: string): Promise<void> {
    const { error } = await (await this.getSupabase())
      .from('bulk_operations')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', operationId)
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (error) throw error
  }

  // =================================================================================
  // Specific Bulk Operations
  // =================================================================================

  /**
   * Bulk assign tags to records
   */
  async bulkAssignTags(
    userId: string,
    recordIds: string[],
    tagIds: string[]
  ): Promise<BulkOperationResult> {
    const operation = await this.createBulkOperation(
      userId,
      'tag_assign',
      recordIds,
      { tag_ids: tagIds }
    )

    try {
      await this.updateOperationProgress(operation.id, 0, 0, 0, 'processing')

      const batchSize = BATCH_SIZES.tag_assign
      let processed = 0
      let success = 0
      let errors = 0
      const errorDetails: Array<{ record_id: string; error: string }> = []

      // Process in batches
      for (let i = 0; i < recordIds.length; i += batchSize) {
        const batch = recordIds.slice(i, i + batchSize)
        
        try {
          // Create tag assignments for this batch
          const assignments = batch.flatMap(recordId =>
            tagIds.map(tagId => ({
              record_id: recordId,
              tag_id: tagId,
              assigned_by: userId
            }))
          )

          const { error: insertError } = await (await this.getSupabase())
            .from('record_tags')
            .insert(assignments)

          if (insertError) {
            errors += batch.length
            batch.forEach(recordId => {
              errorDetails.push({
                record_id: recordId,
                error: insertError.message
              })
            })
          } else {
            success += batch.length
          }
        } catch (batchError) {
          errors += batch.length
          batch.forEach(recordId => {
            errorDetails.push({
              record_id: recordId,
              error: batchError instanceof Error ? batchError.message : 'Unknown error'
            })
          })
        }

        processed += batch.length
        await this.updateOperationProgress(operation.id, processed, success, errors)
      }

      await this.updateOperationProgress(
        operation.id,
        processed,
        success,
        errors,
        errors === 0 ? 'completed' : (success > 0 ? 'completed' : 'failed')
      )

      return {
        operation_id: operation.id,
        success: success > 0,
        processed_count: processed,
        success_count: success,
        error_count: errors,
        errors: errorDetails.length > 0 ? errorDetails : undefined
      }
    } catch (error) {
      await this.updateOperationProgress(operation.id, 0, 0, recordIds.length, 'failed')
      throw error
    }
  }

  /**
   * Bulk remove tags from records
   */
  async bulkRemoveTags(
    userId: string,
    recordIds: string[],
    tagIds: string[]
  ): Promise<BulkOperationResult> {
    const operation = await this.createBulkOperation(
      userId,
      'tag_remove',
      recordIds,
      { tag_ids: tagIds }
    )

    try {
      await this.updateOperationProgress(operation.id, 0, 0, 0, 'processing')

      const { error } = await (await this.getSupabase())
        .from('record_tags')
        .delete()
        .in('record_id', recordIds)
        .in('tag_id', tagIds)

      if (error) {
        await this.updateOperationProgress(operation.id, recordIds.length, 0, recordIds.length, 'failed')
        throw error
      }

      await this.updateOperationProgress(operation.id, recordIds.length, recordIds.length, 0, 'completed')

      return {
        operation_id: operation.id,
        success: true,
        processed_count: recordIds.length,
        success_count: recordIds.length,
        error_count: 0
      }
    } catch (error) {
      await this.updateOperationProgress(operation.id, 0, 0, recordIds.length, 'failed')
      throw error
    }
  }

  /**
   * Bulk delete records
   */
  async bulkDeleteRecords(
    userId: string,
    recordIds: string[]
  ): Promise<BulkOperationResult> {
    const operation = await this.createBulkOperation(
      userId,
      'delete_records',
      recordIds
    )

    try {
      await this.updateOperationProgress(operation.id, 0, 0, 0, 'processing')

      // Verify user owns all records
      const { data: ownedRecords } = await (await this.getSupabase())
        .from('mailing_list_records')
        .select('id')
        .in('id', recordIds)
        .eq('user_id', userId)

      const ownedIds = ownedRecords?.map(r => r.id) || []
      const unauthorizedIds = recordIds.filter(id => !ownedIds.includes(id))

      if (unauthorizedIds.length > 0) {
        await this.updateOperationProgress(operation.id, recordIds.length, 0, recordIds.length, 'failed')
        throw new Error(`Unauthorized to delete ${unauthorizedIds.length} records`)
      }

      const batchSize = BATCH_SIZES.delete_records
      let processed = 0
      let success = 0
      let errors = 0

      // Process in batches
      for (let i = 0; i < recordIds.length; i += batchSize) {
        const batch = recordIds.slice(i, i + batchSize)
        
        const { error: deleteError } = await (await this.getSupabase())
          .from('mailing_list_records')
          .delete()
          .in('id', batch)

        if (deleteError) {
          errors += batch.length
        } else {
          success += batch.length
        }

        processed += batch.length
        await this.updateOperationProgress(operation.id, processed, success, errors)
      }

      await this.updateOperationProgress(
        operation.id,
        processed,
        success,
        errors,
        errors === 0 ? 'completed' : 'failed'
      )

      return {
        operation_id: operation.id,
        success: success > 0,
        processed_count: processed,
        success_count: success,
        error_count: errors
      }
    } catch (error) {
      await this.updateOperationProgress(operation.id, 0, 0, recordIds.length, 'failed')
      throw error
    }
  }

  /**
   * Bulk update record fields
   */
  async bulkUpdateRecords(
    userId: string,
    recordIds: string[],
    updates: Partial<MailingListRecord>
  ): Promise<BulkOperationResult> {
    const operation = await this.createBulkOperation(
      userId,
      'update_fields',
      recordIds,
      { updates }
    )

    try {
      await this.updateOperationProgress(operation.id, 0, 0, 0, 'processing')

      // Add updated_at timestamp
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { error } = await (await this.getSupabase())
        .from('mailing_list_records')
        .update(updateData)
        .in('id', recordIds)
        .eq('user_id', userId)

      if (error) {
        await this.updateOperationProgress(operation.id, recordIds.length, 0, recordIds.length, 'failed')
        throw error
      }

      await this.updateOperationProgress(operation.id, recordIds.length, recordIds.length, 0, 'completed')

      return {
        operation_id: operation.id,
        success: true,
        processed_count: recordIds.length,
        success_count: recordIds.length,
        error_count: 0
      }
    } catch (error) {
      await this.updateOperationProgress(operation.id, 0, 0, recordIds.length, 'failed')
      throw error
    }
  }
}

// =================================================================================
// Rate Limiting and Queue Management
// =================================================================================

export class BulkOperationQueue {
  private static instance: BulkOperationQueue
  private operations = new Map<string, BulkOperation>()
  private userLimits = new Map<string, { operations: number; records: number; timestamp: number }>()

  static getInstance(): BulkOperationQueue {
    if (!BulkOperationQueue.instance) {
      BulkOperationQueue.instance = new BulkOperationQueue()
    }
    return BulkOperationQueue.instance
  }

  /**
   * Check if user can perform bulk operation
   */
  canPerformOperation(userId: string, recordCount: number): { allowed: boolean; reason?: string } {
    const now = Date.now()
    const userLimit = this.userLimits.get(userId)

    if (!userLimit || now - userLimit.timestamp > 60000) {
      // Reset limits every minute
      this.userLimits.set(userId, { operations: 0, records: 0, timestamp: now })
      return { allowed: true }
    }

    if (userLimit.operations >= RATE_LIMITS.operations_per_minute) {
      return { allowed: false, reason: `Operation limit exceeded: ${RATE_LIMITS.operations_per_minute}/minute` }
    }

    if (userLimit.records + recordCount > RATE_LIMITS.records_per_minute) {
      return { allowed: false, reason: `Record limit exceeded: ${RATE_LIMITS.records_per_minute}/minute` }
    }

    const activeOperations = Array.from(this.operations.values())
      .filter(op => op.user_id === userId && op.status === 'processing').length

    if (activeOperations >= RATE_LIMITS.concurrent_operations) {
      return { allowed: false, reason: `Too many concurrent operations: ${RATE_LIMITS.concurrent_operations} max` }
    }

    return { allowed: true }
  }

  /**
   * Track operation usage
   */
  trackOperation(userId: string, recordCount: number): void {
    const now = Date.now()
    const userLimit = this.userLimits.get(userId) || { operations: 0, records: 0, timestamp: now }
    
    this.userLimits.set(userId, {
      operations: userLimit.operations + 1,
      records: userLimit.records + recordCount,
      timestamp: userLimit.timestamp
    })
  }
}

// Export singleton instance
export const bulkOperationsService = new BulkOperationsService()
export const bulkOperationQueue = BulkOperationQueue.getInstance()