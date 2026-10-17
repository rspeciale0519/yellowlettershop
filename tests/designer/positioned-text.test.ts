import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { layoutDesignerDocument } from '../../lib/designer/text/layout'
import { normalizeDesignerDocument } from '../../lib/designer/document/normalize'
import type { FontMetrics } from '../../lib/designer/text/types'
import type { TextDesignElement } from '../../types/designer'
const metrics: FontMetrics = { measure: (text, style) => Array.from(text).length * style.fontSize / 2, ascent: style => style.fontSize * .8, supports: text => !text.includes('🧱') }
const text: TextDesignElement = { id: 't', type: 'text', name: 'Message', content: 'One two three four five', x: 100, y: 85, width: 150, height: 160, zIndex: 1, fontSize: 20, fontWeight: 'normal', writingMode: 'guided' }
function doc(element=text) { return normalizeDesignerDocument({ templateId: 'paper', templateName: 'Paper', orientation: 'portrait', formatId: 'letter_8_5x11', pages: { front: [element], back: [] }, pageSettings: { front: { printIncluded: true, sheetIndex: 0, side: 'front', paper: 'yellow-notepad', regions: [] } }, updatedAt: 'now' }) }
describe('positioned text layout', () => {
  it('shares exact glyph positions for custom letter spacing',()=>{
    const spaced={...metrics,measure:(value:string,style:{fontSize:number;letterSpacing?:number})=>value.length*style.fontSize/2+Math.max(0,value.length-1)*(style.letterSpacing ?? 0)}
    const result=layoutDesignerDocument(doc({...text,content:'AB',writingMode:'free',letterSpacing:3}),{},spaced)
    const runs=result.boxes['front:t'].runs
    assert.equal(runs.length,2)
    assert.equal(runs[1].x-runs[0].x,13)
  })
  it('keeps guided postcard-back text out of the address half',()=>{
    const input=doc({...text,x:25,width:300,content:'Word '.repeat(15)})
    input.formatId='postcard_4x6';input.pages.back=input.pages.front;input.pages.front=[]
    input.pageSettings.back.printIncluded=true
    const result=layoutDesignerDocument(input,{},metrics)
    assert.ok(result.boxes['back:t'].runs.every(run=>run.x+run.width<=180))
  })
  it('wraps guided text on the selected paper rules', () => {
    const layout=layoutDesignerDocument(doc(), {}, metrics)
    const runs=layout.boxes['front:t'].runs
    assert.ok(new Set(runs.map(run => run.baseline)).size > 1)
    assert.ok(runs.every(run => Math.abs((run.baseline-110)%30) < .001))
    assert.ok(runs.every(run => run.x >= 100 && run.x+run.width <= 250))
  })
  it('preserves paragraphs and formatting while aligning right', () => {
    const layout=layoutDesignerDocument(doc({ ...text, writingMode:'free', richText:{ id:'t', style:{fontSize:20}, paragraphs:[{align:'right',runs:[{text:'Hi',style:{bold:true}}]},{runs:[{text:'Next'}]}] } }), {}, metrics)
    const runs=layout.boxes['front:t'].runs
    assert.equal(runs[0].style.bold,true)
    assert.ok(runs[0].x > text.x)
    assert.ok(runs[1].baseline > runs[0].baseline)
  })
  it('flags long words, excess text and unsupported glyphs without adding pages', () => {
    const layout=layoutDesignerDocument(doc({ ...text, content:'🧱'+'x'.repeat(500),height:30 }),{},metrics)
    assert.ok(layout.issues.some(issue=>issue.rule==='overflow'))
    assert.ok(layout.issues.some(issue=>issue.rule==='font'))
    assert.equal(Object.keys(layout.boxes).length,1)
  })
  it('resolves merge fields before measuring and detects long values', () => {
    const layout=layoutDesignerDocument(doc({...text,content:'{{first_name}}',height:25}),{first_name:'Alexandria'.repeat(40)},metrics)
    assert.ok(layout.issues.some(issue=>issue.rule==='overflow'))
  })
})
