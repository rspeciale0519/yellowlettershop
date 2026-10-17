import { test, expect } from './fixture'
import { calculatePricing } from '../../../lib/orders/pricing'
import { toPricingBreakdown } from '../../../lib/orders/pricing-breakdown'

// Uses the parent's existing isolated browser fixture; every wizard write below is intercepted.
const design = { version: 2, templateId: 'test', templateName: 'Quote test', formatId: 'letter_8_5x11', orientation: 'portrait', updatedAt: '2026-10-17', pages: { front: [], back: [] }, pageOrder: ['front', 'back'], pageSettings: { front: { printIncluded: true, sheetIndex: 0, side: 'front', paper: 'plain', regions: [] }, back: { printIncluded: true, sheetIndex: 0, side: 'back', paper: 'plain', regions: [] } } }
const state = {
  step: 5, totalSteps: 6, isDraft: true, entryPoint: 'dashboard_create_new', currentStepValid: false, validationErrors: {}, createdAt: '2026-10-17', updatedAt: '2026-10-17',
  listData: { useMailingData: true, manualRecords: [{ first_name: 'Test', last_name: 'Recipient', address_line_1: '1 Test St', city: 'Austin', state: 'TX', zip_code: '78701' }] },
  addressValidation: { orderId: 'job-test', deliverableRecords: 250, totalRecords: 250 },
  design: { designId: 'design-test', designRevision: 'sha256:test', designJson: design, isCustomDesign: true, variablesUsed: [] },
  mailingOptions: { serviceLevel: 'full_service', includePostage: true, postageType: 'first_class_forever', mailPieceFormat: 'letter_8_5x11', paperStock: 'standard_14pt', finish: 'matte', shippingAddress: { address_line_1: '1 Test St', city: 'Austin', state: 'TX', zip_code: '78701' } },
  campaignOptions: { isSplitCampaign: false, isRepeating: false },
}
const quote = { quoteStatus: 'final', quoteRevision: 'quote-test', designRevision: 'sha256:test', printedSideCount: 2, includedPrintedSides: 1, additionalPrintedSides: 1, additionalSideChargeCents: 2500, validatedQuantity: 250, basePrice: 412.5, basePriceLabel: 'Printing and mailing (postage included)', postageIncluded: true, postageCharges: 0, shippingCharges: 0, taxAmount: 0, totalPrice: 437.5, pricePerPiece: 1.75, addOnServices: [{ id: 'additional_printed_sides', name: 'Additional printed sides ($0.10 × extra sides × pieces)', description: 'Per extra side', unitPrice: 0.1, quantity: 250, totalPrice: 25 }] }

for (const quantity of [249, 250]) {
  test(`mailing choices and the actual pricing engine agree at ${quantity} postcards`, async ({ page }) => {
    const options = { ...state.mailingOptions, mailPieceFormat: 'postcard_6x9' as const, postageType: 'standard' as const, includePostage: quantity === 250 }
    const order = { ...state, step: 4, addressValidation: { ...state.addressValidation, deliverableRecords: quantity, totalRecords: quantity }, design: { ...state.design, designJson: { ...design, formatId: 'postcard_6x9' } }, mailingOptions: options }
    let sent: Record<string, unknown> = {}
    await page.route('**/api/orders/drafts/published-test', route => route.fulfill({ json: { orderState: order } }))
    await page.route('**/api/orders/pricing', route => {
      sent = route.request().postDataJSON().orderState.mailingOptions
      const result = calculatePricing(sent as typeof options, quantity, undefined, { printedSideCount: 2, includedPrintedSides: 2 })
      return route.fulfill({ json: { ...toPricingBreakdown(result), quoteStatus: 'final', quoteRevision: `published-${quantity}`, designRevision: 'sha256:test' } })
    })
    await page.goto('/orders/new?orderId=published-test')
    await expect(page.getByText('Printing and mailing (postage included)', { exact: true })).toBeVisible()
    await expect(page.getByText(quantity === 249 ? '$318.72' : '$237.50', { exact: true }).first()).toBeVisible()
    const standard = page.getByRole('radio', { name: 'Standard / Marketing Mail', exact: true })
    if (quantity === 249) {
      await expect(standard).toBeDisabled()
      await expect(page.getByRole('radio', { name: 'First Class (stamps)', exact: true })).toBeChecked()
      await expect.poll(() => sent.includePostage).toBe(true)
      await expect.poll(() => sent.postageType).toBe('first_class_forever')
    } else {
      await expect(standard).toBeEnabled()
      await expect(standard).toBeChecked()
    }
    await expect(page.getByRole('checkbox', { name: /Include postage/ })).toHaveCount(0)
  })
}

