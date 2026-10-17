import { test, expect } from './fixture'

// The old fixed-width header places its Next action beyond the phone viewport.
test('phone keeps order action inside the viewport without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/design/customize?redirectedFrom=/design/customize')
  const next = page.getByRole('button', { name: /^(Next|Continue to Order)$/ })
  await expect(next).toBeVisible()
  const bounds = await next.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844)
  await expect(next).toHaveText('Continue to Order')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.getByRole('button', { name: 'Design settings', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Save design', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Design settings', exact: true }).click()
  await page.getByRole('button', { name: 'Pages', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Pages', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Back/ })).toBeInViewport()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Pages', exact: true })).not.toBeVisible()
  await page.screenshot({ path: '/tmp/yls-designer-phone-workspace.png' })
})

test('phone can edit content and open the complete front/back proof', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/design/customize?redirectedFrom=/design/customize')
  await page.getByRole('button', { name: 'Edit content', exact: true }).click()
  await page.getByRole('button', { name: 'Layers', exact: true }).click()
  await page.getByRole('button', { name: /Body Text text/ }).click()
  await page.locator('input[value="Your Text Here"]').fill('A message from my phone')
  const previewRequest = page.waitForRequest('**/api/design/preview')
  await page.getByRole('button', { name: 'Preview', exact: true }).click()
  const request = await previewRequest
  const payload = request.postDataJSON()
  expect(payload.designState.pages.front.some((element: { content?: string }) => element.content === 'A message from my phone')).toBe(true)
  expect(payload.designState.pages.back.length).toBeGreaterThan(0)
  const dialog = page.getByRole('dialog', { name: 'Design Preview' })
  await expect(dialog).toBeVisible()
  await expect(page.locator('iframe[title="Design proof"]')).toBeVisible()
  const bounds = await dialog.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.width).toBeLessThanOrEqual(390)
  await page.screenshot({ path: '/tmp/yls-designer-phone.png' })
})

test('desktop fits both artboard dimensions and refits when pages collapse or viewport changes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/design/customize?redirectedFrom=/design/customize')
  await page.getByRole('button', { name: 'Fit to screen', exact: true }).click()
  const fits = async () => {
    const viewport = await page.getByTestId('canvas-viewport').boundingBox()
    const artboard = await page.getByTestId('canvas-artboard').boundingBox()
    expect(artboard!.x).toBeGreaterThanOrEqual(viewport!.x)
    expect(artboard!.y).toBeGreaterThanOrEqual(viewport!.y)
    expect(artboard!.x + artboard!.width).toBeLessThanOrEqual(viewport!.x + viewport!.width)
    expect(artboard!.y + artboard!.height).toBeLessThanOrEqual(viewport!.y + viewport!.height - 60)
  }
  await fits()
  await page.getByRole('button', { name: 'Show pages', exact: true }).click()
  await fits()
  await page.getByRole('button', { name: 'Hide pages', exact: true }).click()
  await fits()
  await page.screenshot({ path: '/tmp/yls-designer-desktop.png' })
  await page.setViewportSize({ width: 900, height: 700 })
  await expect.poll(async () => Number(await page.getByRole('slider', { name: 'Zoom level' }).inputValue())).toBeLessThan(60)
  await fits()
  await page.screenshot({ path: '/tmp/yls-designer-compact.png' })
})

for (const route of ['/', '/templates']) {
  test(`site chrome remains on ${route}`, async ({ page }) => {
    await page.context().clearCookies()
    await page.goto(route)
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })
}
