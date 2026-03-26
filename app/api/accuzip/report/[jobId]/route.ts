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
    
    // Generate CSV report
    const records = validationJob.validated_records || []
    
    if (records.length === 0) {
      return NextResponse.json(
        { error: 'No validation results found' },
        { status: 404 }
      )
    }
    
    // CSV headers
    const headers = [
      'Record ID',
      'First Name',
      'Last Name',
      'Original Address Line 1',
      'Original Address Line 2', 
      'Original City',
      'Original State',
      'Original ZIP',
      'Standardized Address Line 1',
      'Standardized Address Line 2',
      'Standardized City',
      'Standardized State',
      'Standardized ZIP',
      'ZIP+4',
      'Deliverable',
      'Validation Errors',
      'Email',
      'Phone'
    ]
    
    // CSV rows
    const csvRows = [
      headers.join(','),
      ...records.map((record: any) => {
        const standardized = record.standardized_address || {}
        const errors = record.validation_errors || []
        
        return [
          record.id || '',
          record.first_name || '',
          record.last_name || '',
          `"${record.address_line_1 || ''}"`,
          `"${record.address_line_2 || ''}"`,
          record.city || '',
          record.state || '',
          record.zip || '',
          `"${standardized.address_line_1 || ''}"`,
          `"${standardized.address_line_2 || ''}"`,
          standardized.city || '',
          standardized.state || '',
          standardized.zip || '',
          standardized.zip_plus_4 || '',
          record.is_deliverable ? 'Yes' : 'No',
          `"${errors.join('; ')}"`,
          record.email || '',
          record.phone || ''
        ].join(',')
      })
    ]
    
    const csvContent = csvRows.join('\n')
    
    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="accuzip-validation-report-${jobId}.csv"`,
        'Content-Length': csvContent.length.toString()
      }
    })
    
  } catch (error) {
    console.error('AccuZip report generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Report generation failed' },
      { status: 500 }
    )
  }
})