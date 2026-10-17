import { strict as assert } from 'assert'
import { describe,it } from 'mocha'
import { createDesignerDocument } from '../../components/designer/designer-templates'
import { paperGeometry } from '../../lib/designer/text/paper'
import { layoutDesignerDocument } from '../../lib/designer/text/layout'
import { SAMPLE_VALUES } from '../../lib/designer/text/resolve-values'
import { getServerFontMetrics } from '../../lib/designer/text/server-fonts'
describe('notepad template geometry',()=>{
 it('keeps the original letter text inside its existing boxes',async()=>{
  const layout=layoutDesignerDocument(createDesignerDocument('yellow-letter'),SAMPLE_VALUES,await getServerFontMetrics())
  assert.equal(layout.issues.filter(issue=>issue.rule==='overflow').length,0)
 })
 for(const id of ['white-notepad','yellow-notepad']) it(`${id} configures the same horizontal rules as its text`,async()=>{
  const doc=createDesignerDocument(id)
  assert.equal(doc.templateId,id)
  assert.equal(doc.pageSettings?.front.paper,id)
  const metrics=await getServerFontMetrics()
  const layout=layoutDesignerDocument(doc,{first_name:'Alex',sender_first:'Jamie',sender_last:'Taylor'},metrics)
  const paper=paperGeometry(id as 'white-notepad'|'yellow-notepad',{width:850,height:1100})!
  assert.ok(Object.values(layout.boxes).flatMap(box=>box.runs).every(run=>Math.abs((run.baseline-paper.firstBaseline)%paper.lineSpacing)<.001))
 })
})
