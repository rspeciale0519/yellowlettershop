import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { transformDataWithMappings } from '@/lib/mailing-lists/transform'

export async function POST(request: NextRequest) {
  console.log('=== IMPORT SPREADSHEET API START ===')
  
  try {
    const body = await request.json()
    console.log('Request body keys:', Object.keys(body))
    
    const { listId, listName, isNewList, columnMappings, parsedData } = body
    
    console.log('Import parameters:', {
      listId,
      listName,
      isNewList,
      hasColumnMappings: !!columnMappings,
      hasparsedData: !!parsedData,
      parsedDataRowCount: parsedData?.allRows?.length
    })
    
    // Basic validation
    if (!columnMappings || !parsedData) {
      console.error('Missing required parameters:', { columnMappings: !!columnMappings, parsedData: !!parsedData })
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    if (isNewList && !listName?.trim()) {
      console.error('Missing list name for new list')
      return NextResponse.json(
        { error: 'List name is required for new lists' },
        { status: 400 }
      )
    }

    if (!isNewList && !listId) {
      console.error('Missing list ID for existing list')
      return NextResponse.json(
        { error: 'List ID is required for existing lists' },
        { status: 400 }
      )
    }

    console.log('Creating Supabase client...')
    const supabase = await createSupabaseServerClient()
    
    // Get the current user
    console.log('Getting authenticated user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('User authentication error:', userError)
      return NextResponse.json(
        { error: 'Authentication failed', details: userError.message },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.error('No authenticated user found')
      return NextResponse.json(
        { error: 'User not authenticated - please log in first' },
        { status: 401 }
      )
    }

    console.log('Authenticated user:', user.email)

    let mailingList: { id: string; name: string; user_id: string; team_id?: string; record_count: number; source_type?: string }
    let targetListId: string

    if (isNewList) {
      console.log('Creating new mailing list:', listName.trim())
      
      // Create a new mailing list
      const { data: newList, error: createError } = await supabase
        .from('mailing_lists')
        .insert([
          {
            name: listName.trim(),
            user_id: user.id,
            created_by: user.id,
            record_count: 0,
            source_type: 'upload',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select('id, name, user_id, team_id, record_count, source_type')
        .single()

      if (createError) {
        console.error('Failed to create new mailing list:', createError)
        return NextResponse.json(
          { error: 'Failed to create new mailing list', details: createError.message },
          { status: 500 }
        )
      }

      if (!newList) {
        console.error('New mailing list creation returned null')
        return NextResponse.json(
          { error: 'Failed to create new mailing list - no data returned' },
          { status: 500 }
        )
      }

      console.log('Created new mailing list:', newList.id)
      mailingList = newList
      targetListId = newList.id
    } else {
      console.log('Using existing mailing list:', listId)
      
      // Verify the existing mailing list and user access
      const { data: existingList, error: listError } = await supabase
        .from('mailing_lists')
        .select('id, name, user_id, team_id, record_count, source_type')
        .eq('id', listId)
        .single()

      if (listError) {
        console.error('Error fetching existing mailing list:', listError)
        return NextResponse.json(
          { error: 'Mailing list not found', details: listError.message },
          { status: 404 }
        )
      }

      if (!existingList) {
        console.error('Existing mailing list not found')
        return NextResponse.json(
          { error: 'Mailing list not found' },
          { status: 404 }
        )
      }

      // Check if user has access to this list
      if (existingList.user_id !== user.id) {
        console.error('User access denied to list:', {
          listUserId: existingList.user_id,
          currentUserId: user.id
        })
        return NextResponse.json(
          { error: 'Access denied - you do not own this mailing list' },
          { status: 403 }
        )
      }

      console.log('Access verified for existing mailing list')
      mailingList = existingList
      targetListId = existingList.id
    }

    console.log('Target list ID:', targetListId)

    // Transform data based on column mappings
    console.log('Transforming data with column mappings...')
    const transformedRecords = transformDataWithMappings(
      parsedData.headers,
      parsedData.allRows,
      columnMappings
    )

    console.log('Transformed records count:', transformedRecords.length)

    // Simple validation - just check for basic required data
    const validRecords = []
    const errors = []

    for (let i = 0; i < transformedRecords.length; i++) {
      const record = transformedRecords[i]
      const recordErrors = validateRecord(record)
      
      if (recordErrors.length === 0) {
        validRecords.push({
          mailing_list_id: targetListId,
          record_data: record, // Store all data in JSONB column
          validation_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      } else {
        errors.push({
          row: i + 2, // +2 because we skipped header and arrays are 0-indexed
          errors: recordErrors
        })
      }
    }

    console.log('Validation results:', {
      validRecords: validRecords.length,
      errorRecords: errors.length
    })

    if (validRecords.length === 0) {
      console.error('No valid records found to import')
      return NextResponse.json(
        { error: 'No valid records found to import', details: errors },
        { status: 400 }
      )
    }

    // Insert records in batches
    console.log('Inserting records in batches...')
    const batchSize = 50 // Smaller batch size for safety
    let insertedCount = 0

    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize)
      console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`)
      
      const { data: insertedRecords, error: insertError } = await supabase
        .from('mailing_list_records')
        .insert(batch)
        .select('id')

      if (insertError) {
        console.error(`Batch insert error at batch ${Math.floor(i / batchSize) + 1}:`, insertError)
        return NextResponse.json(
          { error: `Failed to insert records at batch ${Math.floor(i / batchSize) + 1}`, details: insertError.message },
          { status: 500 }
        )
      }

      if (!insertedRecords) {
        console.error('Batch insert returned null data')
        return NextResponse.json(
          { error: 'Failed to insert records - no data returned' },
          { status: 500 }
        )
      }

      insertedCount += batch.length
      console.log(`Successfully inserted batch ${Math.floor(i / batchSize) + 1}`)
    }

    console.log('All records inserted successfully. Total:', insertedCount)

    // Update mailing list record count
    console.log('Updating mailing list record count...')
    const { error: updateError } = await supabase
      .from('mailing_lists')
      .update({ 
        record_count: mailingList.record_count + insertedCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetListId)

    if (updateError) {
      console.error('Failed to update list count:', updateError)
      // Don't fail the whole operation for this
    }

    console.log('=== IMPORT SPREADSHEET API SUCCESS ===')

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedCount} records to "${mailingList.name}"`,
      imported: insertedCount,
      listId: targetListId,
      listName: mailingList.name,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('=== IMPORT SPREADSHEET API ERROR ===')
    console.error('Unexpected error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        error: 'Failed to import spreadsheet',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'unexpected_error'
      },
      { status: 500 }
    )
  }
}

// transformation helper moved to lib/mailing-lists/transform.ts

// Helper function to validate record data (simplified)
function validateRecord(record: Record<string, unknown>) {
  const errors = []
  
  // At least one name field is required
  if (!record.firstName && !record.lastName && !record.name) {
    errors.push('First name, last name, or full name is required')
  }
  
  // Basic email validation if provided
  if (record.email && !isValidEmail(record.email)) {
    errors.push('Invalid email format')
  }
  
  // Basic ZIP code validation if provided
  if (record.zipCode && !isValidZipCode(record.zipCode)) {
    errors.push('Invalid ZIP code format')
  }
  
  return errors
}

function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

function isValidZipCode(zipCode: string): boolean {
  if (!zipCode || typeof zipCode !== 'string') return false
  const zipRegex = /^\d{5}(-\d{4})?$/
  return zipRegex.test(zipCode.trim())
}
