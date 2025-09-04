/**
 * Duplicate Detection Service
 * Provides advanced duplicate detection across projects with fuzzy matching
 */

export interface DuplicateDetectionResult {
  isDuplicate: boolean
  confidence: number // 0-100, higher means more confident it's a duplicate
  matchedRecords: DuplicateMatch[]
  reasons: string[]
  suggestedAction: 'merge' | 'skip' | 'review' | 'keep'
}

export interface DuplicateMatch {
  recordId: string
  listId: string
  listName: string
  matchScore: number
  matchFields: string[]
  record: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
  }
}

export interface DuplicateDetectionOptions {
  emailWeight?: number
  phoneWeight?: number
  nameWeight?: number
  addressWeight?: number
  threshold?: number // Minimum confidence to consider duplicate
  fuzzyMatching?: boolean
  crossProject?: boolean
  userId?: string
}

export interface RecordForDuplicateCheck {
  id?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  mailing_list_id?: string
  user_id?: string
}

/**
 * Check for duplicates of a single record
 */
export async function checkForDuplicates(
  record: RecordForDuplicateCheck,
  existingRecords: RecordForDuplicateCheck[],
  options: DuplicateDetectionOptions = {}
): Promise<DuplicateDetectionResult> {
  const {
    emailWeight = 40,
    phoneWeight = 30,
    nameWeight = 20,
    addressWeight = 10,
    threshold = 75,
    fuzzyMatching = true
  } = options

  const matches: DuplicateMatch[] = []
  const reasons: string[] = []

  for (const existingRecord of existingRecords) {
    // Skip self-comparison
    if (record.id && existingRecord.id === record.id) {
      continue
    }

    const matchResult = calculateMatchScore(record, existingRecord, {
      emailWeight,
      phoneWeight,
      nameWeight,
      addressWeight,
      fuzzyMatching
    })

    if (matchResult.score >= threshold) {
      matches.push({
        recordId: existingRecord.id || '',
        listId: existingRecord.mailing_list_id || '',
        listName: '', // Would be populated from database
        matchScore: matchResult.score,
        matchFields: matchResult.matchedFields,
        record: {
          firstName: existingRecord.firstName,
          lastName: existingRecord.lastName,
          email: existingRecord.email,
          phone: existingRecord.phone,
          address: existingRecord.address,
          city: existingRecord.city,
          state: existingRecord.state,
          zipCode: existingRecord.zipCode
        }
      })

      reasons.push(...matchResult.reasons)
    }
  }

  // Determine confidence and suggested action
  const highestMatch = matches.length > 0 ? Math.max(...matches.map(m => m.matchScore)) : 0
  const suggestedAction = determineSuggestedAction(highestMatch, matches.length)

  return {
    isDuplicate: matches.length > 0,
    confidence: highestMatch,
    matchedRecords: matches.sort((a, b) => b.matchScore - a.matchScore),
    reasons: [...new Set(reasons)], // Remove duplicates
    suggestedAction
  }
}

/**
 * Calculate match score between two records
 */
