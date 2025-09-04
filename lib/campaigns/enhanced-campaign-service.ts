import { createClient } from '@/utils/supabase/client'
import { Campaign, CampaignRecord } from '@/types/supabase'
import { recordChange, recordBatchChanges } from '@/lib/version-history/change-tracker'
import { v4 as uuidv4 } from 'uuid'

export interface CreateCampaignRequest {
  name: string
  description?: string
  contactCardId: string
  designId?: string
  mailingListIds: string[]
  recordIds?: string[]
  splitConfig?: SplitCampaignConfig
  recurringConfig?: RecurringCampaignConfig
  dependencies?: CampaignDependency[]
  scheduledDate?: string
  notes?: string
}

export interface SplitCampaignConfig {
  enabled: boolean
  splitCount: number
  splitSize?: number
  interval: 'days' | 'weeks' | 'months'
  intervalCount: number
  startDate: string
}

export interface RecurringCampaignConfig {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  interval: number
  endDate?: string
  maxOccurrences?: number
  allowDesignChanges: boolean
}

export interface CampaignDependency {
  dependsOnCampaignId: string
  dependencyType: 'completion' | 'delay' | 'response_rate'
  condition?: {
    delayDays?: number
    minimumResponseRate?: number
  }
}

export interface CampaignExecution {
  id: string
  campaignId: string
  executionNumber: number
  status: 'scheduled' | 'processing' | 'sent' | 'completed' | 'failed'
  scheduledDate: string
  executedDate?: string
  recordCount: number
  designId?: string
  notes?: string
}

/**
 * Enhanced service for managing campaigns with split, recurring, and dependency features
 */
export class EnhancedCampaignService {
  private supabase = createClient()

  /**
   * Creates a new campaign with advanced features
   */
  async createCampaign(request: CreateCampaignRequest): Promise<Campaign> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const batchId = uuidv4()

