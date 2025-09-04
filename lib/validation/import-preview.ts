/**
 * Import Preview System
 * Provides comprehensive preview and error flagging before import
 */

export interface ImportPreview {
  summary: ImportSummary
  records: PreviewRecord[]
  issues: ImportIssue[]
  recommendations: string[]
  canProceed: boolean
  estimatedTime: number // seconds
}

export interface ImportSummary {
  totalRecords: number
  validRecords: number
  errorRecords: number
  warningRecords: number
  duplicateRecords: number
  qualityScore: number // 0-100
  breakdown: {
    hasName: number
    hasEmail: number
    hasPhone: number
    hasAddress: number
    emailValid: number
    addressValid: number
  }
}

export interface PreviewRecord {
  rowNumber: number
  data: Record<string, string>
  status: 'valid' | 'warning' | 'error'
  issues: RecordIssue[]
  completenessScore: number
  duplicateInfo?: {
    confidence: number
    matchedRecords: number
    suggestedAction: string
  }
}

export interface RecordIssue {
  field: string
  type: 'error' | 'warning' | 'info'
  message: string
  suggestion?: string
}

export interface ImportIssue {
  type: 'critical' | 'warning' | 'info'
  category: 'validation' | 'duplicates' | 'format' | 'completeness'
  message: string
  affectedRecords: number
  suggestion: string
}

export interface PreviewOptions {
  maxPreviewRecords?: number
  includeValidationDetails?: boolean
  checkDuplicates?: boolean
  requireEmail?: boolean
  requirePhone?: boolean
  requireAddress?: boolean
}

/**
 * Generate import preview with comprehensive analysis
 */
