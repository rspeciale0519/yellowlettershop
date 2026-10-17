import { test, expect } from './fixture'
import { draftKey, orderRecoveryKey } from '../../../lib/designer/draft-context'
import { createDesignerDocument } from '../../../components/designer/designer-templates'

for (const entry of [
  { name: 'Yellow Letter', id: 'starter-yellow-letter', format: 'Letter 8.5×11' },
  { name: 'Postcard Offer', id: 'starter-postcard-offer', format: 'Postcard 6×9' },
]) {
  test(`gallery opens ${entry.name} with its format and preserves selection on reload`, async ({ page }) => {
    await page.goto('/templates?orderId=test-order&source=order_wizard')
    await page.getByRole('textbox', { name: 'Search templates' }).fill(entry.name)
    await page.getByRole('link', { name: 'Use Template', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`templateId=${entry.id}.*orderId=test-order.*source=order_wizard`))
    await expect(page.getByRole('combobox', { name: 'Design template' })).toContainText(entry.name)
    await expect(page.getByRole('combobox', { name: 'Mail piece size' })).toContainText(entry.format)
    await expect(page.getByRole('button', { name: 'Orientation: portrait. Switch to landscape.' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'My design' })).toHaveAttribute('href', '/templates?orderId=test-order&source=order_wizard')
    await page.reload()
    await expect(page.getByRole('combobox', { name: 'Design template' })).toContainText(entry.name)
    await expect(page.getByRole('combobox', { name: 'Mail piece size' })).toContainText(entry.format)
    await page.screenshot({ path: `/tmp/yls-template-${entry.id}.png` })
  })
}

test('a different URL template overrides the recovered draft', async ({ page }) => {
  const document = createDesignerDocument('real-estate-flyer')
  const context={userId:'00000000-0000-4000-8000-000000000001',templateId:document.templateId,orderId:'test-order'}
  await page.addInitScript(({key,pointer,document,context})=>{localStorage.setItem(key,JSON.stringify({document,context,savedAt:'now'}));localStorage.setItem(pointer,JSON.stringify({context}))},{key:draftKey(context),pointer:orderRecoveryKey(context.userId,context.orderId),document,context})
  await page.goto('/design/customize?templateId=yellow-letter&orderId=test-order')
  await expect(page.getByRole('combobox', { name: 'Design template' })).toContainText('Yellow Letter')
  await expect(page.getByText('HEADLINE', { exact: true })).toHaveCount(0)
  await page.evaluate(() => history.pushState(null, '', '/design/customize?templateId=postcard-offer&orderId=test-order'))
  await expect(page.getByRole('combobox', { name: 'Design template' })).toContainText('Postcard Offer')
  await expect(page.getByRole('combobox', { name: 'Mail piece size' })).toContainText('Postcard 6×9')
})

test('unknown URL id offers recovery without replacing the saved draft', async ({ page }) => {
  const document = createDesignerDocument('yellow-letter')
  const context={userId:'00000000-0000-4000-8000-000000000001',templateId:document.templateId,orderId:'test-order'}
  await page.addInitScript(({key,pointer,document,context})=>{localStorage.setItem(key,JSON.stringify({document,context,savedAt:'now'}));localStorage.setItem(pointer,JSON.stringify({context}))},{key:draftKey(context),pointer:orderRecoveryKey(context.userId,context.orderId),document,context})
  await page.goto('/design/customize?templateId=unknown&orderId=test-order')
  await expect(page.getByRole('heading', { name: 'Template unavailable' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Choose a template' })).toHaveAttribute('href', '/templates?orderId=test-order')
  await page.getByRole('link', { name: 'Recover saved design' }).click()
  await expect(page.getByRole('combobox', { name: 'Design template' })).toContainText('Yellow Letter')
})

test('mock catalog artwork is preview-only rather than an inert Use Template action', async ({ page }) => {
  await page.goto('/templates')
  await page.getByRole('textbox', { name: 'Search templates' }).fill('Modern Listing Announcement')
  await expect(page.getByRole('button', { name: 'Use Template', exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Use Template', exact: true })).toHaveCount(0)
  await expect(page.getByText('Preview only', { exact: true })).toBeVisible()
})


test('login return retains template selection and current order', async ({ page }) => {
  await page.route('**/auth/v1/user', (route) => route.fulfill({ status: 401, json: { message: 'Session missing' }, headers: { 'Access-Control-Allow-Origin': '*' } }))
  await page.goto('/design/customize?templateId=yellow-letter&orderId=test-order')
  await expect.poll(() => new URL(page.url()).searchParams.get('redirectedFrom')).toBe('/design/customize?templateId=yellow-letter&orderId=test-order')
})

test('changing the template preserves the selected template on reload', async ({ page }) => {
  await page.goto('/design/customize?templateId=yellow-letter&orderId=test-order')
  await page.getByRole('combobox', { name: 'Design template' }).click()
  await page.getByRole('option', { name: 'White Notepad Letter', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Design template' })).toContainText('White Notepad Letter')
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Design template' })).toContainText('White Notepad Letter')
})

test('switching notepad color retains formatted writing and additional sides after reload',async({page})=>{
  await page.goto('/design/customize?templateId=white-notepad')
  await page.getByRole('textbox',{name:'Message text'}).fill('Keep my completed message')
  await page.getByRole('button',{name:'Show pages',exact:true}).click()
  await page.getByRole('button',{name:'Add Page',exact:true}).click()
  await page.getByRole('combobox',{name:'Design template'}).click()
  await page.getByRole('option',{name:'Yellow Notepad Letter',exact:true}).click()
  await expect(page.locator('[data-testid="canvas-artboard"] text').first()).toHaveText('Keep my completed message')
  await expect(page.locator('[data-testid="canvas-artboard"] [data-paper-type="yellow-notepad"]')).toBeVisible()
  await page.reload()
  await expect(page.locator('[data-testid="canvas-artboard"] text').first()).toHaveText('Keep my completed message')
  await page.getByRole('button',{name:'Show pages',exact:true}).click()
  await expect(page.getByRole('button',{name:'Back printed',exact:true})).toBeVisible()
})
