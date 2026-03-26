import { ColumnStatistics } from './types'

/**
 * Analyze data columns to generate statistics
 */
export function analyzeColumnData(data: any[]): ColumnStatistics[] {
  if (!data || data.length === 0) return []

  const columns = Object.keys(data[0] || {})
  const totalRows = data.length

  return columns.map(columnName => {
    const values = data.map(row => row[columnName])
    const filledValues = values.filter(val => val !== null && val !== undefined && val !== '')
    const filledRows = filledValues.length
    const emptyRows = totalRows - filledRows
    const uniqueValues = new Set(filledValues).size
    const completeness = totalRows > 0 ? Math.round((filledRows / totalRows) * 100) : 0

    // Get sample values (first 5 unique non-empty values)
    const sampleValues = Array.from(new Set(filledValues))
      .slice(0, 5)
      .map(val => String(val).slice(0, 20)) // Truncate long values

    // Detect data type
    const dataType = detectDataType(filledValues)

    return {
      columnName,
      totalRows,
      filledRows,
      emptyRows,
      uniqueValues,
      sampleValues,
      dataType,
      completeness
    }
  })
}

/**
 * Detect the data type of a column based on its values
 */
function detectDataType(values: any[]): ColumnStatistics['dataType'] {
  if (values.length === 0) return 'text'

  // Take a sample of values for analysis
  const sample = values.slice(0, Math.min(100, values.length))

  let numberCount = 0
  let emailCount = 0
  let phoneCount = 0
  let addressCount = 0

  for (const value of sample) {
    const str = String(value).trim()

    // Check for numbers
    if (!isNaN(Number(str)) && str !== '') {
      numberCount++
    }

    // Check for emails
    if (isEmail(str)) {
      emailCount++
    }

    // Check for phone numbers
    if (isPhone(str)) {
      phoneCount++
    }

    // Check for addresses (basic heuristic)
    if (isAddress(str)) {
      addressCount++
    }
  }

  const threshold = sample.length * 0.7 // 70% threshold

  if (emailCount >= threshold) return 'email'
  if (phoneCount >= threshold) return 'phone'
  if (addressCount >= threshold) return 'address'
  if (numberCount >= threshold) return 'number'

  // Check for mixed types
  const typeCount = [numberCount, emailCount, phoneCount, addressCount].filter(count => count > 0).length
  if (typeCount > 1) return 'mixed'

  return 'text'
}

/**
 * Check if a string is likely an email address
 */
function isEmail(str: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(str)
}

/**
 * Check if a string is likely a phone number
 */
function isPhone(str: string): boolean {
  // Remove all non-digit characters
  const digitsOnly = str.replace(/\D/g, '')

  // Check for common phone number lengths (7-15 digits)
  if (digitsOnly.length < 7 || digitsOnly.length > 15) return false

  // Check for common phone patterns
  const phonePatterns = [
    /^\(\d{3}\)\s?\d{3}-?\d{4}$/, // (123) 456-7890
    /^\d{3}-?\d{3}-?\d{4}$/, // 123-456-7890
    /^\d{10,11}$/, // 1234567890 or 11234567890
    /^\+\d{1,4}\s?\d{7,14}$/ // +1 1234567890
  ]

  return phonePatterns.some(pattern => pattern.test(str))
}

/**
 * Check if a string is likely a street address
 */
function isAddress(str: string): boolean {
  // Basic heuristics for street addresses
  const addressIndicators = [
    /\b\d+\s+\w+\s+(st|street|ave|avenue|rd|road|dr|drive|blvd|boulevard|ln|lane|ct|court|pl|place|way|pkwy|parkway)\b/i,
    /\b\d+\s+[a-zA-Z\s]+\s+(st|street|ave|avenue|rd|road|dr|drive|blvd|boulevard|ln|lane|ct|court|pl|place|way|pkwy|parkway)\b/i,
    /^\d+\s+\w+/i // Starts with number followed by word
  ]

  return addressIndicators.some(pattern => pattern.test(str))
}

/**
 * Generate auto-mapping suggestions based on column names and data patterns
 */
