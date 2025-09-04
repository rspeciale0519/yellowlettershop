/**
 * Data Completeness Scoring System
 * Provides comprehensive scoring and analysis of record completeness
 */

export interface CompletenessScore {
  overall: number // 0-100, overall completeness score
  breakdown: {
    contact: number // Name and contact info completeness
    address: number // Address completeness
    validation: number // Data validation quality
    enrichment: number // Additional data richness
  }
  issues: CompletenessIssue[]
  suggestions: string[]
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  usabilityScore: number // How usable is this record for campaigns
}

export interface CompletenessIssue {
  field: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  impact: string
}

export interface RecordForScoring {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  additional_data?: {
    email_validation?: {
      score: number
      deliverable: string
      issues: string[]
    }
    address_validation?: {
      score: number
      deliverable: string
      issues: string[]
    }
    [key: string]: any
  }
}

export interface CompletenessOptions {
  requireEmail?: boolean
  requirePhone?: boolean
  requireAddress?: boolean
  weightings?: {
    name: number
    email: number
    phone: number
    address: number
    validation: number
  }
}

/**
 * Calculate completeness score for a single record
 */
export function calculateCompletenessScore(
  record: RecordForScoring,
  options: CompletenessOptions = {}
): CompletenessScore {
  const {
    requireEmail = false,
    requirePhone = false,
    requireAddress = false,
    weightings = {
      name: 25,
      email: 25,
      phone: 20,
      address: 20,
      validation: 10
    }
  } = options

  const issues: CompletenessIssue[] = []
  const suggestions: string[] = []

  // Calculate individual component scores
  const nameScore = calculateNameScore(record, issues, suggestions)
  const emailScore = calculateEmailScore(record, issues, suggestions, requireEmail)
  const phoneScore = calculatePhoneScore(record, issues, suggestions, requirePhone)
  const addressScore = calculateAddressScore(record, issues, suggestions, requireAddress)
  const validationScore = calculateValidationScore(record, issues, suggestions)

  // Calculate weighted overall score
  const overall = Math.round(
    (nameScore * weightings.name +
     emailScore * weightings.email +
     phoneScore * weightings.phone +
     addressScore * weightings.address +
     validationScore * weightings.validation) / 100
  )

  // Calculate breakdown scores
  const breakdown = {
    contact: Math.round((nameScore + emailScore + phoneScore) / 3),
    address: addressScore,
    validation: validationScore,
    enrichment: calculateEnrichmentScore(record)
  }

  // Determine grade
  const grade = determineGrade(overall)

  // Calculate usability score (how useful for campaigns)
  const usabilityScore = calculateUsabilityScore(record, breakdown)

  return {
    overall,
    breakdown,
    issues: issues.sort((a, b) => getSeverityWeight(b.severity) - getSeverityWeight(a.severity)),
    suggestions,
    grade,
    usabilityScore
  }
}

/**
 * Calculate name completeness score
 */
function calculateNameScore(
  record: RecordForScoring,
  issues: CompletenessIssue[],
  suggestions: string[]
): number {
  let score = 0
  const hasFirstName = Boolean(record.firstName?.trim())
  const hasLastName = Boolean(record.lastName?.trim())

  if (hasFirstName && hasLastName) {
    score = 100
  } else if (hasFirstName || hasLastName) {
    score = 60
    const missingField = hasFirstName ? 'lastName' : 'firstName'
    issues.push({
      field: missingField,
      severity: 'warning',
      message: `Missing ${missingField === 'firstName' ? 'first' : 'last'} name`,
      impact: 'Reduces personalization options for campaigns'
    })
    suggestions.push(`Add ${missingField === 'firstName' ? 'first' : 'last'} name for better personalization`)
  } else {
    score = 0
    issues.push({
      field: 'name',
      severity: 'critical',
      message: 'No name information provided',
      impact: 'Record cannot be used for personalized campaigns'
    })
    suggestions.push('Add at least first or last name')
  }

  // Check name quality
  if (hasFirstName && record.firstName) {
    if (record.firstName.length < 2) {
      score -= 10
      issues.push({
        field: 'firstName',
        severity: 'warning',
        message: 'First name appears too short',
        impact: 'May indicate data quality issues'
      })
    }
    if (/^\d+$/.test(record.firstName || '')) {
      score -= 20
      issues.push({
        field: 'firstName',
        severity: 'warning',
        message: 'First name contains only numbers',
        impact: 'Likely invalid name data'
      })
    }
  }

  if (hasLastName && record.lastName) {
    if (record.lastName.length < 2) {
      score -= 10
      issues.push({
        field: 'lastName',
        severity: 'warning',
        message: 'Last name appears too short',
        impact: 'May indicate data quality issues'
      })
    }
    if (/^\d+$/.test(record.lastName || '')) {
      score -= 20
      issues.push({
        field: 'lastName',
        severity: 'warning',
        message: 'Last name contains only numbers',
        impact: 'Likely invalid name data'
      })
    }
  }

  return Math.max(0, score)
}

