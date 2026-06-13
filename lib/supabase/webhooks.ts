import { createClient } from '@/utils/supabase/client'
import type { Webhook, WebhookDelivery } from '@/types/supabase'
import { backoffDelayMs, shouldRetry } from '@/lib/webhooks/retry'

// Inline retry attempts are capped low so we don't hold the triggering
// request open; exhausted deliveries land in webhook_dead_letters for replay.
const MAX_INLINE_ATTEMPTS = 3
const INLINE_BASE_MS = 400
const INLINE_CEIL_MS = 4000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// =================================================================================
// Webhook Management Functions
// =================================================================================

export async function getWebhooks(): Promise<Webhook[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createWebhook(webhookData: {
  url: string
  events: string[]
  secret?: string
}): Promise<Webhook> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('webhooks')
    .insert({
      ...webhookData,
      user_id: user.id,
      is_active: true,
      retry_count: 0
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateWebhook(id: string, updates: Partial<Webhook>): Promise<Webhook> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('webhooks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteWebhook(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('webhooks')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}

// =================================================================================
// Webhook Delivery Functions
// =================================================================================

export async function getWebhookDeliveries(
  webhookId: string,
  limit: number = 50
): Promise<WebhookDelivery[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('webhook_deliveries')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function recordWebhookDelivery(deliveryData: {
  webhook_id: string
  event_type: string
  payload: Record<string, any>
  response_status?: number
  response_body?: string
  delivery_attempts?: number
}): Promise<WebhookDelivery> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('webhook_deliveries')
    .insert({
      ...deliveryData,
      delivery_attempts: deliveryData.delivery_attempts || 1,
      delivered_at: deliveryData.response_status && deliveryData.response_status < 400 
        ? new Date().toISOString() 
        : undefined
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// =================================================================================
// Event Triggering Functions
// =================================================================================

export async function triggerWebhookEvent(
  eventType: string,
  eventData: Record<string, any>,
  userId?: string
): Promise<void> {
  const supabase = createClient()
  
  // Get active webhooks that listen for this event type
  const { data: webhooks, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('is_active', true)
    .contains('events', [eventType])

  if (error) {
    console.error('Error fetching webhooks:', error)
    return
  }

  if (!webhooks || webhooks.length === 0) {
    console.log(`No active webhooks found for event: ${eventType}`)
    return
  }

  // Send webhook to each registered endpoint, with bounded retry + dead-letter.
  for (const webhook of webhooks) {
    let attempt = 0
    let lastStatus = 0
    let lastBody = ''

    while (attempt < MAX_INLINE_ATTEMPTS) {
      attempt++
      const result = await sendWebhook(webhook, eventType, eventData, attempt)
      lastStatus = result.status
      lastBody = result.body

      if (result.status >= 200 && result.status < 300) break
      if (!shouldRetry(result.status, attempt) || attempt >= MAX_INLINE_ATTEMPTS) break

      await sleep(backoffDelayMs(attempt, INLINE_BASE_MS, INLINE_CEIL_MS))
    }

    const delivered = lastStatus >= 200 && lastStatus < 300
    if (!delivered) {
      console.error(`Webhook ${webhook.id} failed after ${attempt} attempts (status ${lastStatus})`)
      await deadLetterWebhook(webhook, eventType, eventData, attempt, lastBody)
    }
  }
}

async function deadLetterWebhook(
  webhook: Webhook,
  eventType: string,
  eventData: Record<string, any>,
  attempts: number,
  lastError: string
): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.from('webhook_dead_letters').insert({
      webhook_id: webhook.id,
      user_id: webhook.user_id,
      event_type: eventType,
      payload: eventData,
      attempts,
      last_error: lastError,
    })
  } catch (error) {
    console.error(`Failed to dead-letter webhook ${webhook.id}:`, error)
  }
}

async function sendWebhook(
  webhook: Webhook,
  eventType: string,
  eventData: Record<string, any>,
  attempt: number
): Promise<{ status: number; body: string }> {
  const payload = JSON.stringify({
    id: crypto.randomUUID(),
    type: eventType,
    data: eventData,
    timestamp: new Date().toISOString()
  })

  // Create signature if secret is provided
  let signature: string | undefined
  if (webhook.secret) {
    const crypto = await import('crypto')
    signature = 'sha256=' + crypto
      .createHmac('sha256', webhook.secret)
      .update(payload, 'utf8')
      .digest('hex')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'YLS-Webhooks/1.0',
    'X-YLS-Event-Type': eventType,
    'X-YLS-Delivery': crypto.randomUUID()
  }

  if (signature) {
    headers['X-YLS-Signature'] = signature
  }

  let status = 0
  let body = ''
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: payload
    })
    status = response.status
    body = await response.text().catch(() => '')
  } catch (error) {
    // Network failure → status 0 (treated as transient by shouldRetry)
    status = 0
    body = error instanceof Error ? error.message : 'Network error'
  }

  await recordWebhookDelivery({
    webhook_id: webhook.id,
    event_type: eventType,
    payload: eventData,
    response_status: status,
    response_body: body,
    delivery_attempts: attempt
  })

  return { status, body }
}

// =================================================================================
// Built-in Event Triggers
// =================================================================================

export const WebhookEvents = {
  // Campaign events
  async campaignCreated(campaignId: string, userId: string) {
    await triggerWebhookEvent('campaign.created', {
      campaign_id: campaignId,
      user_id: userId
    })
  },

  async campaignStatusChanged(campaignId: string, oldStatus: string, newStatus: string, userId: string) {
    await triggerWebhookEvent('campaign.status_changed', {
      campaign_id: campaignId,
      old_status: oldStatus,
      new_status: newStatus,
      user_id: userId
    })
  },

  // Order events
  async orderPaymentCaptured(orderId: string, amountCaptured: number, userId: string) {
    await triggerWebhookEvent('order.payment_captured', {
      order_id: orderId,
      amount_captured: amountCaptured,
      user_id: userId
    })
  },

  // Mailing list events
  async mailingListUpdated(mailingListId: string, changes: string[], userId: string) {
    await triggerWebhookEvent('mailing_list.updated', {
      mailing_list_id: mailingListId,
      changes,
      user_id: userId
    })
  },

  // Record events
  async recordsImported(mailingListId: string, importedCount: number, userId: string) {
    await triggerWebhookEvent('records.imported', {
      mailing_list_id: mailingListId,
      imported_count: importedCount,
      user_id: userId
    })
  }
}
