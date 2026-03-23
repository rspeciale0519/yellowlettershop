'use client'

import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, AlertTriangle } from 'lucide-react'
import { US_STATES } from '@/data/us-states'

const RecipientSchema = z.object({
  firstName:    z.string().min(1, 'Required'),
  lastName:     z.string().min(1, 'Required'),
  addressLine1: z.string().min(1, 'Required'),
  addressLine2: z.string().optional(),
  city:         z.string().min(1, 'Required'),
  state:        z.string().min(2, 'Required'),
  zipCode:      z.string().regex(/^\d{5}(-\d{4})?$/, 'Enter a valid ZIP (e.g. 12345)')
})

export type ManualRecord = z.infer<typeof RecipientSchema>

const EMPTY: ManualRecord = {
  firstName: '', lastName: '', addressLine1: '', addressLine2: '',
  city: '', state: '', zipCode: ''
}

interface ManualEntryFormProps {
  records: ManualRecord[]
  onRecordsChange: (records: ManualRecord[]) => void
}

export function ManualEntryForm({ records, onRecordsChange }: ManualEntryFormProps) {
  const [fields, setFields] = useState<ManualRecord>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof ManualRecord, string>>>({})

  const set = (key: keyof ManualRecord, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const handleAdd = () => {
    const result = RecipientSchema.safeParse(fields)
    if (!result.success) {
      const map: typeof errors = {}
      result.error.errors.forEach(e => { map[e.path[0] as keyof ManualRecord] = e.message })
      setErrors(map)
      return
    }
    onRecordsChange([...records, result.data])
    setFields(EMPTY)
    setErrors({})
  }

  const handleRemove = (idx: number) =>
    onRecordsChange(records.filter((_, i) => i !== idx))

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="firstName">First Name *</Label>
            <Input id="firstName" value={fields.firstName} onChange={e => set('firstName', e.target.value)} />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input id="lastName" value={fields.lastName} onChange={e => set('lastName', e.target.value)} />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="addressLine1">Address Line 1 *</Label>
          <Input id="addressLine1" value={fields.addressLine1} onChange={e => set('addressLine1', e.target.value)} />
          {errors.addressLine1 && <p className="text-xs text-destructive">{errors.addressLine1}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="addressLine2">Address Line 2</Label>
          <Input
            id="addressLine2"
            value={fields.addressLine2}
            onChange={e => set('addressLine2', e.target.value)}
            placeholder="Apt, Suite, Unit (optional)"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="city">City *</Label>
            <Input id="city" value={fields.city} onChange={e => set('city', e.target.value)} />
            {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
          </div>
          <div className="space-y-1">
            <Label>State *</Label>
            <Select value={fields.state} onValueChange={v => set('state', v)}>
              <SelectTrigger>
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input
              id="zipCode"
              value={fields.zipCode}
              onChange={e => set('zipCode', e.target.value)}
              placeholder="12345"
            />
            {errors.zipCode && <p className="text-xs text-destructive">{errors.zipCode}</p>}
          </div>
        </div>

        <Button type="button" onClick={handleAdd} className="w-full">
          Add Recipient
        </Button>
      </div>

      {records.length >= 20 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            For large lists, uploading a CSV is faster.
          </AlertDescription>
        </Alert>
      )}

      {records.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r, i) => (
              <TableRow key={i}>
                <TableCell>{r.firstName} {r.lastName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.addressLine1}, {r.city}, {r.state} {r.zipCode}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
