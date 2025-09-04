import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// =================================================================================
// Webhook Event Types
// =================================================================================

interface WebhookEvent {
  id: string
  type: 'campaign.created' | 'campaign.status_changed' | 'order.payment_captured' | 'mailing_list.updated' | 'records.imported'
  data: Record<string, any>
  timestamp: string
}

// =================================================================================
// Webhook Signature Verification
// =================================================================================

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')
  
  const providedSignature = signature.replace('sha256=', '')
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(providedSignature, 'hex')
  )
}

// =================================================================================
// Webhook Handlers
// =================================================================================

async function handleCampaignCreated(data: any, supabase: any) {
  console.log('Processing campaign.created webhook:', data.campaign_id)
  
  // Log webhook delivery
  await supabase
    .from('webhook_deliveries')
    .insert({
      webhook_id: data.webhook_id,
      event_type: 'campaign.created',
      payload: data,
      response_status: 200,
      delivery_attempts: 1,
      delivered_at: new Date().toISOString()
    })

  // Custom business logic for campaign creation
  // e.g., notify external fulfillment service
  return { success: true, message: 'Campaign creation processed' }
}

async function handleCampaignStatusChanged(data: any, supabase: any) {
  console.log('Processing campaign.status_changed webhook:', data.campaign_id, data.new_status)
  
  // Update external systems based on campaign status
  if (data.new_status === 'in_production') {
    // Notify production systems
    console.log('Notifying production systems for campaign:', data.campaign_id)
  } else if (data.new_status === 'delivered') {
    // Update delivery tracking
    console.log('Updating delivery tracking for campaign:', data.campaign_id)
  }

  return { success: true, message: 'Campaign status change processed' }
}

async function handleOrderPaymentCaptured(data: any, supabase: any) {
  console.log('Processing order.payment_captured webhook:', data.order_id)
  
  // Update order status and trigger fulfillment
  await supabase
    .from('orders')
    .update({
      payment_status: 'captured',
      amount_captured: data.amount_captured,
      updated_at: new Date().toISOString()
    })
    .eq('id', data.order_id)

  // Trigger fulfillment process
  console.log('Triggering fulfillment for order:', data.order_id)
  
  return { success: true, message: 'Payment capture processed and fulfillment triggered' }
}

async function handleMailingListUpdated(data: any, supabase: any) {
  console.log('Processing mailing_list.updated webhook:', data.mailing_list_id)
  
  // Update analytics or trigger external integrations
  if (data.changes.includes('record_count')) {
    // Update usage tracking
    await supabase
      .from('mailing_list_usage')
      .insert({
        mailing_list_id: data.mailing_list_id,
        user_id: data.user_id,
        usage_type: 'update',
        record_count: data.new_record_count
      })
  }

  return { success: true, message: 'Mailing list update processed' }
}

async function handleRecordsImported(data: any, supabase: any) {
  console.log('Processing records.imported webhook:', data.mailing_list_id, `${data.imported_count} records`)
  
  // Trigger validation and enrichment processes
  console.log('Starting record validation for:', data.mailing_list_id)
  
  // Log the import for analytics
  await supabase
    .from('mailing_list_usage')
    .insert({
      mailing_list_id: data.mailing_list_id,
      user_id: data.user_id,
      usage_type: 'import',
      record_count: data.imported_count
    })

  return { success: true, message: 'Record import processed and validation started' }
}

// =================================================================================
// Main Webhook Handler
// =================================================================================

export async function POST(request: NextRequest) {
  try {
    const headersList = headers()
    const signature = headersList.get('x-yls-signature')
    const eventType = headersList.get('x-yls-event-type')
    
    if (!signature || !eventType) {
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      )
    }

    const payload = await request.text()
    const webhookSecret = process.env.WEBHOOK_SECRET
    
    if (!webhookSecret) {
      console.error('WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const data = JSON.parse(payload)
    const supabase = createSupabaseServerClient()

    let result: { success: boolean; message: string }

    // Route to appropriate handler based on event type
    switch (eventType) {
      case 'campaign.created':
        result = await handleCampaignCreated(data, supabase)
        break
      
      case 'campaign.status_changed':
        result = await handleCampaignStatusChanged(data, supabase)
        break
      
      case 'order.payment_captured':
        result = await handleOrderPaymentCaptured(data, supabase)
        break
      
      case 'mailing_list.updated':
        result = await handleMailingListUpdated(data, supabase)
        break
      
      case 'records.imported':
        result = await handleRecordsImported(data, supabase)
        break
      
      default:
        console.warn('Unknown event type:', eventType)
        return NextResponse.json(
          { error: 'Unknown event type' },
          { status: 400 }
        )
    }

    // Log successful webhook processing
    console.log(`Webhook processed successfully: ${eventType}`, result.message)
    
    return NextResponse.json({
      success: true,
      event_type: eventType,
      message: result.message,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// =================================================================================
// Health Check Endpoint
// =================================================================================

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'YLS Webhooks',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}