export async function generateImportPreview(
  headers: string[],
  rows: string[][],
  columnMappings: Record<string, string>,
  options: PreviewOptions = {}
): Promise<ImportPreview> {
  const {
    maxPreviewRecords = 100,
    includeValidationDetails = true,
    checkDuplicates = true,
    requireEmail = false,
    requirePhone = false,
    requireAddress = false
  } = options

  // Transform data based on column mappings
  const transformedRecords = transformDataWithMappings(headers, rows, columnMappings)
  
  // Initialize counters and collections
  const issues: ImportIssue[] = []
  const records: PreviewRecord[] = []
  let validCount = 0
  let errorCount = 0
  let warningCount = 0
  let duplicateCount = 0
  
  const breakdown = {
    hasName: 0,
    hasEmail: 0,
    hasPhone: 0,
    hasAddress: 0,
    emailValid: 0,
    addressValid: 0
  }

  // Analyze each record (limit for preview)
  const recordsToAnalyze = transformedRecords.slice(0, maxPreviewRecords)
  
  for (let i = 0; i < recordsToAnalyze.length; i++) {
    const record = recordsToAnalyze[i]
    const rowNumber = i + 2 // +2 for header and 1-based indexing
    
    const recordIssues: RecordIssue[] = []
    let recordStatus: 'valid' | 'warning' | 'error' = 'valid'
    
    // Validate required fields
    if (!record.firstName && !record.lastName) {
      recordIssues.push({
        field: 'name',
        type: 'error',
        message: 'Missing both first and last name',
        suggestion: 'Add at least first or last name'
      })
      recordStatus = 'error'
    } else {
      breakdown.hasName++
    }

    // Email validation
    if (record.email) {
      breakdown.hasEmail++
      if (includeValidationDetails) {
        const emailIssues = validateEmailField(record.email)
        recordIssues.push(...emailIssues)
        if (emailIssues.some(issue => issue.type === 'error')) {
          recordStatus = 'error'
        } else if (emailIssues.some(issue => issue.type === 'warning')) {
          recordStatus = recordStatus === 'valid' ? 'warning' : recordStatus
        } else {
          breakdown.emailValid++
        }
      }
    } else if (requireEmail) {
      recordIssues.push({
        field: 'email',
        type: 'error',
        message: 'Email is required but missing',
        suggestion: 'Add email address'
      })
      recordStatus = 'error'
    }

    // Phone validation
    if (record.phone) {
      breakdown.hasPhone++
      if (includeValidationDetails) {
        const phoneIssues = validatePhoneField(record.phone)
        recordIssues.push(...phoneIssues)
        if (phoneIssues.some(issue => issue.type === 'error')) {
          recordStatus = 'error'
        } else if (phoneIssues.some(issue => issue.type === 'warning')) {
          recordStatus = recordStatus === 'valid' ? 'warning' : recordStatus
        }
      }
    } else if (requirePhone) {
      recordIssues.push({
        field: 'phone',
        type: 'error',
        message: 'Phone is required but missing',
        suggestion: 'Add phone number'
      })
      recordStatus = 'error'
    }

    // Address validation
    const hasCompleteAddress = record.address && record.city && record.state && record.zipCode
    if (hasCompleteAddress) {
      breakdown.hasAddress++
      if (includeValidationDetails) {
        const addressIssues = validateAddressFields(record)
        recordIssues.push(...addressIssues)
        if (addressIssues.some(issue => issue.type === 'error')) {
          recordStatus = 'error'
        } else if (addressIssues.some(issue => issue.type === 'warning')) {
          recordStatus = recordStatus === 'valid' ? 'warning' : recordStatus
          breakdown.addressValid++
        } else {
          breakdown.addressValid++
        }
      }
    } else if (requireAddress) {
      recordIssues.push({
        field: 'address',
        type: 'error',
        message: 'Complete address is required but missing',
        suggestion: 'Add street address, city, state, and ZIP code'
      })
      recordStatus = 'error'
    }

    // Calculate completeness score
    const completenessScore = calculateRecordCompleteness(record)

    // Create preview record
    const previewRecord: PreviewRecord = {
      rowNumber,
      data: record,
      status: recordStatus,
      issues: recordIssues,
      completenessScore
    }

    records.push(previewRecord)

    // Update counters
    if (recordStatus === 'error') {
      errorCount++
    } else if (recordStatus === 'warning') {
      warningCount++
    } else {
      validCount++
    }
  }

  // Generate summary issues
  generateSummaryIssues(issues, {
    totalRecords: transformedRecords.length,
    validCount,
    errorCount,
    warningCount,
    breakdown,
    requireEmail,
    requirePhone,
    requireAddress
  })

  // Calculate quality score
  const qualityScore = calculateOverallQualityScore(breakdown, transformedRecords.length)

  // Generate recommendations
  const recommendations = generateRecommendations(breakdown, transformedRecords.length, issues)

  // Determine if import can proceed
  const canProceed = errorCount === 0 && qualityScore >= 50

  // Estimate processing time
  const estimatedTime = estimateProcessingTime(transformedRecords.length)

  const summary: ImportSummary = {
    totalRecords: transformedRecords.length,
    validRecords: validCount,
    errorRecords: errorCount,
    warningRecords: warningCount,
    duplicateRecords: duplicateCount,
    qualityScore,
    breakdown
  }

  return {
    summary,
    records,
    issues,
    recommendations,
    canProceed,
    estimatedTime
  }
}

/**
 * Transform data based on column mappings
 */
