import { parseISODate, toISODateString, formatDate } from '@/lib/utils'

describe('date helpers', () => {
  describe('parseISODate', () => {
    it('returns undefined for empty/invalid inputs', () => {
      expect(parseISODate(undefined)).toBeUndefined()
      expect(parseISODate(null as unknown as string)).toBeUndefined()
      expect(parseISODate('')).toBeUndefined()
      expect(parseISODate('not-a-date')).toBeUndefined()
    })

    it('parses valid ISO dates', () => {
      const d = parseISODate('2024-02-29')
      expect(d).toBeInstanceOf(Date)
      // 2024 leap year
      expect(d?.getUTCFullYear()).toBe(2024)
      expect(d?.getUTCMonth()).toBe(1) // Feb is 1 (0-based)
      expect(d?.getUTCDate()).toBe(29)
    })
  })

  describe('toISODateString', () => {
    it('returns empty string for invalid/empty', () => {
      expect(toISODateString(undefined)).toBe('')
      expect(toISODateString(null)).toBe('')
      expect(toISODateString(new Date('invalid'))).toBe('')
    })

    it('formats dates to yyyy-mm-dd', () => {
      const d = new Date(Date.UTC(2025, 0, 5)) // Jan 5, 2025 UTC
      expect(toISODateString(d)).toBe('2025-01-05')
    })
  })

  describe('formatDate', () => {
    it('formats a Date to a readable string', () => {
      const d = new Date(Date.UTC(2025, 7, 18))
      const out = formatDate(d, 'en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
      // Locale-dependent, but should contain pieces
      expect(out).toMatch(/2025/)
      expect(out).toMatch(/Aug|Aug\./)
      expect(out).toMatch(/18/)
    })

    it('returns empty string for invalid inputs', () => {
      expect(formatDate('bad-input')).toBe('')
    })
  })
})
