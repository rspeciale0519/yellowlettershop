/**
 * Address Validation Service
 * Provides address standardization and validation using USPS/CASS standards
 */

export interface AddressValidationResult {
  isValid: boolean
  standardized: StandardizedAddress
  original: AddressInput
  score: number // 0-100, higher is better
  issues: string[]
  deliverable: 'valid' | 'invalid' | 'partial' | 'unknown'
  details: {
    zipCorrect: boolean
    cityStateMatch: boolean
    streetValid: boolean
    cassCompliant: boolean
    dpvConfirmed: boolean // Delivery Point Validation
  }
}

export interface AddressInput {
  address: string
  city: string
  state: string
  zipCode: string
}

export interface StandardizedAddress {
  address: string
  city: string
  state: string
  zipCode: string
  zip4?: string
  county?: string
  carrierRoute?: string
  deliveryPoint?: string
}

export interface AddressValidationOptions {
  standardizeOnly?: boolean
  requireDPV?: boolean
  allowPOBox?: boolean
  allowRural?: boolean
}

// State abbreviation mapping
const STATE_ABBREVIATIONS: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'district of columbia': 'DC'
}

// Valid state abbreviations
const VALID_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
])

/**
 * Validates and standardizes an address
 */
export async function validateAddress(
  address: AddressInput,
  options: AddressValidationOptions = {}
): Promise<AddressValidationResult> {
  const {
    standardizeOnly = false,
    requireDPV = false,
    allowPOBox = true,
    allowRural = true
  } = options

  const issues: string[] = []
  let score = 100

  // Clean and standardize input
  const cleanAddress = cleanAddressInput(address)
  
  // Basic validation
  const basicValidation = validateBasicAddress(cleanAddress)
  if (!basicValidation.isValid) {
    issues.push(...basicValidation.issues)
    score -= 40
  }

  // State validation and standardization
  const stateResult = validateAndStandardizeState(cleanAddress.state)
  if (!stateResult.isValid) {
    issues.push('Invalid state')
    score -= 20
  }

  // ZIP code validation
  const zipResult = validateZipCode(cleanAddress.zipCode)
  if (!zipResult.isValid) {
    issues.push('Invalid ZIP code format')
    score -= 15
  }

  // Create standardized address
  const standardized: StandardizedAddress = {
    address: standardizeStreetAddress(cleanAddress.address),
    city: standardizeCity(cleanAddress.city),
    state: stateResult.standardized || cleanAddress.state,
    zipCode: zipResult.standardized || cleanAddress.zipCode
  }

  // Check for PO Box if not allowed
  const isPOBox = isPOBoxAddress(standardized.address)
  if (isPOBox && !allowPOBox) {
    issues.push('PO Box addresses not allowed')
    score -= 25
  }

  // In production, this would call AccuZIP or USPS API for full validation
  // For now, simulate CASS validation
  const cassResult = await simulateCassValidation(standardized)
  
  if (!cassResult.valid) {
    issues.push('Address not found in postal database')
    score -= 30
  }

  // DPV validation if required
  let dpvConfirmed = true
  if (requireDPV && !cassResult.dpvConfirmed) {
    issues.push('Address not deliverable (DPV failed)')
    score -= 25
    dpvConfirmed = false
  }

  // Determine deliverable status
  let deliverable: AddressValidationResult['deliverable'] = 'unknown'
  if (score >= 90 && cassResult.valid) {
    deliverable = 'valid'
  } else if (score >= 70) {
    deliverable = 'partial'
  } else {
    deliverable = 'invalid'
  }

  return {
    isValid: score >= 70 && basicValidation.isValid,
    standardized: {
      ...standardized,
      zip4: cassResult.zip4,
      county: cassResult.county,
      carrierRoute: cassResult.carrierRoute,
      deliveryPoint: cassResult.deliveryPoint
    },
    original: address,
    score: Math.max(0, score),
    issues,
    deliverable,
    details: {
      zipCorrect: zipResult.isValid,
      cityStateMatch: cassResult.cityStateMatch,
      streetValid: cassResult.streetValid,
      cassCompliant: cassResult.valid,
      dpvConfirmed
    }
  }
}

/**
 * Clean and normalize address input
 */
function cleanAddressInput(address: AddressInput): AddressInput {
  return {
    address: address.address?.trim() || '',
    city: address.city?.trim() || '',
    state: address.state?.trim().toUpperCase() || '',
    zipCode: address.zipCode?.trim().replace(/[^\d-]/g, '') || ''
  }
}

/**
 * Validate basic address components
 */