function calculateMatchScore(
  record1: RecordForDuplicateCheck,
  record2: RecordForDuplicateCheck,
  weights: {
    emailWeight: number
    phoneWeight: number
    nameWeight: number
    addressWeight: number
    fuzzyMatching: boolean
  }
): { score: number; matchedFields: string[]; reasons: string[] } {
  let totalScore = 0
  const matchedFields: string[] = []
  const reasons: string[] = []

  // Email matching (exact match required)
  if (record1.email && record2.email) {
    if (normalizeEmail(record1.email) === normalizeEmail(record2.email)) {
      totalScore += weights.emailWeight
      matchedFields.push('email')
      reasons.push('Exact email match')
    }
  }

  // Phone matching (normalized)
  if (record1.phone && record2.phone) {
    const phone1 = normalizePhone(record1.phone)
    const phone2 = normalizePhone(record2.phone)
    if (phone1 && phone2 && phone1 === phone2) {
      totalScore += weights.phoneWeight
      matchedFields.push('phone')
      reasons.push('Exact phone match')
    }
  }

  // Name matching (fuzzy or exact)
  const nameScore = calculateNameScore(record1, record2, weights.fuzzyMatching)
  if (nameScore > 0) {
    totalScore += (nameScore / 100) * weights.nameWeight
    matchedFields.push('name')
    if (nameScore === 100) {
      reasons.push('Exact name match')
    } else {
      reasons.push(`Similar name match (${nameScore}% similarity)`)
    }
  }

  // Address matching (fuzzy or exact)
  const addressScore = calculateAddressScore(record1, record2, weights.fuzzyMatching)
  if (addressScore > 0) {
    totalScore += (addressScore / 100) * weights.addressWeight
    matchedFields.push('address')
    if (addressScore === 100) {
      reasons.push('Exact address match')
    } else {
      reasons.push(`Similar address match (${addressScore}% similarity)`)
    }
  }

  return {
    score: Math.round(totalScore),
    matchedFields,
    reasons
  }
}

/**
 * Calculate name similarity score
 */
function calculateNameScore(
  record1: RecordForDuplicateCheck,
  record2: RecordForDuplicateCheck,
  fuzzyMatching: boolean
): number {
  const name1 = `${record1.firstName || ''} ${record1.lastName || ''}`.trim().toLowerCase()
  const name2 = `${record2.firstName || ''} ${record2.lastName || ''}`.trim().toLowerCase()

  if (!name1 || !name2) return 0

  // Exact match
  if (name1 === name2) return 100

  if (!fuzzyMatching) return 0

  // Check individual name components
  const firstName1 = (record1.firstName || '').toLowerCase()
  const lastName1 = (record1.lastName || '').toLowerCase()
  const firstName2 = (record2.firstName || '').toLowerCase()
  const lastName2 = (record2.lastName || '').toLowerCase()

  let componentMatches = 0
  let totalComponents = 0

  // First name comparison
  if (firstName1 && firstName2) {
    totalComponents++
    if (firstName1 === firstName2) {
      componentMatches++
    } else if (calculateStringSimilarity(firstName1, firstName2) > 0.8) {
      componentMatches += 0.8
    }
  }

  // Last name comparison
  if (lastName1 && lastName2) {
    totalComponents++
    if (lastName1 === lastName2) {
      componentMatches++
    } else if (calculateStringSimilarity(lastName1, lastName2) > 0.8) {
      componentMatches += 0.8
    }
  }

  if (totalComponents === 0) return 0

  const componentScore = (componentMatches / totalComponents) * 100

  // Also check full name similarity
  const fullNameSimilarity = calculateStringSimilarity(name1, name2) * 100

  // Return the higher of the two scores
  return Math.round(Math.max(componentScore, fullNameSimilarity))
}

/**
 * Calculate address similarity score
 */
function calculateAddressScore(
  record1: RecordForDuplicateCheck,
  record2: RecordForDuplicateCheck,
  fuzzyMatching: boolean
): number {
  // Check ZIP code first (most reliable)
  const zip1 = normalizeZip(record1.zipCode)
  const zip2 = normalizeZip(record2.zipCode)
  
  if (!zip1 || !zip2) return 0
  
  // Different ZIP codes = no address match
  if (zip1 !== zip2) return 0

  let score = 20 // Base score for same ZIP

  // City comparison
  const city1 = (record1.city || '').toLowerCase().trim()
  const city2 = (record2.city || '').toLowerCase().trim()
  
  if (city1 && city2) {
    if (city1 === city2) {
      score += 20
    } else if (fuzzyMatching && calculateStringSimilarity(city1, city2) > 0.8) {
      score += 15
    }
  }

  // State comparison
  const state1 = (record1.state || '').toUpperCase().trim()
  const state2 = (record2.state || '').toUpperCase().trim()
  
  if (state1 && state2 && state1 === state2) {
    score += 20
  }

  // Street address comparison
  const addr1 = normalizeAddress(record1.address || '')
  const addr2 = normalizeAddress(record2.address || '')
  
  if (addr1 && addr2) {
    if (addr1 === addr2) {
      score += 40
    } else if (fuzzyMatching && calculateStringSimilarity(addr1, addr2) > 0.8) {
      score += 30
    }
  }

  return Math.min(100, score)
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1
  if (str1.length === 0 || str2.length === 0) return 0

  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }

  const distance = matrix[str2.length][str1.length]
  const maxLength = Math.max(str1.length, str2.length)
  
  return (maxLength - distance) / maxLength
}

