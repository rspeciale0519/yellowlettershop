'use client'
import { useEffect } from 'react'
import type { OrderStepProps, MailingOptionsConfig } from '../../../types/orders'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Label } from '../../ui/label'
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group'
import { Alert, AlertDescription } from '../../ui/alert'
import { useOrderWorkflow } from '../OrderProvider'
import { useOrderQuote } from '../quotes/use-order-quote'
import { OrderQuoteSummary } from '../quotes/order-quote-summary'
import { MailingFormatOptions } from './mailing/mailing-format-options'
import { MailingServiceNotices } from './mailing/mailing-service-notices'
import { MailingShippingAddress } from './mailing/mailing-shipping-address'
import { normalizeFullServiceOptions } from '../../../lib/orders/published-mailing'

const emptyAddress = { address_line_1: '', address_line_2: '', city: '', state: '', zip_code: '' }
const services = [['full_service', 'Full Service Mailing', 'We handle printing, postage, and mailing.'], ['ship_processed', 'Ship Processed', 'We print and ship your mail pieces to you for local mailing.'], ['print_only', 'Print-Ready Files Only', 'Receive digital files for your own printing and mailing.']] as const
const postage = [['first_class_forever', 'First Class (stamps)'], ['first_class_discounted', 'First Class (permit)'], ['standard', 'Standard / Marketing Mail']] as const
export function MailingOptionsStep({ orderState }: OrderStepProps) {
  const { updateOrderState, nextStep, previousStep } = useOrderWorkflow()
  const options = orderState.mailingOptions ?? orderState.campaignSettings?.mailingOptions
  const contact = orderState.designAndContent?.contactCard ?? orderState.contactCard
  const design = orderState.designAndContent?.design ?? orderState.design
  const designFormat = (design?.designJson as Record<string, unknown> | undefined)?.formatId
  useEffect(() => {
    if (options) return
    updateOrderState({ mailingOptions: { serviceLevel: 'full_service', includePostage: true, postageType: 'first_class_forever', mailPieceFormat: (typeof designFormat === 'string' ? designFormat : 'postcard_4x6') as MailingOptionsConfig['mailPieceFormat'], paperStock: 'standard_14pt', finish: 'matte', shippingAddress: contact?.contactCardData.address } })
  }, [options, contact, designFormat, updateOrderState])
  const quote = useOrderQuote(orderState, updateOrderState)
  const base: MailingOptionsConfig = options ?? { serviceLevel: 'full_service', includePostage: true }
  const quantity = orderState.addressValidation?.deliverableRecords ?? orderState.accuzipValidation?.deliverableRecords ?? quote.pricing?.validatedQuantity ?? 0
  const update = (patch: Partial<MailingOptionsConfig>) => updateOrderState({ mailingOptions: normalizeFullServiceOptions({ ...base, ...patch }, quantity) })
  useEffect(() => {
    if (!options || options.serviceLevel !== 'full_service') return
    const normalized = normalizeFullServiceOptions(options, quantity)
    if (normalized.includePostage !== options.includePostage || normalized.postageType !== options.postageType) updateOrderState({ mailingOptions: normalized })
  }, [options, quantity, updateOrderState])
  const shipping = base.shippingAddress ?? contact?.contactCardData.address ?? emptyAddress
  const physical = base.serviceLevel !== 'print_only'
  const canProceed = Boolean(options && (!physical || (base.mailPieceFormat && base.paperStock && base.finish && shipping.address_line_1 && shipping.city && shipping.state && shipping.zip_code && (base.serviceLevel !== 'full_service' || base.includePostage))))
  return <div className="max-w-4xl mx-auto space-y-6">
    <div className="text-center"><h2 className="text-3xl font-bold">Mailing Options</h2><p>Choose how your mail pieces are processed and delivered.</p></div>
    <Card><CardHeader><CardTitle>Service Level</CardTitle></CardHeader><CardContent><RadioGroup value={base.serviceLevel} onValueChange={value => update({ serviceLevel: value as MailingOptionsConfig['serviceLevel'], includePostage: value === 'full_service', shippingAddress: value === 'print_only' ? undefined : shipping })}>
      {services.map(([value, label, description]) => <div key={value} className="flex items-start gap-3 p-4 border rounded-lg"><RadioGroupItem id={value} value={value} /><div><Label htmlFor={value}>{label}</Label><p className="text-sm text-gray-600">{description}</p></div></div>)}
    </RadioGroup></CardContent></Card>
    {physical && <MailingFormatOptions options={base} onChange={update} />}
    {base.serviceLevel === 'full_service' && <Card><CardHeader><CardTitle>Postage</CardTitle></CardHeader><CardContent className="space-y-4">
      <p className="text-sm text-gray-600">Published mailing prices include printing and postage. Quantity pricing is already included.</p>
      <RadioGroup value={base.postageType} onValueChange={value => update({ postageType: value as MailingOptionsConfig['postageType'] })}>{postage.map(([value, label]) => <div key={value} className="flex items-center gap-2"><RadioGroupItem id={value} value={value} disabled={value === 'standard' && Boolean(base.mailPieceFormat?.startsWith('postcard_')) && quantity > 0 && quantity < 250} /><Label htmlFor={value}>{label}</Label></div>)}</RadioGroup>
      {base.mailPieceFormat?.startsWith('postcard_') && <p className="text-sm text-gray-600">Postcard quantities below 250 use First Class postage.</p>}
    </CardContent></Card>}
    <OrderQuoteSummary pricing={quote.pricing} isLoading={quote.isLoading} error={quote.error} onRetry={quote.refresh} />
    {physical && <MailingShippingAddress address={shipping} contactAddress={contact?.contactCardData.address} onChange={address => update({ shippingAddress: address })} />}
    <MailingServiceNotices service={base.serviceLevel} />
    {!canProceed && <Alert><AlertDescription>Complete the format, postage, and address fields for the selected service.</AlertDescription></Alert>}
    <div className="flex justify-between border-t pt-6"><Button variant="outline" onClick={previousStep}>Back</Button><Button onClick={nextStep} disabled={!canProceed}>Continue</Button></div>
  </div>
}