function validateBasicAddress(address: AddressInput): { isValid: boolean; issues: string[] } {
  const issues: string[] = []

  if (!address.address) {
    issues.push('Street address is required')
  }

  if (!address.city) {
    issues.push('City is required')
  }

  if (!address.state) {
    issues.push('State is required')
  }

  if (!address.zipCode) {
    issues.push('ZIP code is required')
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * Validate and standardize state
 */
function validateAndStandardizeState(state: string): { isValid: boolean; standardized?: string } {
  if (!state) return { isValid: false }

  const upperState = state.toUpperCase()
  
  // Check if already a valid abbreviation
  if (VALID_STATES.has(upperState)) {
    return { isValid: true, standardized: upperState }
  }

  // Check if it's a full state name
  const lowerState = state.toLowerCase()
  const abbreviation = STATE_ABBREVIATIONS[lowerState]
  if (abbreviation) {
    return { isValid: true, standardized: abbreviation }
  }

  return { isValid: false }
}

/**
 * Validate ZIP code format
 */
function validateZipCode(zipCode: string): { isValid: boolean; standardized?: string } {
  if (!zipCode) return { isValid: false }

  // Remove any non-digit characters except hyphens
  const cleaned = zipCode.replace(/[^\d-]/g, '')
  
  // Check for 5-digit ZIP
  if (/^\d{5}$/.test(cleaned)) {
    return { isValid: true, standardized: cleaned }
  }

  // Check for ZIP+4
  if (/^\d{5}-\d{4}$/.test(cleaned)) {
    return { isValid: true, standardized: cleaned }
  }

  // Check for 9-digit ZIP without hyphen
  if (/^\d{9}$/.test(cleaned)) {
    const formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
    return { isValid: true, standardized: formatted }
  }

  return { isValid: false }
}

/**
 * Standardize street address
 */
function standardizeStreetAddress(address: string): string {
  if (!address) return ''

  let standardized = address.toUpperCase()

  // Common abbreviations
  const abbreviations: Record<string, string> = {
    'STREET': 'ST',
    'AVENUE': 'AVE',
    'BOULEVARD': 'BLVD',
    'DRIVE': 'DR',
    'LANE': 'LN',
    'ROAD': 'RD',
    'COURT': 'CT',
    'PLACE': 'PL',
    'CIRCLE': 'CIR',
    'PARKWAY': 'PKWY',
    'HIGHWAY': 'HWY',
    'APARTMENT': 'APT',
    'SUITE': 'STE',
    'UNIT': 'UNIT',
    'BUILDING': 'BLDG',
    'FLOOR': 'FL'
  }

  // Apply abbreviations
  Object.entries(abbreviations).forEach(([full, abbrev]) => {
    const regex = new RegExp(`\\b${full}\\b`, 'g')
    standardized = standardized.replace(regex, abbrev)
  })

  // Clean up extra spaces
  standardized = standardized.replace(/\s+/g, ' ').trim()

  return standardized
}

/**
 * Standardize city name
 */
function standardizeCity(city: string): string {
  if (!city) return ''

  // Convert to title case
  return city
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Check if address is a PO Box
 */
function isPOBoxAddress(address: string): boolean {
  const poBoxPattern = /\b(P\.?O\.?\s*BOX|POST\s*OFFICE\s*BOX)\b/i
  return poBoxPattern.test(address)
}

/**
 * Simulate CASS validation (in production, use AccuZIP or USPS API)
 */
async function simulateCassValidation(address: StandardizedAddress): Promise<{
  valid: boolean
  cityStateMatch: boolean
  streetValid: boolean
  dpvConfirmed: boolean
  zip4?: string
  county?: string
  carrierRoute?: string
  deliveryPoint?: string
}> {
  // Simulate async validation
  await new Promise(resolve => setTimeout(resolve, 100))

  // Simple validation logic (replace with actual API call)
  const hasValidComponents = address.address && address.city && address.state && address.zipCode
  const stateValid = VALID_STATES.has(address.state)
  const zipValid = /^\d{5}(-\d{4})?$/.test(address.zipCode)

  const valid = Boolean(hasValidComponents && stateValid && zipValid)

  return {
    valid,
    cityStateMatch: stateValid && Boolean(address.city),
    streetValid: Boolean(address.address),
    dpvConfirmed: valid, // Simplified
    zip4: valid ? '1234' : undefined,
    county: valid ? 'Sample County' : undefined,
    carrierRoute: valid ? 'C001' : undefined,
    deliveryPoint: valid ? '12' : undefined
  }
}

/**
 * Batch validate multiple addresses
 */
export async function validateAddressBatch(
  addresses: AddressInput[],
  options: AddressValidationOptions = {}
): Promise<Record<string, AddressValidationResult>> {
  const results: Record<string, AddressValidationResult> = {}
  
  // Process in batches to avoid overwhelming the system
  const batchSize = 10
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize)
    const batchPromises = batch.map((address, index) => {
      const key = `${i + index}`
      return validateAddress(address, options).then(result => ({ key, result }))
    })
    
    const batchResults = await Promise.all(batchPromises)
    batchResults.forEach(({ key, result }) => {
      results[key] = result
    })
  }
  
  return results
}

/**
 * Get validation statistics for a batch of results
 */
export function getAddressValidationStats(results: Record<string, AddressValidationResult>) {
  const total = Object.keys(results).length
  let valid = 0
  let invalid = 0
  let partial = 0
  let cassCompliant = 0
  let dpvConfirmed = 0

  Object.values(results).forEach(result => {
    if (result.deliverable === 'valid') valid++
    else if (result.deliverable === 'invalid') invalid++
    else if (result.deliverable === 'partial') partial++

    if (result.details.cassCompliant) cassCompliant++
    if (result.details.dpvConfirmed) dpvConfirmed++
  })

  return {
    total,
    valid,
    invalid,
    partial,
    cassCompliant,
    dpvConfirmed,
    validPercent: total > 0 ? Math.round((valid / total) * 100) : 0,
    invalidPercent: total > 0 ? Math.round((invalid / total) * 100) : 0,
    partialPercent: total > 0 ? Math.round((partial / total) * 100) : 0,
    cassCompliancePercent: total > 0 ? Math.round((cassCompliant / total) * 100) : 0
  }
}
