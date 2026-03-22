import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'

const UploadRequestSchema = z.object({
  columnMapping: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    address2: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional()
  }),
  listData: z.object({
    source: z.enum(['upload', 'list_builder', 'saved_list']),
    uploadedFileId: z.string().optional(),
    mailingListId: z.string().optional(),
    listBuilderId: z.string().optional(),
    records: z.array(z.record(z.unknown())).optional()
  })
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const validatedData = UploadRequestSchema.parse(body)
    
    const supabase = createClient()
    
    // Get records based on data source
    let records: any[] = []
    
    if (validatedData.listData.source === 'upload' && validatedData.listData.uploadedFileId) {
      // Fetch records from uploaded file
      const { data: fileRecords, error } = await supabase
        .from('mailing_list_records')
        .select('*')
        .eq('upload_id', validatedData.listData.uploadedFileId)
        .eq('user_id', userId)
      
      if (error) throw new Error('Failed to fetch uploaded records')
      records = fileRecords || []
      
    } else if (validatedData.listData.source === 'saved_list' && validatedData.listData.mailingListId) {
      // Fetch records from saved mailing list
      const { data: listRecords, error } = await supabase
        .from('mailing_list_records')
        .select('*')
        .eq('mailing_list_id', validatedData.listData.mailingListId)
        .eq('user_id', userId)
      
      if (error) throw new Error('Failed to fetch list records')
      records = listRecords || []
      
    } else if (validatedData.listData.records) {
      // Use provided records directly (from list builder)
      records = validatedData.listData.records
    }
    
    if (records.length === 0) {
      return NextResponse.json(
        { error: 'No records found for validation' },
        { status: 400 }
      )
    }
    
    // Transform records to AccuZip format based on column mapping
    const accuzipRecords = records.map((record, index) => {
      const mapping = validatedData.columnMapping
      return {
        id: record.id || index.toString(),
        address_line_1: record[mapping.address] || '',
        address_line_2: record[mapping.address2 || ''] || '',
        city: record[mapping.city] || '',
        state: record[mapping.state] || '',
        zip: record[mapping.zipCode] || '',
        first_name: record[mapping.firstName || ''] || '',
        last_name: record[mapping.lastName || ''] || '',
        email: record[mapping.email || ''] || '',
        phone: record[mapping.phone || ''] || ''
      }
    })
    
    // Create validation job record
    const { data: validationJob, error: jobError } = await supabase
      .from('accuzip_validation_jobs')
      .insert({
        user_id: userId,
        status: 'pending',
        total_records: records.length,
        records_data: accuzipRecords,
        column_mapping: validatedData.columnMapping,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (jobError) {
      console.error('Error creating validation job:', jobError)
      throw new Error('Failed to create validation job')
    }
    
    // Start AccuZip validation process (async)
    // In a real implementation, this would upload to AccuZip
    // For now, we'll simulate the process
    processAccuZipValidation(validationJob.id, accuzipRecords, supabase)
    
    return NextResponse.json({
      jobId: validationJob.id,
      totalRecords: records.length,
      status: 'pending'
    })
    
  } catch (error) {
    console.error('AccuZip upload error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
})

// Simulate AccuZip validation process
async function processAccuZipValidation(jobId: string, records: any[], supabase: any) {
  try {
    // Update job status to processing
    await supabase
      .from('accuzip_validation_jobs')
      .update({ status: 'processing' })
      .eq('id', jobId)
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Simulate validation results (90% deliverable rate)
    const validatedRecords = records.map((record, index) => ({
      ...record,
      is_deliverable: Math.random() > 0.1, // 90% deliverable
      standardized_address: {
        address_line_1: record.address_line_1,
        address_line_2: record.address_line_2,
        city: record.city,
        state: record.state,
        zip: record.zip,
        zip_plus_4: Math.random() > 0.5 ? '1234' : null
      },
      validation_errors: Math.random() > 0.9 ? ['Invalid ZIP code'] : null
    }))
    
    const deliverableCount = validatedRecords.filter(r => r.is_deliverable).length
    const undeliverableCount = records.length - deliverableCount
    
    // Update job with results
    await supabase
      .from('accuzip_validation_jobs')
      .update({
        status: 'completed',
        validated_records: validatedRecords,
        deliverable_count: deliverableCount,
        undeliverable_count: undeliverableCount,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)
    
    console.log(`AccuZip validation completed for job ${jobId}`)
    
  } catch (error) {
    console.error('AccuZip validation processing error:', error)
    
    // Update job status to error
    await supabase
      .from('accuzip_validation_jobs')
      .update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Validation failed'
      })
      .eq('id', jobId)
  }
}