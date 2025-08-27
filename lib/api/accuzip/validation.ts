// AccuZIP validation utilities
const ACCUZIP_API_BASE = process.env.NEXT_PUBLIC_ACCUZIP_API_URL || 'https://api.accuzip.com/v1'
const ACCUZIP_API_KEY = process.env.ACCUZIP_API_KEY

/**
 * Validate an address with AccuZIP
 */
export async function validateAddress(address: {
  line1: string
  line2?: string
  city: string
  state: string
  zip: string
}): Promise<{
  valid: boolean
  standardized?: {
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
    plus4?: string
  }
  errors?: string[]
}> {
  if (!ACCUZIP_API_KEY) {
    console.warn('AccuZIP API key not configured')
    return { valid: true } // Skip validation in development
  }

  try {
    const response = await fetch(`${ACCUZIP_API_BASE}/validate/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCUZIP_API_KEY}`
      },
      body: JSON.stringify(address)
    })

    if (!response.ok) {
      throw new Error(`AccuZIP API error: ${response.statusText}`)
    }

    const result = await response.json()
    return result

  } catch (error) {
    console.error('Failed to validate address:', error)
    return { valid: false, errors: ['Validation service unavailable'] }
  }
}

/**
 * Batch validate multiple records
 */
export async function batchValidateRecords(
  records: any[],
  validationType: 'address' | 'phone' | 'email' = 'address'
): Promise<Array<{ recordId: string, valid: boolean, errors?: string[] }>> {
  if (!ACCUZIP_API_KEY) {
    console.warn('AccuZIP API key not configured')
    // Return all as valid in development
    return records.map(r => ({ recordId: r.id, valid: true }))
  }

  try {
    const response = await fetch(`${ACCUZIP_API_BASE}/validate/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCUZIP_API_KEY}`
      },
      body: JSON.stringify({
        records,
        validationType
      })
    })

    if (!response.ok) {
      throw new Error(`AccuZIP API error: ${response.statusText}`)
    }

    const result = await response.json()
    return result.validations

  } catch (error) {
    console.error('Failed to batch validate records:', error)
    // Return all as invalid on error
    return records.map(r => ({ 
      recordId: r.id, 
      valid: false, 
      errors: ['Validation service unavailable'] 
    }))
  }
}
