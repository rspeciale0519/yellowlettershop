import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { validateEmailBatch } from '@/lib/validation/email-validation'
import { validateAddressBatch } from '@/lib/validation/address-validation'
import { batchDuplicateDetection } from '@/lib/validation/duplicate-detection'
import { batchCalculateCompleteness } from '@/lib/validation/data-completeness'
import { createJob } from '@/lib/jobs/job-queue'
import { 
  checkBatchProcessingAllowed, 
  reserveBatchSlot, 
  releaseBatchSlot,
  estimateMemoryUsage 
} from '@/lib/system/batch-limits'

export async function POST(request: NextRequest) {
  try {
    const { listId, listName, isNewList, columnMappings, parsedData } = await request.json()
    
    if (!columnMappings || !parsedData) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    if (isNewList && !listName?.trim()) {
      return NextResponse.json(
        { error: 'List name is required for new lists' },
        { status: 400 }
      )
    }

    if (!isNewList && !listId) {
      return NextResponse.json(
        { error: 'List ID is required for existing lists' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Check if this should be processed as a background job
    const recordCount = parsedData.allRows?.length || 0
    const shouldUseBackgroundJob = recordCount > 100 // Process in background if > 100 records

    if (!shouldUseBackgroundJob) {
      // For small imports, redirect to synchronous processing
      return NextResponse.json(
        { 
          error: 'Use synchronous import endpoint for small files',
          redirect: '/api/mailing-lists/import-spreadsheet'
        },
        { status: 400 }
      )
    }

    // Check batch processing limits before proceeding
    const subscriptionTier = 'free' // TODO: Get from user profile
    const estimatedMemoryMB = estimateMemoryUsage(recordCount)
    
    const batchCheck = await checkBatchProcessingAllowed({
      userId: user.id,
      recordCount,
      priority: 'normal',
      estimatedMemoryMB
    }, subscriptionTier)

    if (!batchCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Batch processing not allowed',
          reason: batchCheck.reason,
          suggestedBatchSize: batchCheck.suggestedBatchSize,
          estimatedDelay: batchCheck.estimatedDelay,
          alternativeOptions: batchCheck.alternativeOptions
        },
        { status: 429 } // Too Many Requests
      )
    }

    // Reserve batch processing slot
    const slotReserved = reserveBatchSlot(user.id)
    if (!slotReserved) {
      return NextResponse.json(
        { error: 'Unable to reserve processing slot. Please try again.' },
        { status: 503 }
      )
    }

    let mailingList: { id: string; name: string; user_id: string; team_id?: string; record_count: number }
    let targetListId: string

    if (isNewList) {
      // Create a new mailing list
      const { data: newList, error: createError } = await supabase
        .from('mailing_lists')
        .insert([
          {
            name: listName.trim(),
            user_id: user.id,
            record_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select('id, name, user_id, team_id, record_count')
        .single()

      if (createError || !newList) {
        return NextResponse.json(
          { error: 'Failed to create new mailing list' },
          { status: 500 }
        )
      }

      mailingList = newList
      targetListId = newList.id
    } else {
      // Verify the existing mailing list and user access
      const { data: existingList, error: listError } = await supabase
        .from('mailing_lists')
        .select('id, name, user_id, team_id, record_count')
        .eq('id', listId)
        .single()

      if (listError || !existingList) {
        return NextResponse.json(
          { error: 'Mailing list not found' },
          { status: 404 }
        )
      }

      // Check if user has access to this list
      if (existingList.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      mailingList = existingList
      targetListId = existingList.id
    }

    // Transform data based on column mappings
    const transformedRecords = transformDataWithMappings(
      parsedData.headers,
      parsedData.allRows,
      columnMappings
    )

    // Pre-process validation data for background job
    const emailsToValidate = transformedRecords
      .map(record => record.email)
      .filter(email => email && typeof email === 'string' && email.trim() !== '')

    const addressesToValidate = transformedRecords
      .map(record => ({
        address: record.address || '',
        city: record.city || '',
        state: record.state || '',
        zipCode: record.zipCode || ''
      }))
      .filter(addr => addr.address && addr.city && addr.state && addr.zipCode)

    // Run validation processes
    let emailValidationResults: Record<string, unknown> = {}
    let addressValidationResults: Record<string, unknown> = {}
    let duplicateResults: Record<string, unknown> = {}
    let completenessResults: Record<string, unknown> = {}

    try {
      // Email validation
      if (emailsToValidate.length > 0) {
        emailValidationResults = await validateEmailBatch(emailsToValidate, {
          checkDeliverability: true,
          allowDisposable: false,
          allowRole: true,
          allowFree: true
        })
      }

      // Address validation
      if (addressesToValidate.length > 0) {
        addressValidationResults = await validateAddressBatch(addressesToValidate, {
          standardizeOnly: false,
          requireDPV: false,
          allowPOBox: true,
          allowRural: true
        })
      }

      // Get existing records for duplicate detection
      const { data: existingRecords } = await supabase
        .from('mailing_list_records')
        .select(`
          id,
          firstName,
          lastName,
          email,
          phone,
          address,
          city,
          state,
          zipCode,
          mailing_list_id,
          user_id
        `)
        .eq('user_id', user.id)

      // Duplicate detection
      if (existingRecords && existingRecords.length > 0) {
        duplicateResults = await batchDuplicateDetection(
          transformedRecords.map((record, index) => ({ ...record, id: index.toString() })),
          existingRecords,
          {
            emailWeight: 40,
            phoneWeight: 30,
            nameWeight: 20,
            addressWeight: 10,
            threshold: 75,
            fuzzyMatching: true,
            crossProject: true,
            userId: user.id
          }
        )
      }

      // Completeness scoring
      const recordsForScoring = transformedRecords.map((record, index) => ({
        ...record,
        additional_data: {
          email_validation: record.email ? emailValidationResults[record.email] : null,
          address_validation: addressValidationResults[index.toString()]
        }
      }))
      
      completenessResults = batchCalculateCompleteness(recordsForScoring, {
        requireEmail: false,
        requirePhone: false,
        requireAddress: false
      })

    } catch (validationError) {
      console.error('Validation error during async import setup:', validationError)
      // Continue with import even if validation fails
    }

    // Create background job for the actual import
    const job = createJob(
      'import_spreadsheet',
      {
        transformedRecords,
        targetListId,
        userId: user.id,
        emailValidationResults,
        addressValidationResults,
        duplicateResults,
        completenessResults,
        listName: isNewList ? listName : mailingList.name
      },
      user.id,
      {
        totalRecords: transformedRecords.length,
        processedRecords: 0,
        validRecords: 0,
        errorRecords: 0
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Import job created successfully',
      jobId: job.id,
      estimatedRecords: transformedRecords.length,
      listId: targetListId,
      listName: isNewList ? listName : mailingList.name
    })

  } catch (error) {
    console.error('Async import spreadsheet error:', error)
    
    // Release batch slot if job creation failed
    const { data: { user } } = await createSupabaseServerClient().auth.getUser()
    if (user) {
      releaseBatchSlot(user.id)
    }
    
    return NextResponse.json(
      { error: 'Failed to start import job' },
      { status: 500 }
    )
  }
}

// Helper function to transform data based on column mappings
function transformDataWithMappings(
  headers: string[], 
  rows: string[][], 
  columnMappings: Record<string, string>
) {
  const transformedRows = []
  
  for (const row of rows) {
    const transformedRow: Record<string, unknown> = {}
    
    headers.forEach((header, index) => {
      const systemField = columnMappings[header]
      if (systemField && systemField !== '') {
        transformedRow[systemField] = row[index] || ''
      }
    })
    
    // Only include rows that have at least one mapped field with data
    if (Object.values(transformedRow).some(value => value !== '')) {
      transformedRows.push(transformedRow)
    }
  }
  
  return transformedRows
}
