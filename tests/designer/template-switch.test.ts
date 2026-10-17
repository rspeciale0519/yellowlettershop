import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { createDesignerDocument } from '../../components/designer/designer-templates'
import { addPrintedSide } from '../../lib/designer/document/actions'
import { switchDesignerTemplate } from '../../lib/designer/template-switch'
import type { TextDesignElement } from '../../types/designer'
describe('compatible notepad template changes',()=>{
  it('keeps formatted content and extra sides while changing paper color',()=>{
    const source=addPrintedSide(createDesignerDocument('white-notepad'),'front').document
    const message=source.pages.front[0] as TextDesignElement
    message.content='My completed letter'
    message.richText={id:message.id,style:{fontSize:22},paragraphs:[{runs:[{text:message.content,style:{bold:true}}]}]}
    source.designId='old-saved-design'
    const next=switchDesignerTemplate(source,'yellow-notepad')
    assert.equal(next.templateId,'yellow-notepad')
    assert.equal(next.designId,undefined)
    assert.deepEqual(JSON.parse(JSON.stringify(next.pages)),JSON.parse(JSON.stringify(source.pages)))
    assert.equal(next.pageSettings!.front.paper,'yellow-notepad')
    assert.equal(next.pageSettings!.back.paper,'yellow-notepad')
    assert.equal(next.pageSettings!.back.printIncluded,true)
    assert.equal(source.pageSettings.front.paper,'white-notepad')
  })
})
