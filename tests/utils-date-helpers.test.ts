import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { parseISODate, toISODateString, formatDate } from '@/lib/utils'

describe('date helpers', () => {
  describe('parseISODate', () => {
    it('returns undefined for empty/invalid inputs', () => {
      assert.equal(parseISODate(undefined), undefined)
      assert.equal(parseISODate(null as unknown as string), undefined)
      assert.equal(parseISODate(''), undefined)
      assert.equal(parseISODate('not-a-date'), undefined)
    })

    it('parses valid ISO dates', () => {
      const d = parseISODate('2024-02-29')
      assert.ok(d instanceof Date)
      // 2024 leap year
      assert.equal(d?.getUTCFullYear(), 2024)
      assert.equal(d?.getUTCMonth(), 1) // Feb is 1 (0-based)
      assert.equal(d?.getUTCDate(), 29)
    })
  })

  describe('toISODateString', () => {
    it('returns empty string for invalid/empty', () => {
      assert.equal(toISODateString(undefined), '')
      assert.equal(toISODateString(null), '')
      assert.equal(toISODateString(new Date('invalid')), '')
    })

    it('formats dates to yyyy-mm-dd', () => {
      const d = new Date(Date.UTC(2025, 0, 5)) // Jan 5, 2025 UTC
      assert.equal(toISODateString(d), '2025-01-05')
    })
  })

  describe('formatDate', () => {
    it('formats a Date to a readable string', () => {
      const d = new Date(Date.UTC(2025, 7, 18))
      const out = formatDate(d, 'en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
      // Locale-dependent, but should contain pieces
      assert.match(out, /2025/)
      assert.match(out, /Aug|Aug\./)
      assert.match(out, /18/)
    })

    it('returns empty string for invalid inputs', () => {
      assert.equal(formatDate('bad-input'), '')
    })
  })
})
