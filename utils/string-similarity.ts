/**
 * Calculates similarity between two strings using Levenshtein distance.
 * Returns a score from 0 (no match) to 100 (exact match).
 */
function similarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim()
  const s2 = b.toLowerCase().trim()

  if (s1 === s2) return 100
  if (s1.length === 0 || s2.length === 0) return 0

  const matrix: number[][] = []

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2[i - 1] === s1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  const maxLen = Math.max(s1.length, s2.length)
  const distance = matrix[s2.length][s1.length]
  return Math.round((1 - distance / maxLen) * 100)
}

/**
 * Finds the best matching string from a list of candidates.
 * Returns the best match and its similarity score (0–100).
 */
export function findBestMatch(
  target: string,
  candidates: string[]
): { match: string; similarity: number } {
  if (candidates.length === 0) return { match: "", similarity: 0 }

  let bestMatch = candidates[0]
  let bestScore = similarity(target, candidates[0])

  for (let i = 1; i < candidates.length; i++) {
    const score = similarity(target, candidates[i])
    if (score > bestScore) {
      bestScore = score
      bestMatch = candidates[i]
    }
  }

  return { match: bestMatch, similarity: bestScore }
}
