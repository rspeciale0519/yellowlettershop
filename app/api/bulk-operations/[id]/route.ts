import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    const operationId = params.id
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get operation details
    const { data: operation, error } = await supabase
      .from('bulk_operations')
      .select('*')
      .eq('id', operationId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 })
    }

    // Get batch details if available
    const { data: batches } = await supabase
      .from('bulk_operation_batches')
      .select('*')
      .eq('operation_id', operationId)
      .order('batch_number')

    return NextResponse.json({ 
      operation,
      batches: batches || []
    })
  } catch (error) {
    console.error('Error fetching bulk operation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    const operationId = params.id
    const body = await request.json()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow cancellation
    if (body.action !== 'cancel') {
      return NextResponse.json({ error: 'Only cancellation is allowed' }, { status: 400 })
    }

    // Cancel the operation
    const { data: operation, error } = await supabase
      .from('bulk_operations')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', operationId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Cannot cancel operation' }, { status: 400 })
    }

    return NextResponse.json({ operation })
  } catch (error) {
    console.error('Error updating bulk operation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    const operationId = params.id
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow deletion of completed/failed/cancelled operations
    const { error } = await supabase
      .from('bulk_operations')
      .delete()
      .eq('id', operationId)
      .eq('user_id', user.id)
      .in('status', ['completed', 'failed', 'cancelled'])

    if (error) {
      return NextResponse.json({ error: 'Cannot delete operation' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bulk operation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}