import { test, expect } from './fixture'
test('3D capture embeds the print fonts and shows the selected additional sheet',async({page})=>{
  await page.addInitScript(()=>{
    const descriptor=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src')!
    Object.defineProperty(HTMLImageElement.prototype,'src',{...descriptor,set(value:string){
      if(value.startsWith('data:image/svg+xml')){
        const svg=decodeURIComponent(value.slice(value.indexOf(',')+1))
        if(svg.includes('@font-face') && svg.includes('YLS Handwriting') && svg.includes('data:font/ttf;base64,')){
          ;(window as Window & {capturedPrintFonts?:boolean}).capturedPrintFonts=true
        }
      }
      descriptor.set!.call(this,value)
    }})
  })
  await page.goto('/design/customize?templateId=white-notepad')
  await page.getByRole('button',{name:'Show pages',exact:true}).click()
  await page.getByRole('button',{name:'Add Page',exact:true}).click()
  await page.getByRole('button',{name:'Add Page',exact:true}).click()
  await page.getByRole('button',{name:'Preview',exact:true}).click()
  await page.getByRole('tab',{name:'3D preview',exact:true}).click()
  const sheet=page.getByRole('combobox',{name:'3D sheet',exact:true})
  await expect(sheet.locator('option')).toHaveCount(2)
  await expect(sheet).toHaveValue(/page-/)
  await expect(page.getByRole('button',{name:'Flip it over',exact:true})).toBeEnabled()
  await expect(page.locator('canvas')).toBeVisible()
  await sheet.selectOption('front')
  await expect.poll(()=>page.evaluate(()=>(window as Window & {capturedPrintFonts?:boolean}).capturedPrintFonts)).toBe(true)
  await page.getByRole('button',{name:'Flip it over',exact:true}).click()
  await expect(page.getByRole('button',{name:'Show the front',exact:true})).toHaveAttribute('aria-pressed','true')
  await page.screenshot({path:'/workspace/scratch/designer-verification/notepad-3d.png'})
})
