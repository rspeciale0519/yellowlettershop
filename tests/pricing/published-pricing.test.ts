import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { PUBLISHED_PRICING_SOURCE, PUBLISHED_QUANTITY_BANDS, PUBLISHED_LETTER_RATES, PUBLISHED_POSTCARD_RATES, publishedTierIndex } from '../../lib/orders/published-pricing'
import { PublishedLetterPricing, PublishedPostcardPricing } from '../../components/pricing/published-pricing-tables'

// Literal transcription of https://yellowlettershop.com/ captured 2026-10-17.
// Independent expected values catch accidental edits, wrong units and shifted tiers.
const bands = [
  { min: 1, max: 249, label: '1 - 249' },
  { min: 250, max: 499, label: '250 - 499' },
  { min: 500, max: 749, label: '500 - 749' },
  { min: 750, max: 999, label: '750 - 999' },
  { min: 1000, max: 2499, label: '1,000 - 2,499' },
  { min: 2500, max: 4999, label: '2,500 - 4,999' },
  { min: 5000, max: 9999, label: '5,000 - 9,999' },
  { min: 10000, max: null, label: '10,000+' },
]
const letters = {
  mailed_sc: [115, 110, 107, 102, 92, 91, 88, 85],
  mailed_fc: [170, 165, 143, 136, 123, 121, 117, 114],
  shipped_fc: [170, 165, 160, 153, 137, 135, 131, 128],
  shipped_np: [65, 65, 65, 65, 65, 65, 65, 65],
  shipped_po: [55, 55, 55, 55, 55, 55, 55, 55],
}
const postcards = [
  { format: 'postcard_4x6', postageClass: 'fc', label: '4 × 6 (FC)', rates: [125, 91, 88, 84, 76, 75, 72, 70] },
  { format: 'postcard_4x6', postageClass: 'sc', label: '4 × 6 (SC)', rates: [125, 92, 89, 85, 77, 76, 73, 71] },
  { format: 'postcard_5x7', postageClass: 'fc', label: '5 × 7 (FC)', rates: [127, 98, 95, 91, 82, 81, 78, 76] },
  { format: 'postcard_5x7', postageClass: 'sc', label: '5 × 7 (SC)', rates: [127, 94, 91, 87, 78, 77, 74, 72] },
  { format: 'postcard_6x9', postageClass: 'fc', label: '6 × 9 (FC)', rates: [128, 99, 96, 92, 83, 82, 79, 77] },
  { format: 'postcard_6x9', postageClass: 'sc', label: '6 × 9 (SC)', rates: [128, 95, 92, 88, 79, 78, 75, 74] },
  { format: 'postcard_6x11', postageClass: 'fc', label: '6 × 11 (FC)', rates: [131, 101, 99, 94, 85, 84, 81, 79] },
  { format: 'postcard_6x11', postageClass: 'sc', label: '6 × 11 (SC)', rates: [131, 97, 94, 90, 81, 80, 77, 75] },
]
const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`
function render(component: typeof PublishedLetterPricing) {
  return new JSDOM(renderToStaticMarkup(createElement(component))).window.document
}
function tableRows(document: Document) {
  return [...document.querySelectorAll('table tbody tr')].map(row => [...row.querySelectorAll('td')].map(cell => cell.textContent))
}

describe('published homepage pricing', () => {
  it('records the exact published source, retrieval date and USPS-effective date', () => {
    assert.deepEqual(PUBLISHED_PRICING_SOURCE, { url: 'https://yellowlettershop.com/', retrievedAt: '2026-10-17', effectiveFrom: '2026-07-12' })
  })
  it('uses the eight literal quantity bands from the live tables', () => {
    assert.deepEqual(PUBLISHED_QUANTITY_BANDS, bands)
  })
  it('preserves all forty letter rates as integer cents', () => {
    assert.deepEqual(PUBLISHED_LETTER_RATES, letters)
    assert.ok(Object.values(PUBLISHED_LETTER_RATES).flat().every(Number.isSafeInteger))
  })
  it('preserves all sixty-four postcard rates, including the 4x6 SC row', () => {
    assert.deepEqual(PUBLISHED_POSTCARD_RATES, postcards)
    assert.ok(PUBLISHED_POSTCARD_RATES.flatMap(row => [...row.rates]).every(Number.isSafeInteger))
  })
  it('selects the exact tier on both sides of every quantity boundary', () => {
    for (const [index, band] of bands.entries()) {
      assert.equal(publishedTierIndex(band.min), index, `minimum ${band.min}`)
      if (band.max !== null) assert.equal(publishedTierIndex(band.max), index, `maximum ${band.max}`)
    }
    assert.equal(publishedTierIndex(Number.MAX_SAFE_INTEGER), 7)
  })
  it('rejects nonpositive, fractional, nonfinite and unsafe quantities', () => {
    for (const quantity of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
      assert.throws(() => publishedTierIndex(quantity), /positive.*integer/i)
    }
  })
  it('displays the exact published letter matrix without adding a postage charge', () => {
    const document = render(PublishedLetterPricing)
    assert.deepEqual(tableRows(document), bands.map((band, index) => [band.label, ...Object.values(letters).map(rates => dollars(rates[index]))]))
    assert.ok(document.querySelector('a[href="https://yellowlettershop.com/"]'))
    assert.match(document.body.textContent ?? '', /July 12, 2026/)
    assert.doesNotMatch(document.body.textContent ?? '', /200 piece minimum/i)
  })
  it('displays the exact postcard matrix and marks small SC rows as First Class', () => {
    const document = render(PublishedPostcardPricing)
    assert.deepEqual(tableRows(document), postcards.map(row => [row.label, ...row.rates.map((rate, index) => `${dollars(rate)}${row.postageClass === 'sc' && index === 0 ? '* (FC)' : ''}`)]))
    assert.match(document.body.textContent ?? '', /Mail quantities of less than 250 must be mailed with First Class postage\./)
  })
})
