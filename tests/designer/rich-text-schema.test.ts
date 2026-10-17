import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { fromEditorDocument, toEditorDocument, storyText } from '../../lib/designer/text/rich-text-schema'
describe('text-box rich content', () => {
  it('preserves paragraphs, hard breaks and selection formatting', () => {
    const story = fromEditorDocument({ type:'doc',content:[{type:'paragraph',attrs:{textAlign:'right'},content:[{type:'text',text:'Hello',marks:[{type:'bold'}]},{type:'hardBreak'},{type:'text',text:'again'}]},{type:'paragraph',content:[{type:'text',text:'Bye'}]}]},'box',{fontSize:18})
    assert.equal(storyText(story),'Hello\nagain\nBye')
    assert.equal(story.paragraphs[0].runs[0].style?.bold,true)
    assert.equal(story.paragraphs[0].align,'right')
    assert.deepEqual(fromEditorDocument(toEditorDocument(story),'box',{fontSize:18}),story)
  })
  it('keeps personalization atomic and drops unsupported pasted nodes and marks', () => {
    const story = fromEditorDocument({type:'doc',content:[{type:'paragraph',content:[{type:'personalization',attrs:{field:'first_name'}},{type:'text',text:' hello',marks:[{type:'link',attrs:{href:'javascript:bad'}}]},{type:'image',attrs:{src:'bad'}}]}]},'box',{fontSize:18})
    assert.equal(storyText(story),'{{first_name}} hello')
    assert.equal(story.paragraphs[0].runs[0].field,'first_name')
    assert.ok(!JSON.stringify(story).includes('javascript:'))
  })
  it('rejects malformed input instead of storing arbitrary DOM markup', () => {
    assert.throws(()=>fromEditorDocument('<script>bad</script>','box',{fontSize:18}))
  })
})
