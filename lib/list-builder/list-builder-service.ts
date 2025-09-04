import { createClient } from '@/utils/supabase/client'
import { createMelissaDataClient, convertMelissaDataRecords } from '@/lib/api/melissa-data'
import { buildCriteria, validateCriteria, criteriaTomMelissaDataFormat } from './criteria-builder'
import { recordChange, recordBatchChanges } from '@/lib/version-history/change-tracker'
import { ListBuilderCriteria, MailingList, MailingListRecord } from '@/types/supabase'
import { v4 as uuidv4 } from 'uuid'

export interface ListBuilderRequest {
  name: string
  description?: string
  criteria: ListBuilderCriteria
  maxRecords?: number
  validateAddresses?: boolean
}

export interface ListBuilderResult {
  success: boolean
  mailingList?: MailingList
  recordCount: number
  estimatedCost?: number
  error?: string
}

/**
 * Service for building mailing lists from criteria using MelissaData
 */
export class ListBuilderService {
  private supabase = createClient()
  private melissaClient = createMelissaDataClient()

  /**
   * Estimates the cost and record count for a list build request
   */
  async estimateListBuild(criteria: ListBuilderCriteria): Promise<{
    estimatedCount: number
    estimatedCost: number
    isValid: boolean
    errors: string[]
  }> {
    const validation = validateCriteria(criteria)
    
    if (!validation.isValid) {
      return {
        estimatedCount: 0,
        estimatedCost: 0,
        isValid: false,
        errors: validation.errors
      }
    }

    try {
      const melissaParams = criteriaTomMelissaDataFormat(criteria)
      const estimatedCount = await this.melissaClient.estimateCount(melissaParams)
      
      // Cost calculation: $0.10 per record (example pricing)
      const estimatedCost = estimatedCount * 0.10

      return {
        estimatedCount,
        estimatedCost,
        isValid: true,
        errors: []
      }
    } catch (error) {
      return {
        estimatedCount: 0,
        estimatedCost: 0,
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Builds a mailing list from criteria
   */
  async buildList(request: ListBuilderRequest): Promise<ListBuilderResult> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        recordCount: 0,
        error: 'User not authenticated'
      }
    }

    // Validate criteria
    const validation = validateCriteria(request.criteria)
    if (!validation.isValid) {
      return {
        success: false,
        recordCount: 0,
        error: validation.errors.join(', ')
      }
    }

    const batchId = uuidv4()

    try {
      // Create mailing list record
      const mailingListData = {
        id: uuidv4(),
        user_id: user.id,
        name: request.name,
        description: request.description,
        source: 'list_builder' as const,
        source_criteria: request.criteria,
        record_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: mailingList, error: listError } = await this.supabase
        .from('mailing_lists')
        .insert(mailingListData)
        .select()
        .single()

      if (listError) throw listError

      // Record the list creation
      await recordChange('mailing_list', mailingList.id, 'create', {
        batchId,
        newValue: mailingList,
        description: `Created list "${request.name}" from list builder`
      })

      // Build records using MelissaData
      const melissaParams = criteriaTomMelissaDataFormat(request.criteria)
      const melissaResponse = await this.melissaClient.buildList({
        criteria: melissaParams,
        maxRecords: request.maxRecords,
        format: 'json'
      })

      if (!melissaResponse.success) {
        throw new Error(melissaResponse.error || 'Failed to build list from MelissaData')
      }

      let records = convertMelissaDataRecords(melissaResponse.records)

      // Validate addresses if requested
      if (request.validateAddresses && records.length > 0) {
        const validatedRecords = await this.melissaClient.validateAddresses(melissaResponse.records)
        records = convertMelissaDataRecords(validatedRecords)
      }

      // Insert records into database
      if (records.length > 0) {
        const recordsData = records.map(record => ({
          id: uuidv4(),
          mailing_list_id: mailingList.id,
          user_id: user.id,
          ...record,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        const { error: recordsError } = await this.supabase
          .from('mailing_list_records')
          .insert(recordsData)

        if (recordsError) throw recordsError

        // Update mailing list record count
        const { error: updateError } = await this.supabase
          .from('mailing_lists')
          .update({ 
            record_count: records.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', mailingList.id)

        if (updateError) throw updateError

        // Record batch changes for all records
        const recordChanges = recordsData.map(record => ({
          resourceType: 'mailing_list_record' as const,
          resourceId: record.id,
          changeType: 'create' as const,
          newValue: record,
          description: `Created record for ${record.first_name} ${record.last_name}`
        }))

        await recordBatchChanges(recordChanges, batchId)
      }

      // Track usage
      await this.trackListBuilderUsage(user.id, mailingList.id, records.length, request.criteria)

      return {
        success: true,
        mailingList: {
          ...mailingList,
          record_count: records.length
        },
        recordCount: records.length,
        estimatedCost: records.length * 0.10
      }

    } catch (error) {
      console.error('List builder error:', error)
      return {
        success: false,
        recordCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Tracks list builder usage for analytics
   */
  private async trackListBuilderUsage(
    userId: string,
    mailingListId: string,
    recordCount: number,
    criteria: ListBuilderCriteria
  ): Promise<void> {
    try {
      const usageData = {
        user_id: userId,
        resource_type: 'mailing_list',
        resource_id: mailingListId,
        action: 'list_builder_create',
        metadata: {
          record_count: recordCount,
          criteria_summary: {
            has_demographic: Object.values(criteria.demographic).some(v => v !== null),
            has_geographic: Object.values(criteria.geographic).some(v => v !== null),
            has_property: Object.values(criteria.property).some(v => v !== null),
            geographic_scope: criteria.geographic.states?.length || 0,
            filter_count: [
              ...Object.values(criteria.demographic),
              ...Object.values(criteria.geographic),
              ...Object.values(criteria.property)
            ].filter(v => v !== null && v !== undefined).length
          }
        },
        created_at: new Date().toISOString()
      }

      await this.supabase
        .from('mailing_list_usage')
        .insert(usageData)

    } catch (error) {
      console.error('Failed to track list builder usage:', error)
      // Don't throw - usage tracking failure shouldn't break list building
    }
  }

  /**
   * Gets list builder usage statistics for a user
   */
  async getUsageStats(userId?: string): Promise<{
    totalListsBuilt: number
    totalRecordsGenerated: number
    totalCost: number
    averageListSize: number
  }> {
    const { data: { user } } = await this.supabase.auth.getUser()
    const targetUserId = userId || user?.id

    if (!targetUserId) {
      return {
        totalListsBuilt: 0,
        totalRecordsGenerated: 0,
        totalCost: 0,
        averageListSize: 0
      }
    }

    try {
      const { data: usage } = await this.supabase
        .from('mailing_list_usage')
        .select('metadata')
        .eq('user_id', targetUserId)
        .eq('action', 'list_builder_create')

      if (!usage || usage.length === 0) {
        return {
          totalListsBuilt: 0,
          totalRecordsGenerated: 0,
          totalCost: 0,
          averageListSize: 0
        }
      }

      const totalRecords = usage.reduce((sum, item) => 
        sum + (item.metadata?.record_count || 0), 0
      )

      return {
        totalListsBuilt: usage.length,
        totalRecordsGenerated: totalRecords,
        totalCost: totalRecords * 0.10,
        averageListSize: Math.round(totalRecords / usage.length)
      }

    } catch (error) {
      console.error('Failed to get usage stats:', error)
      return {
        totalListsBuilt: 0,
        totalRecordsGenerated: 0,
        totalCost: 0,
        averageListSize: 0
      }
    }
  }
}