/**
 * Calculate email completeness score
 */
function calculateEmailScore(
  record: RecordForScoring,
  issues: CompletenessIssue[],
  suggestions: string[],
  required: boolean
): number {
  const hasEmail = Boolean(record.email?.trim())
  
  if (!hasEmail) {
    if (required) {
      issues.push({
        field: 'email',
        severity: 'critical',
        message: 'Email address is required but missing',
        impact: 'Cannot send email campaigns to this contact'
      })
      return 0
    } else {
      issues.push({
        field: 'email',
        severity: 'info',
        message: 'No email address provided',
        impact: 'Limits digital marketing options'
      })
      suggestions.push('Add email address for digital marketing campaigns')
      return 30 // Partial score for optional field
    }
  }

  let score = 70 // Base score for having an email

  // Check email validation results
  const emailValidation = record.additional_data?.email_validation
  if (emailValidation) {
    if (emailValidation.deliverable === 'valid') {
      score = 100
    } else if (emailValidation.deliverable === 'risky') {
      score = 80
      issues.push({
        field: 'email',
        severity: 'warning',
        message: 'Email address has quality concerns',
        impact: 'May have lower deliverability rates'
      })
    } else if (emailValidation.deliverable === 'invalid') {
      score = 20
      issues.push({
        field: 'email',
        severity: 'critical',
        message: 'Email address is invalid',
        impact: 'Cannot be used for email campaigns'
      })
      suggestions.push('Verify and correct email address')
    }
  } else {
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(record.email || '')) {
      score = 20
      issues.push({
        field: 'email',
        severity: 'critical',
        message: 'Email address format is invalid',
        impact: 'Cannot be used for email campaigns'
      })
      suggestions.push('Correct email address format')
    }
  }

  return score
}

/**
 * Calculate phone completeness score
 */
function calculatePhoneScore(
  record: RecordForScoring,
  issues: CompletenessIssue[],
  suggestions: string[],
  required: boolean
): number {
  const hasPhone = Boolean(record.phone?.trim())
  
  if (!hasPhone) {
    if (required) {
      issues.push({
        field: 'phone',
        severity: 'critical',
        message: 'Phone number is required but missing',
        impact: 'Cannot use for SMS or phone campaigns'
      })
      return 0
    } else {
      issues.push({
        field: 'phone',
        severity: 'info',
        message: 'No phone number provided',
        impact: 'Limits SMS and phone marketing options'
      })
      suggestions.push('Add phone number for SMS and phone campaigns')
      return 30 // Partial score for optional field
    }
  }

  let score = 70 // Base score for having a phone

  // Validate phone format
  const phoneDigits = (record.phone || '').replace(/\D/g, '')
  if (phoneDigits.length === 10) {
    score = 100
  } else if (phoneDigits.length === 11 && phoneDigits.startsWith('1')) {
    score = 100
  } else if (phoneDigits.length < 10) {
    score = 30
    issues.push({
      field: 'phone',
      severity: 'warning',
      message: 'Phone number appears incomplete',
      impact: 'May not be usable for phone/SMS campaigns'
    })
    suggestions.push('Verify phone number is complete')
  } else {
    score = 50
    issues.push({
      field: 'phone',
      severity: 'warning',
      message: 'Phone number format is unusual',
      impact: 'May need verification before use'
    })
  }

  return score
}

/**
 * Calculate address completeness score
 */
