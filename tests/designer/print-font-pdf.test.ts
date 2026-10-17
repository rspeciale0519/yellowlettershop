import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream, decodePDFRawStream } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { renderDesignToPdf } from '../../app/api/design/preview/_render/pdf-renderer'
import type { DesignerDocument } from '../../types/designer'
import { PRINT_FONT_KEYS } from '../../lib/designer/text/font-manifest'
interface EmbeddedFont { getGlyph(id:number):{path:{commands:unknown[]}} }
describe('print font PDF glyph integrity',()=>{
  for(const key of PRINT_FONT_KEYS) it(`prints every ${key} letter with a visible glyph`,async()=>{
    const input:DesignerDocument={templateId:'test',templateName:'Test',orientation:'portrait',formatId:'letter_8_5x11',pages:{front:[{id:'message',name:'Message',type:'text',x:40,y:40,width:700,height:900,zIndex:1,fontFamily:key.split('-')[0],fontSize:22,fontWeight:key.includes('bold')?'bold':'normal',fontStyle:key.includes('italic')?'italic':'normal',content:'DearneighborThankyouforreadingmyletterABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'}],back:[]},updatedAt:'now'}
    const pdf=await PDFDocument.load(await renderDesignToPdf(input,{values:{}},'letter_8_5x11','portrait'))
    const page=pdf.getPage(0)
    const resources=page.node.Resources()!.lookup(PDFName.of('Font'),PDFDict)
    const root=pdf.context.lookup(resources.entries()[0][1],PDFDict)
    const descendant=root.lookup(PDFName.of('DescendantFonts'),PDFArray).lookup(0,PDFDict)
    const descriptor=descendant.lookup(PDFName.of('FontDescriptor'),PDFDict)
    const bytes=decodePDFRawStream(descriptor.lookup(PDFName.of('FontFile2'),PDFRawStream)).decode()
    const embedded=fontkit.create(bytes) as unknown as EmbeddedFont
    const contents=page.node.Contents() as PDFArray
    let letters=0
    for(const ref of contents.asArray()){
      const commands=new TextDecoder().decode(decodePDFRawStream(pdf.context.lookup(ref,PDFRawStream)).decode())
      for(const match of commands.matchAll(/<([A-Fa-f0-9]+)>\s*Tj/g)) for(let at=0;at<match[1].length;at+=4){
        const id=parseInt(match[1].slice(at,at+4),16)
        assert.ok(embedded.getGlyph(id).path.commands.length>0,`Printed letter ${letters+1} has no visible glyph`)
        letters++
      }
    }
    assert.ok(letters>=80,'The renderer must actually include the message text')
  })
})
