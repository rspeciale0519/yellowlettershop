import { NextRequest, NextResponse } from 'next/server'
import { validateEmail, validateEmailBatch, getValidationStats } from '@/lib/validation/email-validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, emails, options = {} } = body

    // Single email validation
    if (email && typeof email === 'string') {
      const result = await validateEmail(email, options)
      return NextResponse.json({ success: true, result })
    }

    // Batch email validation
    if (emails && Array.isArray(emails)) {
      if (emails.length > 1000) {
        return NextResponse.json(
          { error: 'Maximum 1000 emails per batch' },
          { status: 400 }
        )
      }

      const results = await validateEmailBatch(emails, options)
      const stats = getValidationStats(results)
      
      return NextResponse.json({ 
        success: true, 
        results,
        stats
      })
    }

    return NextResponse.json(
      { error: 'Either email or emails array is required' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Email validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate email(s)' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter is required' },
      { status: 400 }
    )
  }

  try {
    const result = await validateEmail(email)
    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Email validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate email' },
      { status: 500 }
    )
  }
}