function calculateAddressScore(
  record: RecordForScoring,
  issues: CompletenessIssue[],
  suggestions: string[],
  required: boolean
): number {
  const hasAddress = Boolean(record.address?.trim())
  const hasCity = Boolean(record.city?.trim())
  const hasState = Boolean(record.state?.trim())
  const hasZip = Boolean(record.zipCode?.trim())

  const addressComponents = [hasAddress, hasCity, hasState, hasZip]
  const completedComponents = addressComponents.filter(Boolean).length

  if (completedComponents === 0) {
    if (required) {
      issues.push({
        field: 'address',
        severity: 'critical',
        message: 'Address information is required but missing',
        impact: 'Cannot use for direct mail campaigns'
      })
      return 0
    } else {
      issues.push({
        field: 'address',
        severity: 'info',
        message: 'No address information provided',
        impact: 'Cannot use for direct mail campaigns'
      })
      suggestions.push('Add address information for direct mail campaigns')
      return 20 // Minimal score for optional field
    }
  }

  let score = (completedComponents / 4) * 80 // Base score based on completeness

  // Check individual components
  if (!hasAddress) {
    issues.push({
      field: 'address',
      severity: 'warning',
      message: 'Street address is missing',
      impact: 'Required for direct mail delivery'
    })
  }

  if (!hasCity) {
    issues.push({
      field: 'city',
      severity: 'warning',
      message: 'City is missing',
      impact: 'Required for proper mail delivery'
    })
  }

  if (!hasState) {
    issues.push({
      field: 'state',
      severity: 'warning',
      message: 'State is missing',
      impact: 'Required for proper mail delivery'
    })
  }

  if (!hasZip) {
    issues.push({
      field: 'zipCode',
      severity: 'warning',
      message: 'ZIP code is missing',
      impact: 'Required for postal sorting and delivery'
    })
  }

  // Check address validation results
  const addressValidation = record.additional_data?.address_validation
  if (addressValidation && completedComponents === 4) {
    if (addressValidation.deliverable === 'valid') {
      score = 100
    } else if (addressValidation.deliverable === 'partial') {
      score = Math.max(score, 75)
      issues.push({
        field: 'address',
        severity: 'warning',
        message: 'Address validation shows partial match',
        impact: 'May have delivery issues'
      })
    } else if (addressValidation.deliverable === 'invalid') {
      score = Math.min(score, 40)
      issues.push({
        field: 'address',
        severity: 'critical',
        message: 'Address validation failed',
        impact: 'Mail may not be deliverable'
      })
      suggestions.push('Verify and correct address information')
    }
  }

  return Math.round(score)
}

/**
 * Calculate validation quality score
 */
function calculateValidationScore(
  record: RecordForScoring,
  issues: CompletenessIssue[],
  suggestions: string[]
): number {
  let score = 50 // Base score

  const emailValidation = record.additional_data?.email_validation
  const addressValidation = record.additional_data?.address_validation

  if (emailValidation) {
    score += 25
    if (emailValidation.score >= 80) {
      score += 15
    } else if (emailValidation.score >= 60) {
      score += 10
    }
  }

  if (addressValidation) {
    score += 25
    if (addressValidation.score >= 80) {
      score += 15
    } else if (addressValidation.score >= 60) {
      score += 10
    }
  }

  if (!emailValidation && !addressValidation) {
    suggestions.push('Run validation checks to improve data quality')
  }

  return Math.min(100, score)
}

/**
 * Calculate enrichment score (additional data richness)
 */
function calculateEnrichmentScore(record: RecordForScoring): number {
  let score = 0
  const additionalData = record.additional_data || {}

  // Count additional data fields
  const enrichmentFields = Object.keys(additionalData).filter(
    key => !['email_validation', 'address_validation', 'duplicate_check'].includes(key)
  )

  score += enrichmentFields.length * 20

  return Math.min(100, score)
}

/**
 * Calculate usability score for campaigns
 */
function calculateUsabilityScore(record: RecordForScoring, breakdown: any): number {
  let score = 0

  // Name is essential for personalization
  if (record.firstName || record.lastName) {
    score += 30
  }

  // Email enables digital campaigns
  if (record.email && breakdown.validation >= 70) {
    score += 35
  }

  // Address enables direct mail
  if (record.address && record.city && record.state && record.zipCode) {
    score += 25
  }

  // Phone enables SMS/calling
  if (record.phone) {
    score += 10
  }

  return Math.min(100, score)
}

/**
 * Determine letter grade based on overall score
 */
function determineGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

/**
 * Get severity weight for sorting
 */
function getSeverityWeight(severity: string): number {
  switch (severity) {
    case 'critical': return 3
    case 'warning': return 2
    case 'info': return 1
    default: return 0
  }
}

/**
 * Batch calculate completeness scores
 */
export function batchCalculateCompleteness(
  records: RecordForScoring[],
  options: CompletenessOptions = {}
): Record<string, CompletenessScore> {
  const results: Record<string, CompletenessScore> = {}
  
  records.forEach((record, index) => {
    const key = index.toString()
    results[key] = calculateCompletenessScore(record, options)
  })
  
  return results
}

/**
 * Get completeness statistics for a batch of results
 */
export function getCompletenessStats(results: Record<string, CompletenessScore>) {
  const total = Object.keys(results).length
  const scores = Object.values(results)
  
  const gradeCount = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  let totalScore = 0
  let totalUsability = 0
  
  const issueCount = {
    critical: 0,
    warning: 0,
    info: 0
  }

  scores.forEach(score => {
    gradeCount[score.grade]++
    totalScore += score.overall
    totalUsability += score.usabilityScore
    
    score.issues.forEach(issue => {
      issueCount[issue.severity]++
    })
  })

  return {
    total,
    averageScore: total > 0 ? Math.round(totalScore / total) : 0,
    averageUsability: total > 0 ? Math.round(totalUsability / total) : 0,
    gradeDistribution: gradeCount,
    issueDistribution: issueCount,
    qualityPercent: total > 0 ? Math.round(((gradeCount.A + gradeCount.B) / total) * 100) : 0
  }
}
