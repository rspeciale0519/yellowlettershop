import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { collectDocumentIssues } from '../../lib/designer/document-issues'
import { preflightRecipients } from '../../lib/designer/preflight-recipients'
import { normalizeDesignerDocument } from '../../lib/designer/document/normalize'
import { layoutDesignerDocument } from '../../lib/designer/text/layout'
import type { FontMetrics } from '../../lib/designer/text/types'
const metrics: FontMetrics={measure:(text,style)=>text.length*style.fontSize*.5,ascent:style=>style.fontSize*.8,supports:()=>true}
function doc(){return normalizeDesignerDocument({templateId:'t',templateName:'T',orientation:'portrait',pages:{front:[],back:[{id:'message',name:'Message',type:'text',content:'{{first_name}}',fontSize:16,fontWeight:'normal',x:50,y:50,width:100,height:35,zIndex:1}]},updatedAt:'now'})}
describe('all-side document issues',()=>{
 it('blocks text or other content overlapping visible postage on any printed side',()=>{
  const input=doc()
  input.pages.back.push({id:'stamp',name:'Stamp',type:'postage',kind:'stamp',x:100,y:50,width:96,height:108,zIndex:2})
  const issues=collectDocumentIssues(input,layoutDesignerDocument(input,{},metrics))
  assert.ok(issues.some(issue=>issue.elementId==='message' && issue.pageId==='back' && issue.rule==='postage-overlap' && issue.severity==='error'))
 })
 it('detects overflow on an inactive printed side after personalization',()=>{
  const input=doc(),values={first_name:'Alexandria'.repeat(30)}
  const issues=collectDocumentIssues(input,layoutDesignerDocument(input,values,metrics),{}, {mode:'actual',values})
  assert.ok(issues.some(issue=>issue.pageId==='back' && issue.rule==='overflow' && issue.severity==='error'))
 })
 it('reports missing actual fields while labeled samples stay editable',()=>{
  const input=doc(),layout=layoutDesignerDocument(input,{},metrics)
  assert.ok(collectDocumentIssues(input,layout,{}, {mode:'actual',values:{}}).some(issue=>issue.rule==='missing-field'))
  assert.ok(!collectDocumentIssues(input,layout,{}, {mode:'sample',values:{}}).some(issue=>issue.rule==='missing-field'))
 })
 it('checks later recipients when the first one fits',async()=>{
  const issues=await preflightRecipients(doc(),[{id:'first',values:{first_name:'Al'}},{id:'later',values:{first_name:'Alexandria'.repeat(30)}}],metrics)
  assert.ok(issues.some(issue=>issue.recipientId==='later' && issue.rule==='overflow'))
  assert.ok(!issues.some(issue=>issue.recipientId==='first'))
 })
})
