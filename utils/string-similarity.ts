/**
 * Calculate the Levenshtein distance between two strings
 * This measures how many single character edits are needed to change one string into another
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  // Initialize the matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  // Fill the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      )
    }
  }

  return matrix[b.length][a.length]
}

/**
 * Calculate similarity between two strings (0-100)
 * Higher values indicate greater similarity
 */
export function calculateSimilarity(a: string, b: string): number {
  if (!a.length || !b.length) return 0

  // Normalize strings for comparison
  const strA = a.toLowerCase().trim()
  const strB = b.toLowerCase().trim()

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(strA, strB)

  // Calculate similarity as percentage (100 = identical, 0 = completely different)
  const maxLength = Math.max(strA.length, strB.length)
  const similarity = ((maxLength - distance) / maxLength) * 100

  return Math.round(similarity)
}

/**
 * Find the best match for a string from an array of options
 */
export function findBestMatch(str: string, options: string[]): { match: string; similarity: number } {
  let bestMatch = ""
  let bestSimilarity = 0

  // Normalize input string
  const normalizedStr = str.toLowerCase().trim()

  // Check for exact matches first (case insensitive)
  for (const option of options) {
    if (option.toLowerCase().trim() === normalizedStr) {
      return { match: option, similarity: 100 }
    }
  }

  // If no exact match, find the closest one
  for (const option of options) {
    const similarity = calculateSimilarity(normalizedStr, option.toLowerCase().trim())

    // Also check if the option contains the string or vice versa
    const containsBonus =
      option.toLowerCase().includes(normalizedStr) || normalizedStr.includes(option.toLowerCase()) ? 10 : 0

    const adjustedSimilarity = Math.min(similarity + containsBonus, 100)

    if (adjustedSimilarity > bestSimilarity) {
      bestMatch = option
      bestSimilarity = adjustedSimilarity
    }
  }

  return { match: bestMatch, similarity: bestSimilarity }
}
