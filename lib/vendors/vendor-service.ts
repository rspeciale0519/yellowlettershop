import { createClient } from '@/utils/supabase/client'
import { Vendor, VendorPerformance } from '@/types/supabase'
import { recordChange } from '@/lib/version-history/change-tracker'
import { v4 as uuidv4 } from 'uuid'

export interface CreateVendorRequest {
  name: string
  type: 'print' | 'skip_trace' | 'data' | 'fulfillment' | 'other'
  contact_info: {
    email?: string
    phone?: string
    address?: string
    website?: string
    contact_person?: string
  }
  services: string[]
  pricing_model?: 'per_piece' | 'flat_rate' | 'percentage' | 'custom'
  base_pricing?: Record<string, number>
  capabilities?: string[]
  notes?: string
}

export interface UpdateVendorRequest extends Partial<CreateVendorRequest> {
  status?: 'active' | 'inactive' | 'suspended'
}

export interface VendorPerformanceData {
  totalOrders: number
  completedOrders: number
  averageCompletionTime: number
  qualityScore: number
  costEfficiency: number
  onTimeDeliveryRate: number
  recentPerformance: Array<{
    date: string
    ordersCompleted: number
    averageQuality: number
    onTimeRate: number
  }>
}

export interface CommunicationRecord {
  id: string
  vendorId: string
  type: 'email' | 'phone' | 'meeting' | 'note'
  subject: string
  content: string
  direction: 'inbound' | 'outbound'
  createdAt: string
  createdBy: string
}

/**
 * Service for managing vendors and tracking their performance
 */
export class VendorService {
  private supabase = createClient()

  /**
   * Creates a new vendor
   */
  async createVendor(request: CreateVendorRequest): Promise<Vendor> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const vendorData = {
      id: uuidv4(),
      user_id: user.id,
      name: request.name,
      type: request.type,
      contact_info: request.contact_info,
      services: request.services,
      pricing_model: request.pricing_model,
      base_pricing: request.base_pricing,
      capabilities: request.capabilities,
      status: 'active' as const,
      notes: request.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: vendor, error } = await this.supabase
      .from('vendors')
      .insert(vendorData)
      .select()
      .single()

    if (error) throw error

    // Record vendor creation
    await recordChange('vendor', vendor.id, 'create', {
      newValue: vendor,
      description: `Created vendor "${request.name}"`
    })

