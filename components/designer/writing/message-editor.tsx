"use client"
import { useEffect, useRef } from 'react'
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react'
import { Node, mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { elementStory } from '@/lib/designer/text/layout'
import { fromEditorDocument, storyText, toEditorDocument } from '@/lib/designer/text/rich-text-schema'
import { Button } from '@/components/ui/button'
import type { TextDesignElement } from '@/types/designer'
const Field = Node.create({
  name:'personalization', group:'inline', inline:true, atom:true,
  addAttributes: () => ({ field:{default:'first_name'} }),
  parseHTML: () => [{tag:'span[data-field]'}],
  renderHTML: ({node,HTMLAttributes}) => ['span',mergeAttributes(HTMLAttributes,{'data-field':node.attrs.field,class:'rounded bg-yellow-100 px-1 text-slate-900'}),`{{${node.attrs.field}}}`],
})
const FIELDS = ['first_name','last_name','full_name','address_line_1','city','state','zip_code','sender_first','sender_last','sender_phone','sender_company','sender_email']
export function MessageEditor({ element,onUpdate }: { element:TextDesignElement; onUpdate:(updates:Partial<TextDesignElement>)=>void }) {
  const updateRef = useRef(onUpdate)
  updateRef.current = onUpdate
  const elementRef = useRef(element)
  elementRef.current = element
  const editor = useEditor({
    extensions:[StarterKit.configure({heading:false,blockquote:false,bulletList:false,orderedList:false,listItem:false,code:false,codeBlock:false,strike:false,link:false,horizontalRule:false}),TextAlign.configure({types:['paragraph']}),Field],
    content:toEditorDocument(elementStory(element)) as JSONContent,
    immediatelyRender:false,
    editable:!element.locked && !element.continuesFrom,
    editorProps:{ attributes:{role:'textbox','aria-label':'Message text','aria-multiline':'true',class:'min-h-48 whitespace-pre-wrap p-3 outline-none'} },
    onUpdate:({editor:current}) => {
      const source = elementRef.current
      const richText = fromEditorDocument(current.getJSON(),source.id,elementStory(source).style)
      updateRef.current({richText,content:storyText(richText)})
    },
  },[element.id])
  useEffect(() => {
    if (!editor || editor.isFocused) return
    const next = toEditorDocument(elementStory(element))
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(next)) editor.commands.setContent(next as JSONContent,{emitUpdate:false})
  },[editor,element])
  useEffect(() => { editor?.setEditable(!element.locked && !element.continuesFrom) },[editor,element.locked,element.continuesFrom])
  if (!editor) return <p className="text-sm text-muted-foreground">Loading text editor…</p>
  const action = (label:string,active:boolean,run:()=>void) => <Button type="button" key={label} size="sm" variant={active?'secondary':'ghost'} aria-label={label} aria-pressed={active} onClick={run} disabled={Boolean(element.locked || element.continuesFrom)}>{label}</Button>
  return <div className="rounded-md border bg-background">
    <div className="flex flex-wrap gap-1 border-b p-1" role="toolbar" aria-label="Message formatting">
      {action('Bold',editor.isActive('bold'),()=>{editor.chain().focus().toggleBold().run()})}
      {action('Italic',editor.isActive('italic'),()=>{editor.chain().focus().toggleItalic().run()})}
      {action('Underline',editor.isActive('underline'),()=>{editor.chain().focus().toggleUnderline().run()})}
      {(['left','center','right'] as const).map(align=>action(`Align ${align}`,editor.isActive({textAlign:align}),()=>{editor.chain().focus().setTextAlign(align).run()}))}
      <select aria-label="Insert personalization field" className="max-w-full rounded border bg-background p-1 text-xs" value="" disabled={Boolean(element.locked || element.continuesFrom)} onChange={event=>{if(event.target.value) editor.chain().focus().insertContent({type:'personalization',attrs:{field:event.target.value}}).run()}}>
        <option value="">Insert a field…</option>{FIELDS.map(field=><option key={field} value={field}>{field.replaceAll('_',' ')}</option>)}
      </select>
    </div>
    {element.continuesFrom && <p className="p-2 text-xs text-muted-foreground">This box continues the message from the previous side. Edit the original text box.</p>}
    <EditorContent editor={editor}/>
  </div>
}
