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
    
    // Fetch validation job results
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
    
    if (validationJob.status !== 'completed') {
      return NextResponse.json(
        { error: 'Validation not completed yet' },
        { status: 400 }
      )
    }
    
    // Transform results to match the expected format for the order workflow
    const validationResults = {
      orderId: validationJob.id,
      totalRecords: validationJob.total_records,
      deliverableRecords: validationJob.deliverable_count,
      undeliverableRecords: validationJob.undeliverable_count,
      validatedAt: validationJob.completed_at,
      cassCertified: true,
      records: validationJob.validated_records || [],
      summary: {
        deliveryRate: Math.round((validationJob.deliverable_count / validationJob.total_records) * 100),
        standardizedAddresses: validationJob.validated_records?.filter((r: any) => r.standardized_address) || [],
        zipPlus4Added: validationJob.validated_records?.filter((r: any) => r.standardized_address?.zip_plus_4) || [],
        validationErrors: validationJob.validated_records?.filter((r: any) => r.validation_errors?.length > 0) || []
      }
    }
    
    return NextResponse.json(validationResults)
    
  } catch (error) {
    console.error('AccuZip results fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Results fetch failed' },
      { status: 500 }
    )
  }
})