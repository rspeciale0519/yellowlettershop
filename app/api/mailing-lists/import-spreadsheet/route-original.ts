import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureRequiredTagsForRecord, bulkAssignTagToRecords, getSystemTagByName, SYSTEM_TAG_NAMES } from '@/lib/tag-system'
import { validateEmailBatch } from '@/lib/validation/email-validation'
import { validateAddressBatch } from '@/lib/validation/address-validation'
import { batchDuplicateDetection, getDuplicateStats } from '@/lib/validation/duplicate-detection'
import { batchCalculateCompleteness, getCompletenessStats } from '@/lib/validation/data-completeness'
import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'

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

    let mailingList: any
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
        // TODO: Add team access check when team functionality is implemented
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

    // Extract emails for batch validation
    const emailsToValidate = transformedRecords
      .map(record => record.email)
      .filter(email => email && typeof email === 'string' && email.trim() !== '')

    // Extract addresses for batch validation
    const addressesToValidate = transformedRecords
      .map(record => ({
        address: record.address || '',
        city: record.city || '',
        state: record.state || '',
        zipCode: record.zipCode || ''
      }))
      .filter(addr => addr.address && addr.city && addr.state && addr.zipCode)

    // Batch validate emails if any exist
    let emailValidationResults: Record<string, any> = {}
    if (emailsToValidate.length > 0) {
      try {
        emailValidationResults = await validateEmailBatch(emailsToValidate, {
          checkDeliverability: true,
          allowDisposable: false,
          allowRole: true,
          allowFree: true
        })
      } catch (emailError) {
        console.error('Email validation error:', emailError)
        // Continue without email validation if service fails
      }
    }

    // Batch validate addresses if any exist
    let addressValidationResults: Record<string, any> = {}
    if (addressesToValidate.length > 0) {
      try {
        addressValidationResults = await validateAddressBatch(addressesToValidate, {
          standardizeOnly: false,
          requireDPV: false,
          allowPOBox: true,
          allowRural: true
        })
      } catch (addressError) {
        console.error('Address validation error:', addressError)
        // Continue without address validation if service fails
      }
    }

    // Get user's mailing list IDs first
    const { data: userLists } = await supabase
      .from('mailing_lists')
      .select('id')
      .eq('user_id', user.id)
    
    const userListIds = userLists?.map(list => list.id) || []

    // Get existing records for duplicate detection
    let existingRecords: any[] = []
    let existingRecordsError = null
    
    if (userListIds.length > 0) {
      const result = await supabase
        .from('mailing_list_records')
        .select(`
          id,
          record_data,
          mailing_list_id
        `)
        .in('mailing_list_id', userListIds)
      
      existingRecords = result.data || []
      existingRecordsError = result.error
    }

    if (existingRecordsError) {
      console.error('Error fetching existing records for duplicate detection:', existingRecordsError)
    }

    // Batch duplicate detection (simplified for now)
    let duplicateResults: Record<string, any> = {}
    if (existingRecords && existingRecords.length > 0) {
      try {
        // Convert existing records to the format expected by duplicate detection
        const existingFormatted = existingRecords.map(record => ({
          id: record.id,
          mailing_list_id: record.mailing_list_id,
          // Extract data from JSONB record_data
          firstName: record.record_data?.firstName || '',
          lastName: record.record_data?.lastName || '',
          email: record.record_data?.email || '',
          phone: record.record_data?.phone || '',
          address: record.record_data?.address || '',
          city: record.record_data?.city || '',
          state: record.record_data?.state || '',
          zipCode: record.record_data?.zipCode || ''
        }))

        duplicateResults = await batchDuplicateDetection(
          transformedRecords.map((record, index) => ({ ...record, id: index.toString() })),
          existingFormatted,
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
      } catch (duplicateError) {
        console.error('Duplicate detection error:', duplicateError)
        // Continue without duplicate detection if service fails
      }
    }

    // Calculate completeness scores for all records
    let completenessResults: Record<string, any> = {}
    try {
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
    } catch (completenessError) {
      console.error('Completeness scoring error:', completenessError)
      // Continue without completeness scoring if service fails
    }

    // Validate records with enhanced email and address validation
    const validRecords = []
    const errors = []

    for (let i = 0; i < transformedRecords.length; i++) {
      const record = transformedRecords[i]
      const addressKey = i.toString()
      const duplicateResult = duplicateResults[addressKey]
      const completenessResult = completenessResults[addressKey]
      const recordErrors = validateRecord(record, emailValidationResults, addressValidationResults[addressKey])
      
      // Check for duplicates and handle based on suggested action
      if (duplicateResult?.isDuplicate) {
        if (duplicateResult.suggestedAction === 'skip') {
          errors.push({
            row: i + 2,
            errors: [`Duplicate record detected (${duplicateResult.confidence}% confidence): ${duplicateResult.reasons.join(', ')}`]
          })
          continue
        } else if (duplicateResult.suggestedAction === 'review') {
          // Add warning but continue with import
          console.warn(`Potential duplicate detected for row ${i + 2}: ${duplicateResult.reasons.join(', ')}`)
        }
      }
      
      if (recordErrors.length === 0) {
        // Add validation metadata if available
        const emailValidation = record.email ? emailValidationResults[record.email] : null
        const addressValidation = addressValidationResults[addressKey]
        
        // Use standardized address if available
        const finalRecord = { ...record }
        if (addressValidation?.standardized) {
          finalRecord.address = addressValidation.standardized.address
          finalRecord.city = addressValidation.standardized.city
          finalRecord.state = addressValidation.standardized.state
          finalRecord.zipCode = addressValidation.standardized.zipCode
        }
        
        validRecords.push({
          mailing_list_id: targetListId,
          record_data: {
            // Core contact data
            ...finalRecord,
            // Validation metadata
            validation_metadata: {
              email_validation: emailValidation ? {
                score: emailValidation.score,
                deliverable: emailValidation.deliverable,
                issues: emailValidation.issues,
                validated_at: new Date().toISOString()
              } : null,
              address_validation: addressValidation ? {
                score: addressValidation.score,
                deliverable: addressValidation.deliverable,
                issues: addressValidation.issues,
                standardized: addressValidation.standardized,
                validated_at: new Date().toISOString()
              } : null,
              duplicate_check: duplicateResult ? {
                confidence: duplicateResult.confidence,
                suggested_action: duplicateResult.suggestedAction,
                matched_records: duplicateResult.matchedRecords.length,
                checked_at: new Date().toISOString()
              } : null,
              completeness_score: completenessResult ? {
                overall: completenessResult.overall,
                grade: completenessResult.grade,
                usability: completenessResult.usabilityScore,
                breakdown: completenessResult.breakdown,
                issues: completenessResult.issues,
                scored_at: new Date().toISOString()
              } : null
            }
          },
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

    if (validRecords.length === 0) {
      return NextResponse.json(
        { error: 'No valid records found to import', details: errors },
        { status: 400 }
      )
    }

    // Insert records in batches and collect inserted IDs for tagging
    const batchSize = 100
    let insertedCount = 0
    const insertedRecordIds: string[] = []
    const effectiveListName = isNewList ? listName : mailingList.name

    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize)
      
      const { data: insertedRecords, error: insertError } = await supabase
        .from('mailing_list_records')
        .insert(batch)
        .select('id')

      if (insertError) {
        console.error('Batch insert error:', insertError)
        return NextResponse.json(
          { error: `Failed to insert records at batch ${Math.floor(i / batchSize) + 1}` },
          { status: 500 }
        )
      }

      if (insertedRecords) {
        insertedRecordIds.push(...insertedRecords.map(r => r.id))
      }

      insertedCount += batch.length
    }

    // Assign required system tags to all imported records
    try {
      // Get the List Name system tag
      const listNameTag = await getSystemTagByName(SYSTEM_TAG_NAMES.LIST_NAME)
      if (listNameTag) {
        await bulkAssignTagToRecords(
          insertedRecordIds,
          listNameTag.id,
          effectiveListName,
          user.id
        )
      }

      // Get and assign Source tag
      const sourceTag = await getSystemTagByName(SYSTEM_TAG_NAMES.SOURCE)
      if (sourceTag) {
        const sourceValue = mailingList.source_type === 'upload' 
          ? 'File Upload' 
          : mailingList.source_type === 'list_builder' 
            ? 'List Builder' 
            : mailingList.source_type === 'manual' 
              ? 'Manual Entry' 
              : 'Import'
              
        await bulkAssignTagToRecords(
          insertedRecordIds,
          sourceTag.id,
          sourceValue,
          user.id
        )
      }
    } catch (tagError) {
      console.error('Error assigning system tags:', tagError)
      // Continue with the import even if tagging fails
    }

    // Update mailing list record count
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

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedCount} records`,
      imported: insertedCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Import spreadsheet error:', error)
    return NextResponse.json(
      { error: 'Failed to import spreadsheet' },
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
    const transformedRow: Record<string, any> = {}
    
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

// Helper function to validate record data
function validateRecord(record: Record<string, any>, emailValidationResults?: Record<string, any>, addressValidation?: any) {
  const errors = []
  
  // At least one name field is required
  if (!record.firstName && !record.lastName) {
    errors.push('First name or last name is required')
  }
  
  // Enhanced email validation if provided
  if (record.email) {
    const emailValidation = emailValidationResults?.[record.email]
    if (emailValidation) {
      // Use advanced email validation results
      if (emailValidation.deliverable === 'invalid') {
        errors.push(`Invalid email: ${emailValidation.issues.join(', ')}`)
      } else if (emailValidation.deliverable === 'risky') {
        // Allow risky emails but could add warning in the future
        console.warn(`Risky email detected: ${record.email} - ${emailValidation.issues.join(', ')}`)
      }
    } else {
      // Fallback to basic email validation
      if (!isValidEmail(record.email)) {
        errors.push('Invalid email format')
      }
    }
  }
  
  // Enhanced address validation if provided
  if (addressValidation) {
    if (addressValidation.deliverable === 'invalid') {
      errors.push(`Invalid address: ${addressValidation.issues.join(', ')}`)
    } else if (addressValidation.deliverable === 'partial') {
      // Allow partial addresses but could add warning in the future
      console.warn(`Partial address match: ${addressValidation.issues.join(', ')}`)
    }
  } else {
    // Fallback to basic ZIP code validation if provided
    if (record.zipCode && !isValidZipCode(record.zipCode)) {
      errors.push('Invalid ZIP code format')
    }
  }
  
  return errors
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidZipCode(zipCode: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/
  return zipRegex.test(zipCode)
}
