import { test, expect } from './fixture'
import { documentRevision } from '../../../lib/designer/content-revision'
import { readFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import type { DesignerDocument } from '../../../types/designer'

test('formatted guided writing, added sides, PDF, reload and order handoff retain the same design', async ({ page }) => {
  const designId='00000000-0000-4000-8000-000000000099'
  let saved: DesignerDocument | undefined
  let revision=''
  await page.route('**/api/design/save',async route=>{
    saved=route.request().postDataJSON().designState
    revision=await documentRevision(saved!)
    await route.fulfill({json:{ok:true,designId,revision}})
  })
  await page.route('**/rest/v1/saved_designs?**', route=>route.fulfill({json:{id:designId,user_id:'00000000-0000-4000-8000-000000000001',design_data:saved}}))
  await page.goto('/design/customize?templateId=white-notepad')
  const message=page.getByRole('textbox',{name:'Message text'})
  await message.fill('Dear neighbor,\nThank you for reading my letter.')
  await message.press('ControlOrMeta+a')
  await page.getByRole('button',{name:'Bold',exact:true}).click()
  await page.getByRole('checkbox',{name:'Guided writing'}).uncheck()
  await expect(message).toContainText('Thank you for reading my letter.')
  await page.getByRole('checkbox',{name:'Guided writing'}).check()
  await expect(page.locator('[data-testid="canvas-artboard"] text[font-weight="700"]').first()).toBeVisible()
  await page.getByRole('button',{name:'Show pages',exact:true}).click()
  const paperThumbnail=page.getByRole('button',{name:'Front printed',exact:true}).locator('[data-paper-type]')
  expect((await paperThumbnail.boundingBox())!.width).toBeGreaterThan(100)
  await page.getByLabel('Mail pieces',{exact:true}).fill('1000')
  await page.getByRole('button',{name:'Add Page',exact:true}).click()
  await page.getByRole('button',{name:'Add Page',exact:true}).click()
  await expect(page.getByTestId('additional-side-total')).toHaveText('$200.00')
  await page.getByRole('button',{name:'Preview',exact:true}).click()
  await expect(page.locator('iframe[title="Design proof"]')).toBeVisible()
  const pdf=await PDFDocument.load(readFileSync('/workspace/scratch/designer-verification/white-notepad-proof.pdf'))
  expect(pdf.getPageCount()).toBe(3)
  await page.getByRole('button',{name:'Close',exact:true}).click()
  await page.getByRole('button',{name:'Save design',exact:true}).click()
  await expect(page.locator('span:visible').filter({hasText:/^Saved online$/})).toBeVisible()
  await page.reload()
  await expect(page.locator('[data-testid="canvas-artboard"] text[font-weight="700"]').first()).toBeVisible()
  await page.getByRole('button',{name:'Show pages',exact:true}).click()
  await expect(page.getByRole('button',{name:'Side 3 printed',exact:true})).toBeVisible()
  await page.screenshot({path:'/workspace/scratch/designer-verification/notepad-desktop.png',fullPage:true})
  await page.getByRole('button',{name:'Continue to Order',exact:true}).click()
  await expect(page).toHaveURL(new RegExp(`/orders/new\\?.*designId=${designId}.*revision=`))
  expect(saved?.pageOrder).toHaveLength(3)
  expect(revision).toMatch(/^sha256:/)
})

test('overflow blocks order handoff without shrinking text or adding a charged side',async({page})=>{
  await page.goto('/design/customize?templateId=white-notepad')
  await page.getByRole('textbox',{name:'Message text'}).fill('A long message that must remain printable. '.repeat(500))
  await page.getByRole('button',{name:'Continue to Order',exact:true}).click()
  await expect(page.getByRole('button',{name:'Show print checks',exact:true})).toBeVisible()
  await expect(page).toHaveURL(/\/design\/customize/)
  await page.getByRole('button',{name:'Show pages',exact:true}).click()
  await expect(page.getByRole('button',{name:'Back not printed',exact:true})).toBeVisible()
  await expect(page.getByTestId('additional-side-total')).toHaveText('$0.00')
})

test('recipient preview remains selected and an older proof cannot replace the current proof',async({page})=>{
  const recipient=(id:string,firstName:string)=>({id,firstName,lastName:'Neighbor',addressLine1:'1 Example St',addressLine2:'',city:'Austin',state:'TX',zipCode:'78701',company:'',email:'',phone:''})
  let recordsRequests=0
  await page.route('**/api/designer/recipients?**',route=>{
    const kind=new URL(route.request().url()).searchParams.get('kind')
    if(kind==='lists')return route.fulfill({json:{lists:[{id:'example',name:'Example list'}]}})
    recordsRequests++
    return route.fulfill({json:{records:[recipient('a','Alice'),recipient('b','Beatrice')]}})
  })
  let releaseAlice!:()=>void
  const older=new Promise<void>(resolve=>{releaseAlice=resolve})
  let aliceStarted=false,aliceFinished=false
  await page.route('**/api/design/preview',async route=>{
    const firstName=route.request().postDataJSON().recipient.firstName
    if(firstName==='Alice'){aliceStarted=true;await older}
    await route.fulfill({json:{pdfUrl:`/proof-${firstName}.pdf`,widthIn:8.75,heightIn:11.25,dpi:300}}).catch(()=>undefined)
    if(firstName==='Alice')aliceFinished=true
  })
  await page.goto('/design/customize?templateId=white-notepad')
  await page.getByRole('button',{name:'Preview',exact:true}).click()
  await expect.poll(()=>aliceStarted).toBe(true)
  await page.getByRole('button',{name:/Beatrice Neighbor/}).click()
  await expect(page.locator('iframe[title="Design proof"]')).toHaveAttribute('src','/proof-Beatrice.pdf')
  releaseAlice()
  await expect.poll(()=>aliceFinished).toBe(true)
  await expect(page.locator('iframe[title="Design proof"]')).toHaveAttribute('src','/proof-Beatrice.pdf')
  expect(recordsRequests).toBe(1)
})
