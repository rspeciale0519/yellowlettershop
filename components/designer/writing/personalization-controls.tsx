"use client"
import { RecipientPicker } from '@/components/designer/preview/recipient-picker'
import { useDesignerTextLayout } from './text-layout-context'
export function PersonalizationControls(){
 const context=useDesignerTextLayout()
 if(!context) return null
 return <div className="space-y-4 p-4 text-sm">
  <h2 className="font-semibold">Personalize your message</h2>
  <p className="rounded border p-2" role="status">{context.mode==='sample'?'Sample preview — example recipient details':'Previewing a selected recipient'}</p>
  <RecipientPicker onSelect={context.setRecipient}/>
  <div className="space-y-1 rounded border p-3"><h3 className="font-medium">Sender</h3>{Object.values(context.sender).some(Boolean)?<p>{[context.sender.firstName,context.sender.lastName].filter(Boolean).join(' ')}<br/>{context.sender.company}<br/>{context.sender.phone}</p>:<p className="text-muted-foreground">Example sender details are shown while designing. Add your sender details in the order.</p>}</div>
  <p className="text-xs text-muted-foreground">Use Insert a field in a text box to personalize at the cursor. The order checks every recipient before proof approval.</p>
 </div>
}
