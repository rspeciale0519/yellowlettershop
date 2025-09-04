import { NextRequest, NextResponse } from 'next/server'
import { validateAddress, validateAddressBatch, getAddressValidationStats } from '@/lib/validation/address-validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, addresses, options = {} } = body

    // Single address validation
    if (address && typeof address === 'object') {
      const result = await validateAddress(address, options)
      return NextResponse.json({ success: true, result })
    }

    // Batch address validation
    if (addresses && Array.isArray(addresses)) {
      if (addresses.length > 500) {
        return NextResponse.json(
          { error: 'Maximum 500 addresses per batch' },
          { status: 400 }
        )
      }

      const results = await validateAddressBatch(addresses, options)
      const stats = getAddressValidationStats(results)
      
      return NextResponse.json({ 
        success: true, 
        results,
        stats
      })
    }

    return NextResponse.json(
      { error: 'Either address or addresses array is required' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Address validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate address(es)' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const city = searchParams.get('city')
  const state = searchParams.get('state')
  const zipCode = searchParams.get('zipCode')

  if (!address || !city || !state || !zipCode) {
    return NextResponse.json(
      { error: 'Address, city, state, and zipCode parameters are required' },
      { status: 400 }
    )
  }

  try {
    const result = await validateAddress({ address, city, state, zipCode })
    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Address validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate address' },
      { status: 500 }
    )
  }
}
