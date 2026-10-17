import { strict as assert } from 'assert'
import { after, afterEach, before, beforeEach, describe, it } from 'mocha'
import { JSDOM } from 'jsdom'
import { createElement, useCallback, useState, type ReactNode } from 'react'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { createDesignerDocument } from '../../components/designer/designer-templates'
import { useDesignerBootstrap } from '../../hooks/use-designer-bootstrap'
import { useDesignerSave } from '../../hooks/use-designer-save'
import { orderBootstrapSource, readBootstrapRecovery } from '../../lib/designer/bootstrap-source'
import { designerAuthenticationUrl } from '../../lib/designer/template-entry'
import { readOrderDraft, writeDraft, writePendingDesign } from '../../lib/designer/draft-context'
import { documentRevision } from '../../lib/designer/content-revision'
import { doc, memoryStorage } from './draft-context.test'

const a = { ...doc, designId: 'design-a', templateName: 'Artwork A' }
const b = { ...doc, designId: 'design-b', templateName: 'Artwork B' }
const router = { replace: () => {}, push: () => {}, refresh: () => {}, back: () => {}, forward: () => {}, prefetch: async () => {} }
const wrapper = ({children}:{children:ReactNode}) => createElement(AppRouterContext.Provider,{value:router},children)

describe('designer bootstrap context isolation', () => {
  const previous = { window: globalThis.window, document: globalThis.document, localStorage: globalThis.localStorage, fetch: globalThis.fetch }
  let dom:JSDOM
  let storage:ReturnType<typeof memoryStorage>
  let rows:Record<string,unknown>
  let getUser:() => Promise<unknown>
  let database:Parameters<typeof useDesignerBootstrap>[0]['supabase']
  before(() => {
    dom = new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/'})
    Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true})
  })
  beforeEach(() => {
    storage = memoryStorage()
    Object.assign(globalThis,{localStorage:storage})
    rows = {'design-a':a,'design-b':b}
    getUser = async () => ({data:{user:{id:'owner'}},error:null})
    database = {auth:{getUser:()=>getUser()},from:()=>{
      let id:string|undefined
      const chain = {select:()=>chain,eq:(key:string,value:string)=>{if(key==='id') id=value;return chain},single:async()=>({data:id && rows[id]?{design_data:rows[id]}:null,error:null})}
      return chain
    }} as unknown as typeof database
    globalThis.fetch = async () => new Response(JSON.stringify({orderState:{step:4,design:{designId:'design-b',designJson:b}}}))
  })
  afterEach(() => {cleanup();globalThis.fetch=previous.fetch})
  after(() => {dom.window.close();Object.assign(globalThis,previous)})
  function useEditor(query:string) {
    const [document,setDocument] = useState({...doc,templateName:'Initial canvas'})
    const hydrate = useCallback((next:typeof document)=>setDocument(next),[])
    const bootstrap = useDesignerBootstrap({supabase:database,query,hydrate})
    useDesignerSave({document,userId:bootstrap.user?.id,orderId:bootstrap.orderId,context:{designId:bootstrap.initialDesignId},enabled:!bootstrap.loading && !bootstrap.error && Boolean(bootstrap.user),storage})
    return {document,bootstrap}
  }
  it('opens explicit design B without hydrating the broad recovery pointer for A', async () => {
    writeDraft(storage,{userId:'owner',templateId:'t',designId:'design-a'},a)
    const {result}=renderHook(()=>useEditor('designId=design-b'),{wrapper})
    await waitFor(()=>assert.equal(result.current.bootstrap.loading,false))
    assert.equal(result.current.bootstrap.error,null)
    assert.equal(result.current.document.templateName,'Artwork B')
    assert.equal(result.current.bootstrap.initialDesignId,'design-b')
  })
  it('loads the owned linked design for an order-only URL and preserves order progress', async () => {
    const {result}=renderHook(()=>useEditor('orderId=order-b'),{wrapper})
    await waitFor(()=>assert.equal(result.current.bootstrap.loading,false))
    assert.equal(result.current.document.templateName,'Artwork B')
    assert.equal(result.current.bootstrap.initialDesignId,'design-b')
    assert.equal(result.current.bootstrap.orderState.step,4)
  })
  it('does not replace the linked order design with an obsolete local design from the same order', async () => {
    writeDraft(storage,{userId:'owner',templateId:'t',designId:'design-a',orderId:'order-b'},a)
    const {result}=renderHook(()=>useEditor('orderId=order-b'),{wrapper})
    await waitFor(()=>assert.equal(result.current.bootstrap.loading,false))
    assert.equal(result.current.document.templateName,'Artwork B')
    assert.equal(result.current.bootstrap.initialDesignId,'design-b')
  })
  it('keeps a deliberately chosen replacement template separate from the existing saved design id', async () => {
    const replacement={...createDesignerDocument('yellow-letter'),templateName:'Recovered replacement'}
    writeDraft(storage,{userId:'owner',templateId:'yellow-letter',orderId:'order-b'},replacement)
    const {result}=renderHook(()=>useEditor('orderId=order-b&templateId=starter-yellow-letter'),{wrapper})
    await waitFor(()=>assert.equal(result.current.bootstrap.loading,false))
    assert.equal(result.current.document.templateName,'Recovered replacement')
    assert.equal(result.current.bootstrap.initialDesignId,undefined)
    assert.equal(result.current.document.designId,undefined)
  })
  it('retains per-textbox guided mode and formatting from the linked stored document', async () => {
    const text={id:'box',name:'Box',type:'text',x:0,y:0,width:100,height:100,zIndex:0,content:'Hi',fontSize:12,fontWeight:'normal',writingMode:'guided',richText:{id:'box',style:{fontSize:12},paragraphs:[{runs:[{text:'Hi',style:{bold:true}}]}]}}
    rows['design-b']={...b,pages:{front:[text],back:[]}}
    const {result}=renderHook(()=>useEditor('orderId=order-b'),{wrapper})
    await waitFor(()=>assert.equal(result.current.bootstrap.loading,false))
    assert.deepEqual(result.current.document.pages.front[0],text)
  })
  it('shows failed or malformed linked artwork instead of resetting and autosaving a default', async () => {
    rows['design-b']={version:99}
    const {result}=renderHook(()=>useEditor('orderId=order-b'),{wrapper})
    await waitFor(()=>assert.equal(result.current.bootstrap.loading,false))
    assert.ok(result.current.bootstrap.error)
    assert.equal(result.current.document.templateName,'Initial canvas')
    assert.equal(readOrderDraft(storage,'owner','order-b'),null)
  })
  it('shows missing workflow data as an error instead of creating a blank order design', async () => {
    globalThis.fetch=async()=>new Response(JSON.stringify({}))
    const {result}=renderHook(()=>useEditor('orderId=order-b'),{wrapper})
    await waitFor(()=>assert.equal(result.current.bootstrap.loading,false))
    assert.ok(result.current.bootstrap.error)
    assert.equal(readOrderDraft(storage,'owner','order-b'),null)
  })
  it('disables local writers in the first render of a different query before loading effects run', async () => {
    writeDraft(storage,{userId:'owner',templateId:'t',designId:'design-a'},a)
    writeDraft(storage,{userId:'owner',templateId:'t',designId:'design-b',orderId:'order-b'},b)
    const {result,rerender}=renderHook(({query})=>useEditor(query),{wrapper,initialProps:{query:'designId=design-a'}})
    await waitFor(()=>assert.equal(result.current.bootstrap.loading,false))
    getUser=()=>new Promise(()=>{})
    rerender({query:'orderId=order-b&designId=design-b'})
    assert.equal(result.current.bootstrap.loading,true)
    assert.equal(readOrderDraft(storage,'owner','order-b')?.document.templateName,'Artwork B')
  })
  it('keeps explicit saved design and order/source context through login', () => {
    const login=new URL(designerAuthenticationUrl('?designId=design-b&orderId=order-b&source=design_tool'),'https://local.invalid')
    const destination=new URL(login.searchParams.get('redirectedFrom')!,'https://local.invalid')
    assert.equal(destination.searchParams.get('designId'),'design-b')
    assert.equal(destination.searchParams.get('orderId'),'order-b')
    assert.equal(destination.searchParams.get('source'),'design_tool')
    assert.equal(destination.pathname,'/design/customize')
  })
  it('supports valid unsaved legacy artwork in an owned order but rejects malformed inline designs', () => {
    assert.equal(orderBootstrapSource({design:{designId:'local-design-draft',designJson:doc}}).document?.templateId,'t')
    assert.throws(()=>orderBootstrapSource({design:{designJson:{version:99}}}))
    assert.throws(()=>orderBootstrapSource(null))
    assert.throws(()=>orderBootstrapSource({design:{designId:0}}))
    assert.equal(orderBootstrapSource({design:{designId:'local-design-draft',designJson:{...doc,designId:'local-design-draft'}}}).document?.designId,undefined)
  })
  it('associates a first-POST recovery with its actual pending id and never a different explicit id', async () => {
    const context={userId:'owner',templateId:'t',orderId:'order-a'}
    writeDraft(storage,context,doc)
    await writePendingDesign(storage,context,{ok:true,designId:'design-a',revision:await documentRevision(doc)},doc)
    writeDraft(storage,context,{...doc,templateName:'Unsaved subsequent edits'})
    assert.equal((await readBootstrapRecovery(storage,context,'design-a'))?.document.templateName,'Unsaved subsequent edits')
    assert.equal(await readBootstrapRecovery(storage,context,'design-b'),null)
  })
})
