import { CreditCard, Mail } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PUBLISHED_LETTER_RATES, PUBLISHED_POSTCARD_RATES, PUBLISHED_PRICING_SOURCE, PUBLISHED_QUANTITY_BANDS, type PublishedLetterService } from '@/lib/orders/published-pricing'

const letterColumns: readonly { key: PublishedLetterService; label: string }[] = [
  { key: 'mailed_sc', label: 'Mailed for you (SC)' },
  { key: 'mailed_fc', label: 'Mailed for you (FC)' },
  { key: 'shipped_fc', label: 'Shipped to you (FC)' },
  { key: 'shipped_np', label: 'Shipped to you (NP)' },
  { key: 'shipped_po', label: 'Shipped to you (PO)' },
]
const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`

function PublishedSourceNotice() {
  return (
    <p className="mb-4 text-sm text-muted-foreground">
      Published rates effective July 12, 2026, including the USPS price update.{' '}
      <a href={PUBLISHED_PRICING_SOURCE.url} className="underline underline-offset-2" target="_blank" rel="noopener noreferrer">Source: Yellow Letter Shop</a>.
    </p>
  )
}

export function PublishedLetterPricing() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-yellow-500" />Letter Pricing</CardTitle>
        <CardDescription>Per-piece rates by quantity and delivery method. Mailed rates include printing and postage.</CardDescription>
      </CardHeader>
      <CardContent>
        <PublishedSourceNotice />
        <p className="mb-3 text-sm text-muted-foreground">SC = Standard Class | FC = First Class | NP = No Postage | PO = Print Only</p>
        <div className="overflow-x-auto">
          <Table aria-label="Letter pricing per piece">
            <TableHeader><TableRow>
              <TableHead className="font-semibold">Quantity</TableHead>
              {letterColumns.map(column => <TableHead key={column.key} className="text-center">{column.label}</TableHead>)}
            </TableRow></TableHeader>
            <TableBody>
              {PUBLISHED_QUANTITY_BANDS.map((band, index) => <TableRow key={band.min}>
                <TableCell className="font-medium">{band.label}</TableCell>
                {letterColumns.map(column => <TableCell key={column.key} className="text-center font-semibold">{dollars(PUBLISHED_LETTER_RATES[column.key][index])}</TableCell>)}
              </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export function PublishedPostcardPricing() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-yellow-500" />Postcard Pricing</CardTitle>
        <CardDescription>Per-piece mailing rates by size, postage class, and quantity.</CardDescription>
      </CardHeader>
      <CardContent>
        <PublishedSourceNotice />
        <p className="mb-3 text-sm text-muted-foreground">SC = Standard Class | FC = First Class</p>
        <div className="overflow-x-auto">
          <Table aria-label="Postcard pricing per piece">
            <TableHeader><TableRow>
              <TableHead className="font-semibold">Size (Postage)</TableHead>
              {PUBLISHED_QUANTITY_BANDS.map(band => <TableHead key={band.min} className="text-center whitespace-nowrap">{band.label}</TableHead>)}
            </TableRow></TableHeader>
            <TableBody>
              {PUBLISHED_POSTCARD_RATES.map(row => <TableRow key={`${row.format}-${row.postageClass}`}>
                <TableCell className="font-medium whitespace-nowrap">{row.label}</TableCell>
                {row.rates.map((rate, index) => <TableCell key={index} className="text-center font-semibold whitespace-nowrap">
                  {dollars(rate)}{row.postageClass === 'sc' && index === 0 ? <span>* (FC)</span> : null}
                </TableCell>)}
              </TableRow>)}
            </TableBody>
          </Table>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">* Mail quantities of less than 250 must be mailed with First Class postage.</p>
      </CardContent>
    </Card>
  )
}