/**
 * Normalize email for comparison
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Normalize phone for comparison
 */
function normalizePhone(phone: string): string | null {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Must be 10 or 11 digits
  if (digits.length === 10) {
    return digits
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return digits.substring(1)
  }
  
  return null
}

/**
 * Normalize ZIP code for comparison
 */
function normalizeZip(zip?: string): string | null {
  if (!zip) return null
  
  const cleaned = zip.replace(/\D/g, '')
  
  if (cleaned.length >= 5) {
    return cleaned.substring(0, 5)
  }
  
  return null
}

/**
 * Normalize address for comparison
 */
function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/\b(street|st|avenue|ave|boulevard|blvd|drive|dr|lane|ln|road|rd|court|ct|place|pl)\b/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Determine suggested action based on match score
 */
function determineSuggestedAction(
  highestScore: number,
  matchCount: number
): 'merge' | 'skip' | 'review' | 'keep' {
  if (highestScore >= 95) {
    return 'skip' // Very high confidence duplicate
  } else if (highestScore >= 85) {
    return 'merge' // High confidence, suggest merge
  } else if (highestScore >= 75) {
    return 'review' // Medium confidence, needs review
  } else {
    return 'keep' // Low confidence, probably not duplicate
  }
}

/**
 * Batch duplicate detection for multiple records
 */
export async function batchDuplicateDetection(
  newRecords: RecordForDuplicateCheck[],
  existingRecords: RecordForDuplicateCheck[],
  options: DuplicateDetectionOptions = {}
): Promise<Record<string, DuplicateDetectionResult>> {
  const results: Record<string, DuplicateDetectionResult> = {}
  
  for (let i = 0; i < newRecords.length; i++) {
    const record = newRecords[i]
    const key = record.id || i.toString()
    
    // Check against existing records and previously processed new records
    const recordsToCheck = [
      ...existingRecords,
      ...newRecords.slice(0, i) // Check against previously processed records in this batch
    ]
    
    results[key] = await checkForDuplicates(record, recordsToCheck, options)
  }
  
  return results
}

/**
 * Get duplicate detection statistics
 */
export function getDuplicateStats(results: Record<string, DuplicateDetectionResult>) {
  const total = Object.keys(results).length
  let duplicates = 0
  let highConfidence = 0
  let mediumConfidence = 0
  let lowConfidence = 0
  
  const actionCounts = {
    skip: 0,
    merge: 0,
    review: 0,
    keep: 0
  }

  Object.values(results).forEach(result => {
    if (result.isDuplicate) {
      duplicates++
      
      if (result.confidence >= 90) {
        highConfidence++
      } else if (result.confidence >= 80) {
        mediumConfidence++
      } else {
        lowConfidence++
      }
    }
    
    actionCounts[result.suggestedAction]++
  })

  return {
    total,
    duplicates,
    unique: total - duplicates,
    duplicatePercent: total > 0 ? Math.round((duplicates / total) * 100) : 0,
    confidence: {
      high: highConfidence,
      medium: mediumConfidence,
      low: lowConfidence
    },
    suggestedActions: actionCounts
  }
}
