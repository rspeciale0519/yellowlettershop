import { createClient } from '@/utils/supabase/client'
import type { Campaign, CampaignRecord, Order } from '@/types/supabase'

// =================================================================================
// Campaign Management Functions
// =================================================================================

export async function getCampaigns(): Promise<Campaign[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      contact_card:contact_cards(*),
      order:orders(*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getCampaign(id: string): Promise<Campaign> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      contact_card:contact_cards(*),
      records:campaign_records(*),
      order:orders(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createCampaign(campaignData: {
  name: string
  contact_card_id: string
  design_id?: string
  campaign_type?: 'single' | 'split' | 'recurring'
  split_config?: Record<string, any>
  repeat_config?: Record<string, any>
  fulfillment_type?: 'full_service' | 'ship_to_user' | 'print_only'
  postage_type?: 'first_class_forever' | 'first_class_discounted' | 'standard_class'
  scheduled_start_date?: string
}): Promise<Campaign> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      ...campaignData,
      status: 'draft',
      total_records: 0,
      created_by: user.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('campaigns')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCampaign(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) throw error
}

// =================================================================================
// Campaign Records Management
// =================================================================================

export async function addRecordsToCampaign(
  campaignId: string,
  recordIds: string[],
  mailingListId: string,
  dropNumber?: number,
  scheduledDate?: string
): Promise<CampaignRecord[]> {
  const supabase = createClient()

  const campaignRecords = recordIds.map(recordId => ({
    campaign_id: campaignId,
    record_id: recordId,
    mailing_list_id: mailingListId,
    drop_number: dropNumber,
    scheduled_date: scheduledDate,
    delivery_status: 'pending' as const
  }))

  const { data, error } = await supabase
    .from('campaign_records')
    .insert(campaignRecords)
    .select()

  if (error) throw error

  // Update campaign total_records count
  await updateCampaignRecordCount(campaignId)

  return data || []
}

export async function getCampaignRecords(
  campaignId: string,
  filters?: {
    drop_number?: number
    delivery_status?: 'pending' | 'printed' | 'shipped' | 'delivered' | 'returned'
    limit?: number
    offset?: number
  }
): Promise<{ data: CampaignRecord[]; count: number }> {
  const supabase = createClient()
  let query = supabase
    .from('campaign_records')
    .select('*', { count: 'exact' })
    .eq('campaign_id', campaignId)

  if (filters?.drop_number) {
    query = query.eq('drop_number', filters.drop_number)
  }

  if (filters?.delivery_status) {
    query = query.eq('delivery_status', filters.delivery_status)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 100) - 1)

  if (error) throw error
  return { data: data || [], count: count || 0 }
}

export async function updateCampaignRecordStatus(
  id: string,
  deliveryStatus: 'pending' | 'printed' | 'shipped' | 'delivered' | 'returned',
  deliveredAt?: string
): Promise<CampaignRecord> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('campaign_records')
    .update({
      delivery_status: deliveryStatus,
      delivered_at: deliveredAt
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// =================================================================================
// Order Management
// =================================================================================

export async function createOrder(orderData: {
  campaign_id: string
  stripe_payment_intent_id?: string
  amount_authorized?: number
}): Promise<Order> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...orderData,
      user_id: user.id,
      payment_status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded',
  amountCaptured?: number
): Promise<Order> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('orders')
    .update({
      payment_status: paymentStatus,
      amount_captured: amountCaptured,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw error
  return data
}

// =================================================================================
// Helper Functions
// =================================================================================

async function updateCampaignRecordCount(campaignId: string): Promise<void> {
  const supabase = createClient()
  
  // Count records in this campaign
  const { count, error: countError } = await supabase
    .from('campaign_records')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)

  if (countError) throw countError

  // Update campaign total_records
  const { error: updateError } = await supabase
    .from('campaigns')
    .update({ total_records: count || 0 })
    .eq('id', campaignId)

  if (updateError) throw updateError
}