export function generateAutoMappingSuggestions(
  sourceColumns: string[],
  columnStats: ColumnStatistics[]
): Record<string, { column: string; confidence: number }> {
  const suggestions: Record<string, { column: string; confidence: number }> = {}

  const mappingPatterns: Record<string, {
    namePatterns: string[]
    dataTypePreference?: ColumnStatistics['dataType']
    minConfidence?: number
  }> = {
    first_name: {
      namePatterns: ['first_name', 'firstname', 'first', 'fname', 'givenname', 'given_name'],
      dataTypePreference: 'text',
      minConfidence: 0.7
    },
    last_name: {
      namePatterns: ['last_name', 'lastname', 'last', 'lname', 'surname', 'familyname', 'family_name'],
      dataTypePreference: 'text',
      minConfidence: 0.7
    },
    email: {
      namePatterns: ['email', 'email_address', 'e_mail', 'emailaddress', 'mail'],
      dataTypePreference: 'email',
      minConfidence: 0.9
    },
    phone: {
      namePatterns: ['phone', 'phone_number', 'telephone', 'mobile', 'cell', 'tel'],
      dataTypePreference: 'phone',
      minConfidence: 0.8
    },
    address_line_1: {
      namePatterns: ['address', 'address1', 'address_line_1', 'street', 'street_address', 'streetaddress'],
      dataTypePreference: 'address',
      minConfidence: 0.8
    },
    city: {
      namePatterns: ['city', 'town', 'municipality'],
      dataTypePreference: 'text',
      minConfidence: 0.8
    },
    state: {
      namePatterns: ['state', 'st', 'province', 'region'],
      dataTypePreference: 'text',
      minConfidence: 0.8
    },
    zip_code: {
      namePatterns: ['zip', 'zip_code', 'zipcode', 'postal_code', 'postalcode', 'postcode'],
      dataTypePreference: 'text',
      minConfidence: 0.8
    }
  }

  sourceColumns.forEach(sourceCol => {
    const normalizedSource = sourceCol.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
    const columnStat = columnStats.find(stat => stat.columnName === sourceCol)

    for (const [ylsField, config] of Object.entries(mappingPatterns)) {
      let confidence = 0

      // Check name pattern matching
      const nameMatch = config.namePatterns.some(pattern => {
        const normalizedPattern = pattern.replace(/[^a-z0-9]/g, '')
        if (normalizedSource === normalizedPattern) return true
        if (normalizedSource.includes(normalizedPattern) || normalizedPattern.includes(normalizedSource)) {
          confidence = 0.8
          return true
        }
        return false
      })

      if (nameMatch && normalizedSource === config.namePatterns.find(p => p.replace(/[^a-z0-9]/g, '') === normalizedSource)?.replace(/[^a-z0-9]/g, '')) {
        confidence = 1.0 // Exact match
      }

      // Boost confidence based on data type match
      if (columnStat && config.dataTypePreference && columnStat.dataType === config.dataTypePreference) {
        confidence += 0.2
      }

      // Apply minimum confidence threshold
      if (confidence >= (config.minConfidence || 0.7)) {
        // Only suggest if we don't have a better suggestion already
        if (!suggestions[ylsField] || suggestions[ylsField].confidence < confidence) {
          suggestions[ylsField] = { column: sourceCol, confidence }
        }
      }
    }
  })

  return suggestions
}

/**
 * Smart auto-mapping that considers both naming patterns and data types
 */
export function performSmartAutoMapping(
  sourceColumns: string[],
  columnStats: ColumnStatistics[],
  existingMappings: Record<string, string | null>
): Record<string, string | null> {
  const suggestions = generateAutoMappingSuggestions(sourceColumns, columnStats)
  const newMappings: Record<string, string | null> = { ...existingMappings }

  // Apply suggestions with conflict resolution
  const usedColumns = new Set<string>()

  // Sort suggestions by confidence (highest first)
  const sortedSuggestions = Object.entries(suggestions)
    .sort(([, a], [, b]) => b.confidence - a.confidence)

  for (const [ylsField, suggestion] of sortedSuggestions) {
    // Skip if field already mapped or column already used
    if (newMappings[ylsField] || usedColumns.has(suggestion.column)) continue

    newMappings[ylsField] = suggestion.column
    usedColumns.add(suggestion.column)
  }

  return newMappings
}