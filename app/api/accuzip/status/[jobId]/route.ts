import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'

interface RouteParams {
  params: {
    jobId: string
  }
}

export const GET = withAuth(async (req: NextRequest, { userId }, { params }: RouteParams) => {
  try {
    const { jobId } = params
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = createClient()
    
    // Fetch validation job status
    const { data: validationJob, error } = await supabase
      .from('accuzip_validation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching validation job:', error)
      return NextResponse.json(
        { error: 'Validation job not found' },
        { status: 404 }
      )
    }
    
    if (!validationJob) {
      return NextResponse.json(
        { error: 'Validation job not found' },
        { status: 404 }
      )
    }
    
    // Return status information
    const response = {
      jobId: validationJob.id,
      status: validationJob.status,
      totalRecords: validationJob.total_records,
      processed: validationJob.deliverable_count + validationJob.undeliverable_count || 0,
      deliverableCount: validationJob.deliverable_count || 0,
      undeliverableCount: validationJob.undeliverable_count || 0,
      createdAt: validationJob.created_at,
      completedAt: validationJob.completed_at,
      error: validationJob.error_message
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('AccuZip status check error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Status check failed' },
      { status: 500 }
    )
  }
})