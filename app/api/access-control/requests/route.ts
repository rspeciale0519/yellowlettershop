import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { timeBasedPermissions } from '@/lib/access-control/time-based-permissions'
import { z } from 'zod'

export const runtime = 'nodejs'

const CreateAccessRequestSchema = z.object({
  resource_type: z.enum(['mailing_list', 'template', 'design', 'contact_card', 'asset']),
  resource_id: z.string().uuid(),
  requested_permission: z.enum(['view_only', 'edit', 'admin', 'owner']),
  justification: z.string().optional(),
  requested_duration_days: z.number().int().min(1).max(365).optional()
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
    const status = searchParams.get('status')
    const teamId = searchParams.get('teamId')

    // If teamId is provided, get team requests (for managers)
    if (teamId) {
      const requests = await timeBasedPermissions.getTeamAccessRequests(
        teamId,
        status as 'pending' | 'approved' | 'rejected' | 'expired' | null
      )
      return NextResponse.json({ requests })
    } else {
      // Get user's own requests
      const requests = await timeBasedPermissions.getUserAccessRequests(user.id)
      return NextResponse.json({ requests })
    }

  } catch (error) {
    console.error('Error fetching access requests:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
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
    const requestData = CreateAccessRequestSchema.parse(body)

    // Check if user already has pending request for this resource
    const { data: existingRequest } = await supabase
      .from('access_requests')
      .select('id')
      .eq('requester_id', user.id)
      .eq('resource_type', requestData.resource_type)
      .eq('resource_id', requestData.resource_id)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'You already have a pending request for this resource' 
      }, { status: 400 })
    }

    // Create the access request
    const accessRequest = await timeBasedPermissions.createAccessRequest(requestData)

    return NextResponse.json({ 
      success: true,
      request: accessRequest 
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 })
    }

    console.error('Error creating access request:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}