    return vendor
  }

  /**
   * Updates an existing vendor
   */
  async updateVendor(vendorId: string, request: UpdateVendorRequest): Promise<Vendor> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get current vendor for change tracking
    const { data: currentVendor } = await this.supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .eq('user_id', user.id)
      .single()

    if (!currentVendor) {
      throw new Error('Vendor not found')
    }

    const updateData = {
      ...request,
      updated_at: new Date().toISOString()
    }

    const { data: vendor, error } = await this.supabase
      .from('vendors')
      .update(updateData)
      .eq('id', vendorId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    // Record changes for each updated field
    for (const [field, newValue] of Object.entries(request)) {
      if (field !== 'updated_at' && currentVendor[field] !== newValue) {
        await recordChange('vendor', vendorId, 'update', {
          fieldName: field,
          oldValue: currentVendor[field],
          newValue,
          description: `Updated vendor ${field}`
        })
      }
    }

    return vendor
  }

  /**
   * Gets all vendors for the user
   */
  async getVendors(filters?: {
    type?: string
    status?: string
    services?: string[]
  }): Promise<Vendor[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = this.supabase
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.services && filters.services.length > 0) {
      query = query.overlaps('services', filters.services)
    }

    const { data: vendors, error } = await query

    if (error) throw error
    return vendors || []
  }

  /**
   * Gets a single vendor by ID
   */
  async getVendor(vendorId: string): Promise<Vendor | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: vendor, error } = await this.supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .eq('user_id', user.id)
      .single()

    if (error) return null
    return vendor
  }

  /**
   * Deletes a vendor
   */
  async deleteVendor(vendorId: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get vendor for change tracking
    const { data: vendor } = await this.supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    const { error } = await this.supabase
      .from('vendors')
      .delete()
      .eq('id', vendorId)
      .eq('user_id', user.id)

    if (error) throw error

    // Record deletion
    await recordChange('vendor', vendorId, 'delete', {
      oldValue: vendor,
      description: `Deleted vendor "${vendor.name}"`
    })
  }

  /**
   * Records a performance metric for a vendor
   */
  async recordPerformanceMetric(
    vendorId: string,
    metricType: string,
    value: number,
    orderId?: string,
    notes?: string
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const metricData = {
      id: uuidv4(),
      vendor_id: vendorId,
      user_id: user.id,
      order_id: orderId,
      metric_type: metricType,
      value,
      notes,
      recorded_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }

    const { error } = await this.supabase
      .from('vendor_performance_metrics')
      .insert(metricData)

    if (error) throw error
  }

  /**
   * Gets performance data for a vendor
   */
  async getVendorPerformance(vendorId: string): Promise<VendorPerformanceData> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get all performance metrics for the vendor
    const { data: metrics } = await this.supabase
      .from('vendor_performance_metrics')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })

    if (!metrics || metrics.length === 0) {
      return {
        totalOrders: 0,
        completedOrders: 0,
        averageCompletionTime: 0,
        qualityScore: 0,
        costEfficiency: 0,
        onTimeDeliveryRate: 0,
        recentPerformance: []
      }
    }

    // Calculate performance metrics
    const completionTimeMetrics = metrics.filter(m => m.metric_type === 'completion_time')
    const qualityMetrics = metrics.filter(m => m.metric_type === 'quality_score')
    const onTimeMetrics = metrics.filter(m => m.metric_type === 'on_time_delivery')
    const costMetrics = metrics.filter(m => m.metric_type === 'cost_efficiency')

    const averageCompletionTime = completionTimeMetrics.length > 0
      ? completionTimeMetrics.reduce((sum, m) => sum + m.value, 0) / completionTimeMetrics.length
      : 0

    const qualityScore = qualityMetrics.length > 0
      ? qualityMetrics.reduce((sum, m) => sum + m.value, 0) / qualityMetrics.length
      : 0

    const onTimeDeliveryRate = onTimeMetrics.length > 0
      ? (onTimeMetrics.filter(m => m.value === 1).length / onTimeMetrics.length) * 100
      : 0

    const costEfficiency = costMetrics.length > 0
      ? costMetrics.reduce((sum, m) => sum + m.value, 0) / costMetrics.length
      : 0

    // Get recent performance (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const recentMetrics = metrics.filter(m => m.recorded_at >= thirtyDaysAgo)

    // Group by date for time series
    const dailyMetrics: Record<string, {
      ordersCompleted: number
      qualitySum: number
      qualityCount: number
      onTimeCount: number
      totalOrders: number
    }> = {}

    recentMetrics.forEach(metric => {
      const date = metric.recorded_at.split('T')[0]
      if (!dailyMetrics[date]) {
        dailyMetrics[date] = {
          ordersCompleted: 0,
          qualitySum: 0,
          qualityCount: 0,
          onTimeCount: 0,
          totalOrders: 0
        }
      }

      if (metric.metric_type === 'completion_time') {
        dailyMetrics[date].ordersCompleted++
      } else if (metric.metric_type === 'quality_score') {
        dailyMetrics[date].qualitySum += metric.value
        dailyMetrics[date].qualityCount++
      } else if (metric.metric_type === 'on_time_delivery') {
        dailyMetrics[date].totalOrders++
        if (metric.value === 1) {
          dailyMetrics[date].onTimeCount++
        }
      }
    })

    const recentPerformance = Object.entries(dailyMetrics)
      .map(([date, data]) => ({
        date,
        ordersCompleted: data.ordersCompleted,
        averageQuality: data.qualityCount > 0 ? data.qualitySum / data.qualityCount : 0,
        onTimeRate: data.totalOrders > 0 ? (data.onTimeCount / data.totalOrders) * 100 : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalOrders: new Set(metrics.map(m => m.order_id).filter(Boolean)).size,
      completedOrders: completionTimeMetrics.length,
      averageCompletionTime,
      qualityScore,
      costEfficiency,
      onTimeDeliveryRate,
      recentPerformance
    }
  }

  /**
   * Records a communication with a vendor
   */
  async recordCommunication(
    vendorId: string,
    type: 'email' | 'phone' | 'meeting' | 'note',
    subject: string,
    content: string,
    direction: 'inbound' | 'outbound' = 'outbound'
  ): Promise<CommunicationRecord> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const communicationData = {
      id: uuidv4(),
      vendor_id: vendorId,
      user_id: user.id,
      type,
      subject,
      content,
      direction,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: communication, error } = await this.supabase
      .from('vendor_communications')
      .insert(communicationData)
      .select()
      .single()

    if (error) throw error

    return {
      id: communication.id,
      vendorId: communication.vendor_id,
      type: communication.type,
      subject: communication.subject,
      content: communication.content,
      direction: communication.direction,
      createdAt: communication.created_at,
      createdBy: communication.user_id
    }
  }

  /**
   * Gets communication history for a vendor
   */
  async getCommunicationHistory(vendorId: string): Promise<CommunicationRecord[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: communications, error } = await this.supabase
      .from('vendor_communications')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (communications || []).map(comm => ({
      id: comm.id,
      vendorId: comm.vendor_id,
      type: comm.type,
      subject: comm.subject,
      content: comm.content,
      direction: comm.direction,
      createdAt: comm.created_at,
      createdBy: comm.user_id
    }))
  }

  /**
   * Gets vendor performance comparison
   */
  async getVendorComparison(vendorIds: string[]): Promise<Array<{
    vendorId: string
    vendorName: string
    performance: VendorPerformanceData
  }>> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const results = []

    for (const vendorId of vendorIds) {
      const vendor = await this.getVendor(vendorId)
      if (vendor) {
        const performance = await this.getVendorPerformance(vendorId)
        results.push({
          vendorId,
          vendorName: vendor.name,
          performance
        })
      }
    }

    return results
  }
}
