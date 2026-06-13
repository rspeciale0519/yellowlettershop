import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { batchValidateRecords } from '@/lib/api/accuzip/validation'
import { buildValidationResults, type AccuzipRecord } from '@/lib/orders/accuzip-processor'

const accuzipConfigured = (): boolean => Boolean(process.env.ACCUZIP_API_KEY)
const devSkipAllowed = (): boolean =>
  process.env.NODE_ENV !== 'production' || process.env.ACCUZIP_SKIP_VALIDATION === 'true'

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
    let records: Record<string, unknown>[] = []
    
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
    const field = (record: Record<string, unknown>, key: string | undefined): string => {
      const v = key ? record[key] : undefined
      return v === null || v === undefined ? '' : String(v)
    }
    const accuzipRecords: AccuzipRecord[] = records.map((record, index) => {
      const mapping = validatedData.columnMapping
      return {
        id: field(record, 'id') || index.toString(),
        address_line_1: field(record, mapping.address),
        address_line_2: field(record, mapping.address2),
        city: field(record, mapping.city),
        state: field(record, mapping.state),
        zip: field(record, mapping.zipCode),
        first_name: field(record, mapping.firstName),
        last_name: field(record, mapping.lastName),
        email: field(record, mapping.email),
        phone: field(record, mapping.phone)
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
    
    if (!accuzipConfigured() && !devSkipAllowed()) {
      await supabase
        .from('accuzip_validation_jobs')
        .update({ status: 'error', error_message: 'Address validation unavailable: ACCUZIP_API_KEY is not configured' })
        .eq('id', validationJob.id)
      return NextResponse.json(
        { error: 'Address validation is unavailable — ACCUZIP_API_KEY is not configured. Contact support.' },
        { status: 503 }
      )
    }

    processAccuZipValidation(validationJob.id, accuzipRecords, supabase)

    return NextResponse.json({
      jobId: validationJob.id,
      totalRecords: records.length,
      status: 'pending',
      validationMode: accuzipConfigured() ? 'live' : 'skipped_dev'
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

// Validate the job's records against the real AccuZip client. Without an API
// key this only runs in dev (skip semantics live in batchValidateRecords and
// are logged); production without a key is rejected before we get here.
async function processAccuZipValidation(
  jobId: string,
  records: AccuzipRecord[],
  supabase: ReturnType<typeof createClient>
) {
  try {
    await supabase
      .from('accuzip_validation_jobs')
      .update({ status: 'processing' })
      .eq('id', jobId)

    const recordsForValidation = records.map(
      (record): { id: string; [key: string]: unknown } => ({ ...record })
    )
    const verdicts = await batchValidateRecords(recordsForValidation, 'address')
    const byId = new Map(verdicts.map((v) => [v.recordId, v]))

    const { validatedRecords, deliverableCount, undeliverableCount } = buildValidationResults(
      records,
      (record) => {
        const v = byId.get(String(record.id))
        return v
          ? { valid: v.valid, errors: v.errors }
          : { valid: false, errors: ['No validation verdict returned'] }
      }
    )

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
  } catch (error) {
    console.error('AccuZip validation processing error:', error)
    await supabase
      .from('accuzip_validation_jobs')
      .update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Validation failed'
      })
      .eq('id', jobId)
  }
}