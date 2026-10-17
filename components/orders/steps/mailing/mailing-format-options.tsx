'use client'
import type { MailingOptionsConfig } from '../../../../types/orders'
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card'
import { Label } from '../../../ui/label'
import { RadioGroup, RadioGroupItem } from '../../../ui/radio-group'

type Props = { options: MailingOptionsConfig; onChange: (patch: Partial<MailingOptionsConfig>) => void }
const formats = [['postcard_4x6', '4 × 6 Postcard'], ['postcard_5x7', '5 × 7 Postcard'], ['postcard_6x9', '6 × 9 Postcard'], ['postcard_6x11', '6 × 11 Postcard'], ['letter_8_5x11', '8.5 × 11 Letter'], ['letter_folded', 'Folded Letter']] as const
const stocks = [['standard_14pt', 'Standard 14pt'], ['premium_16pt', 'Premium 16pt'], ['luxury_18pt', 'Luxury 18pt']] as const
const finishes = [['matte', 'Matte'], ['gloss', 'Gloss'], ['uv_coating', 'UV Coating']] as const
export function MailingFormatOptions({ options, onChange }: Props) {
  return <Card><CardHeader><CardTitle>Mail Piece Format</CardTitle></CardHeader><CardContent className="space-y-5">
    <fieldset><legend className="font-medium mb-3">Format &amp; Size</legend><RadioGroup value={options.mailPieceFormat} onValueChange={value => onChange({ mailPieceFormat: value as MailingOptionsConfig['mailPieceFormat'] })} className="grid sm:grid-cols-2 gap-3">{formats.map(([value, label]) => <div key={value} className="flex items-center gap-2"><RadioGroupItem id={value} value={value} /><Label htmlFor={value}>{label}</Label></div>)}</RadioGroup></fieldset>
    <fieldset><legend className="font-medium mb-3">Paper Stock</legend><RadioGroup value={options.paperStock} onValueChange={value => onChange({ paperStock: value as MailingOptionsConfig['paperStock'] })}>{stocks.map(([value, label]) => <div key={value} className="flex items-center gap-2"><RadioGroupItem id={value} value={value} /><Label htmlFor={value}>{label}</Label></div>)}</RadioGroup></fieldset>
    <fieldset><legend className="font-medium mb-3">Finish</legend><RadioGroup value={options.finish} onValueChange={value => onChange({ finish: value as MailingOptionsConfig['finish'] })}>{finishes.map(([value, label]) => <div key={value} className="flex items-center gap-2"><RadioGroupItem id={value} value={value} /><Label htmlFor={value}>{label}</Label></div>)}</RadioGroup></fieldset>
  </CardContent></Card>
}
