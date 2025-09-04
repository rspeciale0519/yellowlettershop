import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { bulkOperationsService, bulkOperationQueue } from '@/lib/bulk-operations'
import { z } from 'zod'

const BulkOperationSchema = z.object({
  type: z.enum(['tag_assign', 'tag_remove', 'delete_records', 'update_fields', 'export_records']),
  recordIds: z.array(z.string().uuid()).min(1).max(10000),
  metadata: z.record(z.any()).optional()
})

const BulkTagOperationSchema = BulkOperationSchema.extend({
  tagIds: z.array(z.string().uuid()).min(1)
})

const BulkUpdateOperationSchema = BulkOperationSchema.extend({
  updates: z.record(z.any()).refine(
    (obj) => Object.keys(obj).length > 0,
    { message: "Updates cannot be empty" }
  )
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')

    let query = supabase
      .from('bulk_operations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: operations, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ operations })
  } catch (error) {
    console.error('Error fetching bulk operations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate based on operation type
    let validatedData
    if (body.type === 'tag_assign' || body.type === 'tag_remove') {
      validatedData = BulkTagOperationSchema.parse(body)
    } else if (body.type === 'update_fields') {
      validatedData = BulkUpdateOperationSchema.parse(body)
    } else {
      validatedData = BulkOperationSchema.parse(body)
    }

    const { type, recordIds, metadata = {} } = validatedData

    // Check if user can perform this operation
    const canPerform = bulkOperationQueue.canPerformOperation(user.id, recordIds.length)
    if (!canPerform.allowed) {
      return NextResponse.json({ 
        error: canPerform.reason 
      }, { status: 429 })
    }

    // Check database rate limits
    const { data: rateCheck } = await supabase.rpc('can_perform_bulk_operation', {
      p_user_id: user.id,
      p_operation_type: type,
      p_record_count: recordIds.length
    })

    if (!rateCheck?.allowed) {
      return NextResponse.json({ 
        error: rateCheck?.reason || 'Operation not allowed'
      }, { status: 429 })
    }

    // Track the operation in queue
    bulkOperationQueue.trackOperation(user.id, recordIds.length)

    // Start the database tracking
    await supabase.rpc('start_bulk_operation', {
      p_user_id: user.id,
      p_operation_type: type,
      p_record_count: recordIds.length
    })

    let result
    switch (type) {
      case 'tag_assign':
        const tagAssignData = validatedData as z.infer<typeof BulkTagOperationSchema>
        result = await bulkOperationsService.bulkAssignTags(
          user.id,
          recordIds,
          tagAssignData.tagIds
        )
        break

      case 'tag_remove':
        const tagRemoveData = validatedData as z.infer<typeof BulkTagOperationSchema>
        result = await bulkOperationsService.bulkRemoveTags(
          user.id,
          recordIds,
          tagRemoveData.tagIds
        )
        break

      case 'delete_records':
        result = await bulkOperationsService.bulkDeleteRecords(
          user.id,
          recordIds
        )
        break

      case 'update_fields':
        const updateData = validatedData as z.infer<typeof BulkUpdateOperationSchema>
        result = await bulkOperationsService.bulkUpdateRecords(
          user.id,
          recordIds,
          updateData.updates
        )
        break

      default:
        return NextResponse.json({ 
          error: 'Operation type not implemented yet' 
        }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      result 
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 })
    }

    console.error('Error creating bulk operation:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}