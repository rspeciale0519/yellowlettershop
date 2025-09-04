import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { checkForDuplicates, batchDuplicateDetection, getDuplicateStats } from '@/lib/validation/duplicate-detection'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { record, records, options = {} } = body

    const supabase = createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Single record duplicate check
    if (record && typeof record === 'object') {
      // Get existing records for comparison
      const { data: existingRecords, error: fetchError } = await supabase
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

      if (fetchError) {
        console.error('Error fetching existing records:', fetchError)
        return NextResponse.json(
          { error: 'Failed to fetch existing records' },
          { status: 500 }
        )
      }

      const result = await checkForDuplicates(record, existingRecords || [], {
        ...options,
        userId: user.id
      })
      
      return NextResponse.json({ success: true, result })
    }

    // Batch duplicate detection
    if (records && Array.isArray(records)) {
      if (records.length > 1000) {
        return NextResponse.json(
          { error: 'Maximum 1000 records per batch' },
          { status: 400 }
        )
      }

      // Get existing records for comparison
      const { data: existingRecords, error: fetchError } = await supabase
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

      if (fetchError) {
        console.error('Error fetching existing records:', fetchError)
        return NextResponse.json(
          { error: 'Failed to fetch existing records' },
          { status: 500 }
        )
      }

      const results = await batchDuplicateDetection(records, existingRecords || [], {
        ...options,
        userId: user.id
      })
      const stats = getDuplicateStats(results)
      
      return NextResponse.json({ 
        success: true, 
        results,
        stats
      })
    }

    return NextResponse.json(
      { error: 'Either record or records array is required' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Duplicate detection error:', error)
    return NextResponse.json(
      { error: 'Failed to check for duplicates' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const phone = searchParams.get('phone')
  const firstName = searchParams.get('firstName')
  const lastName = searchParams.get('lastName')

  if (!email && !phone && !firstName && !lastName) {
    return NextResponse.json(
      { error: 'At least one search parameter is required' },
      { status: 400 }
    )
  }

  try {
    const supabase = createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const record = {
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || '',
      phone: phone || ''
    }

    // Get existing records for comparison
    const { data: existingRecords, error: fetchError } = await supabase
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

    if (fetchError) {
      console.error('Error fetching existing records:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch existing records' },
        { status: 500 }
      )
    }

    const result = await checkForDuplicates(record, existingRecords || [], {
      userId: user.id
    })
    
    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Duplicate detection error:', error)
    return NextResponse.json(
      { error: 'Failed to check for duplicates' },
      { status: 500 }
    )
  }
}
