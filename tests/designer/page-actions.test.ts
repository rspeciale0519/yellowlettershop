import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { addPrintedSide, removePrintedSide, setGuidedWriting } from '../../lib/designer/document/actions'
import { normalizeDesignerDocument } from '../../lib/designer/document/normalize'
import { getDesignSpread, getPrintedPages } from '../../lib/designer/document/pages'
import type { TextDesignElement } from '../../types/designer'
const make = () => normalizeDesignerDocument({templateId:'test',templateName:'Test',orientation:'portrait',formatId:'letter_8_5x11',pages:{front:[{id:'body',name:'Message',type:'text',content:'Hello',x:80,y:100,width:200,height:50,fontSize:18,fontWeight:'normal',zIndex:1}],back:[]},updatedAt:'now'})
describe('guided text-box page actions',()=>{
 it('keeps the 3D spread consistent with PDF order after removing a middle side',()=>{
  const first=addPrintedSide(make(),'front').document
  const third=addPrintedSide(first,'back','page-third').document
  const doc=removePrintedSide(third,'back')
  const spread=getDesignSpread(doc,'page-third')
  assert.equal(spread.front?.id,'front')
  assert.equal(spread.back?.id,'page-third')
  assert.equal(spread.sheetIndex,0)
 })
 it('keeps an expanded guided writing box clear of postage',()=>{
  const doc=make()
  doc.pages.front.push({id:'stamp',name:'Stamp',type:'postage',kind:'stamp',x:730,y:35,width:96,height:108,zIndex:2})
  const result=setGuidedWriting(doc,'front','body',true)
  assert.ok(result.pages.front[0].x+result.pages.front[0].width<=730 || result.pages.front[0].y>=143)
 })
 it('toggles the same text element into template bounds without replacing content',()=>{
  const doc=make(); doc.pageSettings.front.paper='white-notepad'
  const guided=setGuidedWriting(doc,'front','body',true)
  assert.equal(guided.pages.front.length,1)
  assert.equal(guided.pages.front[0].id,'body')
  assert.equal(guided.pages.front[0].width,695)
  assert.equal((guided.pages.front[0] as TextDesignElement).writingMode,'guided')
  assert.equal(setGuidedWriting(guided,'front','body',false).pages.front[0].id,'body')
 })
 it('includes an unused reverse immediately and links the existing guided box',()=>{
  const doc=setGuidedWriting(make(),'front','body',true)
  const added=addPrintedSide(doc,'front','page-test')
  assert.equal(added.pageId,'back')
  assert.equal(getPrintedPages(added.document).length,2)
  assert.equal((added.document.pages.back[0] as {continuesFrom?:string}).continuesFrom,'front:body')
  assert.equal(getPrintedPages(addPrintedSide(added.document,'back','page-third').document).length,3)
 })
 it('removing a side excludes it from print while keeping source text recoverable',()=>{
  const doc=setGuidedWriting(make(),'front','body',true)
  const added=addPrintedSide(doc,'front','page-test').document
  const result=removePrintedSide(added,'back')
  assert.equal(getPrintedPages(result).length,1)
  assert.equal((result.pages.front[0] as {content:string}).content,'Hello')
 })
 it('does not add sides to a fixed postcard or remove the only printed side',()=>{
  const doc=make();doc.formatId='postcard_4x6'
  assert.throws(()=>addPrintedSide(doc,'front','page-new'))
  assert.throws(()=>removePrintedSide(make(),'front'))
 })
})