    try {
      // Validate dependencies
      if (request.dependencies && request.dependencies.length > 0) {
        await this.validateDependencies(request.dependencies)
      }

      // Create main campaign
      const campaignData = {
        id: uuidv4(),
        user_id: user.id,
        name: request.name,
        description: request.description,
        contact_card_id: request.contactCardId,
        design_id: request.designId,
        status: 'draft' as const,
        split_config: request.splitConfig,
        recurring_config: request.recurringConfig,
        dependencies: request.dependencies,
        scheduled_date: request.scheduledDate,
        notes: request.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: campaign, error: campaignError } = await this.supabase
        .from('campaigns')
        .insert(campaignData)
        .select()
        .single()

      if (campaignError) throw campaignError

      // Create campaign records
      const recordsToAdd = await this.getRecordsForCampaign(
        request.mailingListIds,
        request.recordIds
      )

      if (recordsToAdd.length > 0) {
        const campaignRecords = recordsToAdd.map(record => ({
          id: uuidv4(),
          campaign_id: campaign.id,
          mailing_list_record_id: record.id,
          user_id: user.id,
          status: 'pending' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        const { error: recordsError } = await this.supabase
          .from('campaign_records')
          .insert(campaignRecords)

        if (recordsError) throw recordsError

        // Update campaign record count
        await this.supabase
          .from('campaigns')
          .update({ 
            record_count: recordsToAdd.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', campaign.id)
      }

      // Create split executions if configured
      if (request.splitConfig?.enabled) {
        await this.createSplitExecutions(campaign.id, request.splitConfig, recordsToAdd.length)
      }

      // Schedule recurring executions if configured
      if (request.recurringConfig?.enabled) {
        await this.scheduleRecurringExecutions(campaign.id, request.recurringConfig)
      }

      // Record campaign creation
      await recordChange('campaign', campaign.id, 'create', {
        batchId,
        newValue: campaign,
        description: `Created campaign "${request.name}"`
      })

      return { ...campaign, record_count: recordsToAdd.length }

    } catch (error) {
      console.error('Campaign creation error:', error)
      throw error
    }
  }

  /**
   * Updates campaign configuration
   */
  async updateCampaign(
    campaignId: string,
    updates: Partial<CreateCampaignRequest>
  ): Promise<Campaign> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get current campaign
    const { data: currentCampaign } = await this.supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!currentCampaign) {
      throw new Error('Campaign not found')
    }

    // Validate dependencies if updated
    if (updates.dependencies) {
      await this.validateDependencies(updates.dependencies)
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data: campaign, error } = await this.supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    // Record changes
    for (const [field, newValue] of Object.entries(updates)) {
      if (currentCampaign[field] !== newValue) {
        await recordChange('campaign', campaignId, 'update', {
          fieldName: field,
          oldValue: currentCampaign[field],
          newValue,
          description: `Updated campaign ${field}`
        })
      }
    }

    return campaign
  }

  /**
   * Executes a campaign or campaign split
   */
  async executeCampaign(campaignId: string, executionId?: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get campaign details
    const { data: campaign } = await this.supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    // Check dependencies
    const canExecute = await this.checkDependencies(campaignId)
    if (!canExecute) {
      throw new Error('Campaign dependencies not met')
    }

    // Get execution details
    let execution: CampaignExecution
    if (executionId) {
      const { data: existingExecution } = await this.supabase
        .from('campaign_executions')
        .select('*')
        .eq('id', executionId)
        .single()

      if (!existingExecution) {
        throw new Error('Campaign execution not found')
      }
      execution = existingExecution
    } else {
      // Create new execution for immediate run
      execution = await this.createCampaignExecution(campaignId, 1, new Date().toISOString())
    }

    // Update execution status
    await this.supabase
      .from('campaign_executions')
      .update({
        status: 'processing',
        executed_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', execution.id)

    try {
      // Get records for this execution
      const records = await this.getExecutionRecords(campaignId, execution)

      // Process campaign (integrate with print/fulfillment vendors)
      await this.processCampaignRecords(campaignId, records, execution)

      // Update execution status to completed
      await this.supabase
        .from('campaign_executions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', execution.id)

      // Update campaign status if all executions complete
      await this.updateCampaignStatusIfComplete(campaignId)

      // Record execution
      await recordChange('campaign_execution', execution.id, 'update', {
        fieldName: 'status',
        newValue: 'completed',
        description: `Completed campaign execution ${execution.executionNumber}`
      })

    } catch (error) {
      // Update execution status to failed
      await this.supabase
        .from('campaign_executions')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', execution.id)

      throw error
    }
  }

  /**
   * Gets campaign execution history
   */
  async getCampaignExecutions(campaignId: string): Promise<CampaignExecution[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: executions, error } = await this.supabase
      .from('campaign_executions')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .order('execution_number', { ascending: true })

    if (error) throw error
    return executions || []
  }

  /**
   * Cancels a scheduled campaign execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('campaign_executions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId)
      .eq('user_id', user.id)
      .eq('status', 'scheduled')

    if (error) throw error

    await recordChange('campaign_execution', executionId, 'update', {
      fieldName: 'status',
      newValue: 'cancelled',
      description: 'Cancelled campaign execution'
    })
  }

  // Private helper methods

  private async validateDependencies(dependencies: CampaignDependency[]): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    for (const dep of dependencies) {
      const { data: campaign } = await this.supabase
        .from('campaigns')
        .select('id')
        .eq('id', dep.dependsOnCampaignId)
        .eq('user_id', user.id)
        .single()

      if (!campaign) {
        throw new Error(`Dependency campaign ${dep.dependsOnCampaignId} not found`)
      }
    }
  }

  private async getRecordsForCampaign(
    mailingListIds: string[],
    recordIds?: string[]
  ): Promise<any[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    if (recordIds && recordIds.length > 0) {
      // Get specific records
      const { data: records } = await this.supabase
        .from('mailing_list_records')
        .select('*')
        .in('id', recordIds)
        .eq('user_id', user.id)

      return records || []
    } else {
      // Get all records from specified mailing lists
      const { data: records } = await this.supabase
        .from('mailing_list_records')
        .select('*')
        .in('mailing_list_id', mailingListIds)
        .eq('user_id', user.id)

      return records || []
    }
  }

  private async createSplitExecutions(
    campaignId: string,
    splitConfig: SplitCampaignConfig,
    totalRecords: number
  ): Promise<void> {
    const recordsPerSplit = splitConfig.splitSize || Math.ceil(totalRecords / splitConfig.splitCount)
    let currentDate = new Date(splitConfig.startDate)

    for (let i = 1; i <= splitConfig.splitCount; i++) {
      await this.createCampaignExecution(
        campaignId,
        i,
        currentDate.toISOString(),
        Math.min(recordsPerSplit, totalRecords - (i - 1) * recordsPerSplit)
      )

      // Calculate next execution date
      if (i < splitConfig.splitCount) {
        if (splitConfig.interval === 'days') {
          currentDate.setDate(currentDate.getDate() + splitConfig.intervalCount)
        } else if (splitConfig.interval === 'weeks') {
          currentDate.setDate(currentDate.getDate() + (splitConfig.intervalCount * 7))
        } else if (splitConfig.interval === 'months') {
          currentDate.setMonth(currentDate.getMonth() + splitConfig.intervalCount)
        }
      }
    }
  }

  private async scheduleRecurringExecutions(
    campaignId: string,
    recurringConfig: RecurringCampaignConfig
  ): Promise<void> {
    // This would create scheduled executions based on recurring configuration
    // Implementation would depend on job scheduling system (e.g., cron jobs, queue system)
    console.log(`Scheduling recurring executions for campaign ${campaignId}`, recurringConfig)
  }

  private async createCampaignExecution(
    campaignId: string,
    executionNumber: number,
    scheduledDate: string,
    recordCount?: number
  ): Promise<CampaignExecution> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const executionData = {
      id: uuidv4(),
      campaign_id: campaignId,
      user_id: user.id,
      execution_number: executionNumber,
      status: 'scheduled' as const,
      scheduled_date: scheduledDate,
      record_count: recordCount || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: execution, error } = await this.supabase
      .from('campaign_executions')
      .insert(executionData)
      .select()
      .single()

    if (error) throw error
    return execution
  }

  private async checkDependencies(campaignId: string): Promise<boolean> {
    const { data: campaign } = await this.supabase
      .from('campaigns')
      .select('dependencies')
      .eq('id', campaignId)
      .single()

    if (!campaign?.dependencies || campaign.dependencies.length === 0) {
      return true
    }

    for (const dep of campaign.dependencies) {
      const dependencyMet = await this.checkSingleDependency(dep)
      if (!dependencyMet) {
        return false
      }
    }

    return true
  }

  private async checkSingleDependency(dependency: CampaignDependency): Promise<boolean> {
    const { data: dependentCampaign } = await this.supabase
      .from('campaigns')
      .select('status')
      .eq('id', dependency.dependsOnCampaignId)
      .single()

    if (!dependentCampaign) return false

    switch (dependency.dependencyType) {
      case 'completion':
        return dependentCampaign.status === 'completed'
      
      case 'delay':
        // Check if enough time has passed since dependent campaign completion
        // Implementation would check completion date + delay days
        return true // Placeholder
      
      case 'response_rate':
        // Check if dependent campaign achieved minimum response rate
        // Implementation would calculate actual response rate
        return true // Placeholder
      
      default:
        return false
    }
  }

  private async getExecutionRecords(
    campaignId: string,
    execution: CampaignExecution
  ): Promise<any[]> {
    // Get records for this specific execution
    // For split campaigns, this would return the subset of records for this execution
    const { data: campaignRecords } = await this.supabase
      .from('campaign_records')
      .select(`
        *,
        mailing_list_records (*)
      `)
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')
      .limit(execution.recordCount || 1000)

    return campaignRecords || []
  }

  private async processCampaignRecords(
    campaignId: string,
    records: any[],
    execution: CampaignExecution
  ): Promise<void> {
    // Process records through print/fulfillment vendors
    // This would integrate with vendor management system
    console.log(`Processing ${records.length} records for campaign ${campaignId}, execution ${execution.executionNumber}`)
    
    // Update campaign records status
    const recordIds = records.map(r => r.id)
    if (recordIds.length > 0) {
      await this.supabase
        .from('campaign_records')
        .update({
          status: 'sent',
          sent_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', recordIds)
    }
  }

  private async updateCampaignStatusIfComplete(campaignId: string): Promise<void> {
    // Check if all executions are complete
    const { data: executions } = await this.supabase
      .from('campaign_executions')
      .select('status')
      .eq('campaign_id', campaignId)

    if (executions && executions.every(e => ['completed', 'failed', 'cancelled'].includes(e.status))) {
      await this.supabase
        .from('campaigns')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)
    }
  }
}
