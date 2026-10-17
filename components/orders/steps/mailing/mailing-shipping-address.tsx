'use client'
import type { MailingOptionsConfig } from '../../../../types/orders'
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card'
import { Input } from '../../../ui/input'
import { Label } from '../../../ui/label'
import { Button } from '../../../ui/button'

type Address = NonNullable<MailingOptionsConfig['shippingAddress']>
const fields = [['address_line_1', 'Address Line 1'], ['address_line_2', 'Address Line 2'], ['city', 'City'], ['state', 'State'], ['zip_code', 'ZIP Code']] as const
export function MailingShippingAddress({ address, onChange, contactAddress }: { address: Address; onChange: (address: Address) => void; contactAddress?: Address }) {
  return <Card><CardHeader><CardTitle>Shipping Address</CardTitle></CardHeader><CardContent className="space-y-4">
    <Button variant="outline" disabled={!contactAddress} onClick={() => contactAddress && onChange(contactAddress)}>Use Contact Card Address</Button>
    <div className="grid sm:grid-cols-2 gap-4">{fields.map(([field, label]) => <div key={field}><Label htmlFor={`shipping-${field}`}>{label}{field === 'address_line_2' ? '' : ' *'}</Label><Input id={`shipping-${field}`} value={address[field] ?? ''} onChange={event => onChange({ ...address, [field]: event.target.value })} maxLength={field === 'state' ? 2 : undefined} /></div>)}</div>
  </CardContent></Card>
}
