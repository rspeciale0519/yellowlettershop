import { test, expect } from './fixture'

for (const width of [390, 1440]) {
  test(`published price tables are usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#pricing')
    const letters = page.getByRole('table', { name: 'Letter pricing per piece' })
    await expect(letters).toBeVisible()
    const first = letters.getByRole('row').nth(1)
    await expect(first).toContainText('$1.15')
    await expect(first).toContainText('$1.70')
    await expect(first).toContainText('$0.65')
    await expect(first).toContainText('$0.55')
    await page.getByRole('tab', { name: 'Postcards', exact: true }).click()
    const postcards = page.getByRole('table', { name: 'Postcard pricing per piece' })
    await expect(postcards.getByRole('row')).toHaveCount(9)
    await expect(postcards.getByRole('row').filter({ hasText: '6 × 9 (FC)' })).toContainText('$1.28')
    await expect(postcards.getByRole('row').filter({ hasText: '6 × 11 (FC)' })).toContainText('$1.31')
    await expect(postcards.getByRole('row').filter({ hasText: '4 × 6 (SC)' })).toContainText('$1.25* (FC)')
    await expect(page.getByText('* Mail quantities of less than 250 must be mailed with First Class postage.', { exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Letters', exact: true })).toBeVisible()
  })
}