test('review waits for matching proof and shows the authoritative side fee and quantity', async ({ page }) => {
  await page.route('**/api/orders/drafts/quote-test', route => route.fulfill({ json: { orderState: state } }))
  await page.route('**/api/orders/pricing', route => {
    expect(route.request().postDataJSON().orderState.design.designId).toBe('design-test')
    return route.fulfill({ json: quote })
  })
  let releaseProof!: () => void
  const proofGate = new Promise<void>(resolve => { releaseProof = resolve })
  await page.route('**/api/orders/proof', async route => {
    const payload = route.request().postDataJSON()
    expect(payload.quoteRevision).toBe(quote.quoteRevision)
    await proofGate
    await route.fulfill({ json: { proofUrl: '/test-proof.pdf', quoteRevision: quote.quoteRevision } })
  })
  await page.goto('/orders/new?orderId=quote-test')
  await expect(page.getByText('250 validated pieces · 2 printed sides per piece', { exact: true })).toBeVisible()
  await expect(page.getByText('Additional printed sides ($0.10 × extra sides × pieces)', { exact: true })).toBeVisible()
  await expect(page.getByText('$25.00', { exact: true })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: /I approve this design/ })).toBeDisabled()
  releaseProof()
  await expect(page.getByRole('checkbox', { name: /I approve this design/ })).toBeEnabled()
  await page.getByRole('checkbox', { name: /I approve this design/ }).check()
  await page.getByRole('checkbox', { name: /I accept the Terms/ }).check()
  await expect(page.getByRole('button', { name: 'Continue to Payment', exact: true })).toBeEnabled()
})

test('provisional payment stays blocked and never creates an intent', async ({ page }) => {
  let intents = 0
  await page.route('**/api/orders/drafts/quote-test', route => route.fulfill({ json: { orderState: { ...state, step: 6 } } }))
  await page.route('**/api/orders/pricing', route => route.fulfill({ json: { ...quote, quoteStatus: 'provisional', quoteRevision: undefined } }))
  await page.route('**/api/payments/intent', route => { intents++; return route.fulfill({ status: 500, json: {} }) })
  await page.route('**/api/payments/methods', route => route.fulfill({ json: [] }))
  await page.goto('/orders/new?orderId=quote-test')
  await expect(page.getByRole('heading', { name: 'Provisional estimate' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Authorize Payment & Submit Order', exact: true })).toBeDisabled()
  expect(intents).toBe(0)
})

test('changed mailing finish invalidates previous review approval and requests the changed state', async ({ page }) => {
  const seenFinishes: string[] = []
  await page.route('**/api/orders/drafts/quote-test', route => route.fulfill({ json: { orderState: state } }))
  await page.route('**/api/orders/pricing', route => {
    const finish = route.request().postDataJSON().orderState.mailingOptions.finish
    seenFinishes.push(finish)
    return route.fulfill({ json: { ...quote, quoteRevision: `quote-${finish}` } })
  })
  await page.route('**/api/orders/proof', route => route.fulfill({ json: { proofUrl: '/test-proof.pdf', quoteRevision: route.request().postDataJSON().quoteRevision } }))
  await page.goto('/orders/new?orderId=quote-test')
  await page.getByRole('checkbox', { name: /I approve this design/ }).check()
  await page.getByRole('checkbox', { name: /I accept the Terms/ }).check()
  await page.getByRole('button', { name: /Step 4 Campaign Settings/ }).click()
  await page.getByRole('radio', { name: 'Gloss', exact: true }).click()
  await expect.poll(() => seenFinishes.at(-1)).toBe('gloss')
  await page.getByRole('button', { name: 'Continue to Review & Approval', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: /I approve this design/ })).not.toBeChecked()
  await expect(page.getByRole('button', { name: 'Continue to Payment', exact: true })).toBeDisabled()
})
