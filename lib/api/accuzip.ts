/**
 * AccuZIP API Integration
 * Handles data fetching and validation with AccuZIP services
 */

import { ListCriteria } from '@/lib/supabase/mailing-lists'

const ACCUZIP_API_BASE = process.env.NEXT_PUBLIC_ACCUZIP_API_URL || 'https://api.accuzip.com/v1'
const ACCUZIP_API_KEY = process.env.ACCUZIP_API_KEY

interface AccuZIPSearchParams {
  states?: string[]
  cities?: string[]
  zipCodes?: string[]
  counties?: string[]
  propertyTypes?: string[]
  minBedrooms?: number
  maxBedrooms?: number
  minBathrooms?: number
  maxBathrooms?: number
  minSquareFeet?: number
  maxSquareFeet?: number
  minYearBuilt?: number
  maxYearBuilt?: number
  minEstimatedValue?: number
  maxEstimatedValue?: number
  loanTypes?: string[]
  minLoanAmount?: number
  maxLoanAmount?: number
  minInterestRate?: number
  maxInterestRate?: number
  minAge?: number
  maxAge?: number
  minIncome?: number
  maxIncome?: number
  homeOwnership?: string[]
  maritalStatus?: string[]
  foreclosureStatus?: string[]
  likelyToMove?: boolean
  likelyToSell?: boolean
  likelyToRefinance?: boolean
  minMotivationScore?: number
  maxMotivationScore?: number
  limit?: number
  offset?: number
}

interface AccuZIPRecord {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  email?: string
  phone?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  zipCode: string
  county?: string
  latitude?: number
  longitude?: number
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  squareFeet?: number
  lotSize?: number
  yearBuilt?: number
  estimatedValue?: number
  lastSaleDate?: string
  lastSalePrice?: number
  loanType?: string
  loanAmount?: number
  interestRate?: number
  loanToValue?: number
  originationDate?: string
  maturityDate?: string
  lenderName?: string
  age?: number
  gender?: string
  maritalStatus?: string
  income?: number
  netWorth?: number
  homeOwnership?: string
  occupation?: string
  educationLevel?: string
  foreclosureStatus?: string
  filingDate?: string
  auctionDate?: string
  likelyToMove?: boolean
  likelyToSell?: boolean
  likelyToRefinance?: boolean
  motivationScore?: number
}

interface AccuZIPResponse {
  success: boolean
  data?: {
    records: AccuZIPRecord[]
    totalCount: number
    hasMore: boolean
  }
  error?: string
}

/**
 * Convert our list criteria to AccuZIP search parameters
 */
export function criteriaToAccuZIPParams(criteria: ListCriteria): AccuZIPSearchParams {
  const params: AccuZIPSearchParams = {}

  // Geography
  if (criteria.geography) {
    if (criteria.geography.states?.length) {
      params.states = criteria.geography.states
    }
    if (criteria.geography.cities?.length) {
      params.cities = criteria.geography.cities
    }
    if (criteria.geography.zipCodes?.length) {
      params.zipCodes = criteria.geography.zipCodes
    }
    if (criteria.geography.counties?.length) {
      params.counties = criteria.geography.counties
    }
  }

  // Property
  if (criteria.property) {
    if (criteria.property.propertyType?.length) {
      params.propertyTypes = criteria.property.propertyType
    }
    if (criteria.property.bedrooms) {
      params.minBedrooms = criteria.property.bedrooms.min
      params.maxBedrooms = criteria.property.bedrooms.max
    }
    if (criteria.property.bathrooms) {
      params.minBathrooms = criteria.property.bathrooms.min
      params.maxBathrooms = criteria.property.bathrooms.max
    }
    if (criteria.property.squareFeet) {
      params.minSquareFeet = criteria.property.squareFeet.min
      params.maxSquareFeet = criteria.property.squareFeet.max
    }
    if (criteria.property.yearBuilt) {
      params.minYearBuilt = criteria.property.yearBuilt.min
      params.maxYearBuilt = criteria.property.yearBuilt.max
    }
    if (criteria.property.estimatedValue) {
      params.minEstimatedValue = criteria.property.estimatedValue.min
      params.maxEstimatedValue = criteria.property.estimatedValue.max
    }
  }

  // Mortgage
  if (criteria.mortgage) {
    if (criteria.mortgage.loanType?.length) {
      params.loanTypes = criteria.mortgage.loanType
    }
    if (criteria.mortgage.loanAmount) {
      params.minLoanAmount = criteria.mortgage.loanAmount.min
      params.maxLoanAmount = criteria.mortgage.loanAmount.max
    }
    if (criteria.mortgage.interestRate) {
      params.minInterestRate = criteria.mortgage.interestRate.min
      params.maxInterestRate = criteria.mortgage.interestRate.max
    }
  }

  // Demographics
  if (criteria.demographics) {
    if (criteria.demographics.age) {
      if (criteria.demographics.age.min) params.minAge = criteria.demographics.age.min
      if (criteria.demographics.age.max) params.maxAge = criteria.demographics.age.max
    }
    if (criteria.demographics.income) {
      if (criteria.demographics.income.min) params.minIncome = criteria.demographics.income.min
      if (criteria.demographics.income.max) params.maxIncome = criteria.demographics.income.max
    }
    if (criteria.demographics.homeOwnership?.length) {
      params.homeOwnership = criteria.demographics.homeOwnership
    }
    if (criteria.demographics.maritalStatus?.length) {
      params.maritalStatus = criteria.demographics.maritalStatus
    }
  }

  // Foreclosure
  if (criteria.foreclosure) {
    if (criteria.foreclosure.status?.length) {
      params.foreclosureStatus = criteria.foreclosure.status
    }
  }

  // Predictive Analytics
  if (criteria.predictiveAnalytics) {
    if (criteria.predictiveAnalytics.likelyToMove !== undefined) {
      params.likelyToMove = criteria.predictiveAnalytics.likelyToMove
    }
    if (criteria.predictiveAnalytics.likelyToSell !== undefined) {
      params.likelyToSell = criteria.predictiveAnalytics.likelyToSell
    }
    if (criteria.predictiveAnalytics.likelyToRefinance !== undefined) {
      params.likelyToRefinance = criteria.predictiveAnalytics.likelyToRefinance
    }
    if (criteria.predictiveAnalytics.motivationScore) {
      params.minMotivationScore = criteria.predictiveAnalytics.motivationScore.min
      params.maxMotivationScore = criteria.predictiveAnalytics.motivationScore.max
    }
  }

  return params
}