function transformDataWithMappings(
  headers: string[],
  rows: string[][],
  columnMappings: Record<string, string>
): Record<string, string>[] {
  const transformedRows = []
  
  for (const row of rows) {
    const transformedRow: Record<string, string> = {}
    
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

/**
 * Validate email field
 */
function validateEmailField(email: string): RecordIssue[] {
  const issues: RecordIssue[] = []
  
  if (!email.trim()) {
    return issues
  }

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    issues.push({
      field: 'email',
      type: 'error',
      message: 'Invalid email format',
      suggestion: 'Check email format (example@domain.com)'
    })
    return issues
  }

  // Check for common issues
  if (email.includes('..')) {
    issues.push({
      field: 'email',
      type: 'warning',
      message: 'Email contains consecutive dots',
      suggestion: 'Verify email address is correct'
    })
  }

  if (email.length > 254) {
    issues.push({
      field: 'email',
      type: 'error',
      message: 'Email address is too long',
      suggestion: 'Email must be under 254 characters'
    })
  }

  // Check for suspicious patterns
  if (/test|example|sample|dummy/i.test(email)) {
    issues.push({
      field: 'email',
      type: 'warning',
      message: 'Email appears to be a test/example address',
      suggestion: 'Verify this is a real email address'
    })
  }

  return issues
}

/**
 * Validate phone field
 */
function validatePhoneField(phone: string): RecordIssue[] {
  const issues: RecordIssue[] = []
  
  if (!phone.trim()) {
    return issues
  }

  const digits = phone.replace(/\D/g, '')
  
  if (digits.length < 10) {
    issues.push({
      field: 'phone',
      type: 'error',
      message: 'Phone number appears incomplete',
      suggestion: 'Phone number should have at least 10 digits'
    })
  } else if (digits.length > 11) {
    issues.push({
      field: 'phone',
      type: 'warning',
      message: 'Phone number has too many digits',
      suggestion: 'Verify phone number format'
    })
  } else if (digits.length === 11 && !digits.startsWith('1')) {
    issues.push({
      field: 'phone',
      type: 'warning',
      message: 'Unusual phone number format',
      suggestion: 'Verify country code and format'
    })
  }

  // Check for suspicious patterns
  if (/^(\d)\1{9,}$/.test(digits)) {
    issues.push({
      field: 'phone',
      type: 'warning',
      message: 'Phone number has repeating digits',
      suggestion: 'Verify this is a real phone number'
    })
  }

  return issues
}

/**
 * Validate address fields
 */
function validateAddressFields(record: Record<string, string>): RecordIssue[] {
  const issues: RecordIssue[] = []

  // ZIP code validation
  if (record.zipCode) {
    const zipRegex = /^\d{5}(-\d{4})?$/
    if (!zipRegex.test(record.zipCode)) {
      issues.push({
        field: 'zipCode',
        type: 'error',
        message: 'Invalid ZIP code format',
        suggestion: 'Use 5-digit or ZIP+4 format (12345 or 12345-6789)'
      })
    }
  }

  // State validation
  if (record.state) {
    const validStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC']
    
    if (!validStates.includes(record.state.toUpperCase())) {
      issues.push({
        field: 'state',
        type: 'warning',
        message: 'State abbreviation not recognized',
        suggestion: 'Use standard 2-letter state abbreviation'
      })
    }
  }

  // Address completeness
  if (!record.address || record.address.length < 5) {
    issues.push({
      field: 'address',
      type: 'warning',
      message: 'Street address appears incomplete',
      suggestion: 'Verify street address is complete'
    })
  }

  return issues
}

/**
 * Calculate record completeness score
 */
function calculateRecordCompleteness(record: Record<string, string>): number {
  let score = 0
  const fields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode']
  
  fields.forEach(field => {
    if (record[field] && record[field].trim()) {
      score += 12.5 // 100 / 8 fields
    }
  })

  return Math.round(score)
}

/**
 * Generate summary issues
 */
function generateSummaryIssues(
  issues: ImportIssue[],
  stats: {
    totalRecords: number
    validCount: number
    errorCount: number
    warningCount: number
    breakdown: any
    requireEmail: boolean
    requirePhone: boolean
    requireAddress: boolean
  }
): void {
  const { totalRecords, errorCount, warningCount, breakdown, requireEmail, requirePhone, requireAddress } = stats

  // Critical issues
  if (errorCount > 0) {
    issues.push({
      type: 'critical',
      category: 'validation',
      message: `${errorCount} records have critical errors that prevent import`,
      affectedRecords: errorCount,
      suggestion: 'Fix validation errors before proceeding with import'
    })
  }

  // Missing required fields
  if (requireEmail && breakdown.hasEmail < totalRecords) {
    const missing = totalRecords - breakdown.hasEmail
    issues.push({
      type: 'critical',
      category: 'validation',
      message: `${missing} records missing required email addresses`,
      affectedRecords: missing,
      suggestion: 'Add email addresses to all records or change requirements'
    })
  }

  if (requirePhone && breakdown.hasPhone < totalRecords) {
    const missing = totalRecords - breakdown.hasPhone
    issues.push({
      type: 'critical',
      category: 'validation',
      message: `${missing} records missing required phone numbers`,
      affectedRecords: missing,
      suggestion: 'Add phone numbers to all records or change requirements'
    })
  }

  if (requireAddress && breakdown.hasAddress < totalRecords) {
    const missing = totalRecords - breakdown.hasAddress
    issues.push({
      type: 'critical',
      category: 'validation',
      message: `${missing} records missing required address information`,
      affectedRecords: missing,
      suggestion: 'Add complete address information or change requirements'
    })
  }

  // Warning issues
  if (warningCount > 0) {
    issues.push({
      type: 'warning',
      category: 'validation',
      message: `${warningCount} records have warnings that may affect quality`,
      affectedRecords: warningCount,
      suggestion: 'Review and fix warnings to improve data quality'
    })
  }

  // Completeness issues
  const emailCompleteness = (breakdown.hasEmail / totalRecords) * 100
  if (emailCompleteness < 50) {
    issues.push({
      type: 'warning',
      category: 'completeness',
      message: `Only ${Math.round(emailCompleteness)}% of records have email addresses`,
      affectedRecords: totalRecords - breakdown.hasEmail,
      suggestion: 'Consider adding more email addresses for better campaign reach'
    })
  }

  const addressCompleteness = (breakdown.hasAddress / totalRecords) * 100
  if (addressCompleteness < 50) {
    issues.push({
      type: 'warning',
      category: 'completeness',
      message: `Only ${Math.round(addressCompleteness)}% of records have complete addresses`,
      affectedRecords: totalRecords - breakdown.hasAddress,
      suggestion: 'Consider adding more address information for direct mail campaigns'
    })
  }
}

/**
 * Calculate overall quality score
 */
function calculateOverallQualityScore(breakdown: any, totalRecords: number): number {
  if (totalRecords === 0) return 0

  const nameScore = (breakdown.hasName / totalRecords) * 25
  const emailScore = (breakdown.hasEmail / totalRecords) * 25
  const phoneScore = (breakdown.hasPhone / totalRecords) * 20
  const addressScore = (breakdown.hasAddress / totalRecords) * 20
  const validationScore = ((breakdown.emailValid + breakdown.addressValid) / (breakdown.hasEmail + breakdown.hasAddress || 1)) * 10

  return Math.round(nameScore + emailScore + phoneScore + addressScore + validationScore)
}

/**
 * Generate recommendations
 */
function generateRecommendations(breakdown: any, totalRecords: number, issues: ImportIssue[]): string[] {
  const recommendations: string[] = []

  // Critical recommendations
  const criticalIssues = issues.filter(issue => issue.type === 'critical')
  if (criticalIssues.length > 0) {
    recommendations.push('Fix all critical errors before importing to ensure data quality')
  }

  // Data completeness recommendations
  const emailPercent = (breakdown.hasEmail / totalRecords) * 100
  if (emailPercent < 70) {
    recommendations.push('Consider adding more email addresses to improve digital marketing capabilities')
  }

  const addressPercent = (breakdown.hasAddress / totalRecords) * 100
  if (addressPercent < 70) {
    recommendations.push('Consider adding more complete addresses for direct mail campaigns')
  }

  // Validation recommendations
  const emailValidPercent = breakdown.hasEmail > 0 ? (breakdown.emailValid / breakdown.hasEmail) * 100 : 0
  if (emailValidPercent < 80) {
    recommendations.push('Run email validation to improve deliverability rates')
  }

  const addressValidPercent = breakdown.hasAddress > 0 ? (breakdown.addressValid / breakdown.hasAddress) * 100 : 0
  if (addressValidPercent < 80) {
    recommendations.push('Run address validation to improve mail delivery rates')
  }

  // General recommendations
  if (totalRecords > 1000) {
    recommendations.push('Large import detected - consider using background processing for better performance')
  }

  if (recommendations.length === 0) {
    recommendations.push('Data looks good! Ready to proceed with import')
  }

  return recommendations
}

/**
 * Estimate processing time
 */
function estimateProcessingTime(recordCount: number): number {
  // Base time: 1 second per 100 records
  // Additional time for validation: 0.5 seconds per 100 records
  // Minimum 5 seconds, maximum 300 seconds (5 minutes)
  
  const baseTime = Math.ceil(recordCount / 100)
  const validationTime = Math.ceil(recordCount / 200)
  const totalTime = baseTime + validationTime
  
  return Math.min(Math.max(totalTime, 5), 300)
}
