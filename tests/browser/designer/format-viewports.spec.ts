import { test, expect } from './fixture'
const formats=['Postcard 4×6','Postcard 5×7','Postcard 6×9','Postcard 6×11','Letter 8.5×11','Folded Letter 8.5×11']
for(const viewport of [{width:390,height:844},{width:768,height:1024},{width:1280,height:800},{width:1440,height:1000}]) {
  test(`all six formats keep primary actions and canvas reachable at ${viewport.width}×${viewport.height}`,async({page})=>{
    test.setTimeout(120_000)
    await page.setViewportSize(viewport)
    await page.goto('/design/customize?templateId=white-notepad')
    if(viewport.width<1024) await page.getByRole('button',{name:'Design settings',exact:true}).click()
    for(const label of formats){
      await page.getByRole('combobox',{name:'Mail piece size'}).click()
      await page.getByRole('option',{name:label,exact:true}).click()
      await expect(page.getByRole('combobox',{name:'Mail piece size'})).toContainText(label)
      const next=page.getByRole('button',{name:'Continue to Order',exact:true})
      await expect(next).toBeInViewport()
      const fit=page.getByRole('button',{name:'Fit to screen',exact:true})
      await fit.focus()
      await fit.press('Enter')
      const art=await page.getByTestId('canvas-artboard').boundingBox()
      const frame=await page.getByTestId('canvas-viewport').boundingBox()
      expect(art!.width).toBeGreaterThan(0)
      expect(art!.height).toBeLessThanOrEqual(frame!.height-59)
      expect(art!.width).toBeLessThanOrEqual(frame!.width)
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
    }
    await page.screenshot({path:`/workspace/scratch/designer-verification/formats-${viewport.width}.png`})
  })
}