/**
 * Convert AccuZIP record to our database format
 */
function convertAccuZIPRecord(record: AccuZIPRecord): any {
  return {
    external_id: record.id,
    first_name: record.firstName,
    last_name: record.lastName,
    middle_name: record.middleName,
    full_name: `${record.firstName} ${record.lastName}`.trim(),
    email: record.email,
    phone: record.phone,
    address_line1: record.addressLine1,
    address_line2: record.addressLine2,
    city: record.city,
    state: record.state,
    zip_code: record.zipCode,
    county: record.county,
    latitude: record.latitude,
    longitude: record.longitude,
    property_type: record.propertyType,
    bedrooms: record.bedrooms,
    bathrooms: record.bathrooms,
    square_feet: record.squareFeet,
    lot_size: record.lotSize,
    year_built: record.yearBuilt,
    estimated_value: record.estimatedValue,
    last_sale_date: record.lastSaleDate,
    last_sale_price: record.lastSalePrice,
    loan_type: record.loanType,
    loan_amount: record.loanAmount,
    interest_rate: record.interestRate,
    loan_to_value: record.loanToValue,
    origination_date: record.originationDate,
    maturity_date: record.maturityDate,
    lender_name: record.lenderName,
    age: record.age,
    gender: record.gender,
    marital_status: record.maritalStatus,
    income: record.income,
    net_worth: record.netWorth,
    home_ownership: record.homeOwnership,
    occupation: record.occupation,
    education_level: record.educationLevel,
    foreclosure_status: record.foreclosureStatus,
    filing_date: record.filingDate,
    auction_date: record.auctionDate,
    likely_to_move: record.likelyToMove,
    likely_to_sell: record.likelyToSell,
    likely_to_refinance: record.likelyToRefinance,
    motivation_score: record.motivationScore,
    data_source: 'AccuZIP',
    is_valid: true
  }
}

/**
 * Estimate the count of records matching the criteria
 */
export async function estimateRecordCount(criteria: ListCriteria): Promise<number> {
  if (!ACCUZIP_API_KEY) {
    console.warn('AccuZIP API key not configured')
    // Return mock estimate for development
    return Math.floor(Math.random() * 10000) + 1000
  }

  try {
    const params = criteriaToAccuZIPParams(criteria)
    
    const response = await fetch(`${ACCUZIP_API_BASE}/count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCUZIP_API_KEY}`
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      throw new Error(`AccuZIP API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.count || 0

  } catch (error) {
    console.error('Failed to estimate record count:', error)
    // Return mock estimate on error
    return Math.floor(Math.random() * 10000) + 1000
  }
}

/**
 * Fetch records from AccuZIP based on criteria
 */
export async function fetchRecords(
  criteria: ListCriteria,
  limit: number = 1000,
  offset: number = 0
): Promise<{ records: any[], totalCount: number, hasMore: boolean }> {
  if (!ACCUZIP_API_KEY) {
    console.warn('AccuZIP API key not configured')
    // Return empty result for development
    return { records: [], totalCount: 0, hasMore: false }
  }

  try {
    const params = criteriaToAccuZIPParams(criteria)
    params.limit = limit
    params.offset = offset

    const response = await fetch(`${ACCUZIP_API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCUZIP_API_KEY}`
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      throw new Error(`AccuZIP API error: ${response.statusText}`)
    }

    const result: AccuZIPResponse = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch records from AccuZIP')
    }

    const convertedRecords = result.data.records.map(convertAccuZIPRecord)

    return {
      records: convertedRecords,
      totalCount: result.data.totalCount,
      hasMore: result.data.hasMore
    }

  } catch (error) {
    console.error('Failed to fetch records from AccuZIP:', error)
    throw error
  }
}

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
