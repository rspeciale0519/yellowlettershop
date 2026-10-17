import { test, expect } from './fixture'

test('all offered formats can be selected and a postcard includes both fixed sides',async({page})=>{
  await page.goto('/design/customize?templateId=white-notepad')
  const format=page.getByRole('combobox',{name:'Mail piece size'})
  await format.click()
  await expect(page.getByRole('option')).toHaveCount(6)
  await page.getByRole('option',{name:'Postcard 5×7',exact:true}).click()
  await expect(format).toContainText('Postcard 5×7')
  await page.getByRole('button',{name:'Show pages',exact:true}).click()
  await expect(page.getByRole('button',{name:'Back printed',exact:true})).toBeVisible()
  await expect(page.getByRole('button',{name:'Add Page',exact:true})).toHaveCount(0)
  await format.click()
  await page.getByRole('option',{name:'Folded Letter 8.5×11',exact:true}).click()
  await expect(format).toContainText('Folded Letter 8.5×11')
  await expect(page.getByRole('button',{name:'Add Page',exact:true})).toBeVisible()
})

test('a postcard conversion cannot discard additional letter sides',async({page})=>{
  await page.goto('/design/customize?templateId=white-notepad')
  await page.getByRole('button',{name:'Show pages',exact:true}).click()
  await page.getByRole('button',{name:'Add Page',exact:true}).click()
  await page.getByRole('button',{name:'Add Page',exact:true}).click()
  await page.getByRole('combobox',{name:'Mail piece size'}).click()
  await page.getByRole('option',{name:'Postcard 5×7',exact:true}).click()
  await expect(page.getByRole('alert').filter({hasText:'Postcards have two fixed sides'})).toBeVisible()
  await expect(page.getByRole('combobox',{name:'Mail piece size'})).toContainText('Letter 8.5×11')
  await expect(page.getByRole('button',{name:'Side 3 printed',exact:true})).toBeVisible()
})
