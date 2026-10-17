'use client'
import type { OrderState, PricingBreakdown } from '../../../types/orders'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'

const formatLabels: Record<string, string> = { postcard_4x6: '4 × 6 Postcard', postcard_5x7: '5 × 7 Postcard', postcard_6x9: '6 × 9 Postcard', postcard_6x11: '6 × 11 Postcard', letter_8_5x11: '8.5 × 11 Letter', letter_folded: 'Folded Letter' }
const stockLabels: Record<string, string> = { standard_14pt: 'Standard 14pt', premium_16pt: 'Premium 16pt', luxury_18pt: 'Luxury 18pt' }
const finishLabels: Record<string, string> = { matte: 'Matte', gloss: 'Gloss', uv_coating: 'UV Coating' }
const postageLabels: Record<string, string> = { first_class_forever: 'First-Class Forever', first_class_discounted: 'First-Class Discounted', standard: 'Standard / Marketing Mail' }
const serviceLabels: Record<string, string> = { full_service: 'Full Service: Print + Postage + Mail', ship_processed: 'Ship Processed: Print + Ship to You', print_only: 'Print Only: Digital Files' }
export function OrderReviewDetails({ state, pricing }: { state: OrderState; pricing?: PricingBreakdown }) {
  const contact = (state.designAndContent?.contactCard ?? state.contactCard)?.contactCardData
  const design = state.designAndContent?.design ?? state.design
  const mailing = state.mailingOptions ?? state.campaignSettings?.mailingOptions
  const campaign = state.campaignSettings?.campaignOptions ?? state.campaignOptions
  const source = (state.dataAndMapping?.listData ?? state.listData)?.dataSource
  const quantity = pricing?.validatedQuantity ?? state.addressValidation?.deliverableRecords ?? state.accuzipValidation?.deliverableRecords ?? 0
  const date = campaign?.scheduledStartDate ? new Date(campaign.scheduledStartDate) : undefined
  const address = mailing?.shippingAddress
  return <Card>
    <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
    <CardContent className="grid sm:grid-cols-2 gap-6">
      <section><h3 className="font-medium mb-2">Mailing List</h3>
        <p>{quantity} {pricing?.quoteStatus === 'final' ? 'validated pieces' : 'estimated pieces'}</p>
        {source && <p className="text-sm text-gray-600">{source.replaceAll('_', ' ')}</p>}
      </section>
      <section><h3 className="font-medium mb-2">Sender Information</h3>
        {contact ? <address className="not-italic text-sm space-y-1">
          <p>{contact.firstName} {contact.lastName}</p><p>{contact.company}</p>
          <p>{contact.address.address_line_1} {contact.address.address_line_2}</p>
          <p>{contact.address.city}, {contact.address.state} {contact.address.zip_code}</p>
          <p>{contact.email}</p><p>{contact.phone}</p>
        </address> : <p>No contact card selected.</p>}
      </section>
      <section><h3 className="font-medium mb-2">Design &amp; Print Options</h3>
        <p>{design?.isCustomDesign ? 'Custom Design' : 'Template Design'}</p>
        <p>{mailing?.mailPieceFormat ? formatLabels[mailing.mailPieceFormat] : 'Format not selected'}</p>
        {pricing?.printedSideCount !== undefined && <p>{pricing.printedSideCount} printed sides per piece</p>}
        <p>{mailing?.paperStock ? stockLabels[mailing.paperStock] : ''}{mailing?.finish ? ` · ${finishLabels[mailing.finish]}` : ''}</p>
        {Boolean(design?.variablesUsed?.length) && <p>{design!.variablesUsed.length} personalization variables</p>}
      </section>
      <section><h3 className="font-medium mb-2">Mailing &amp; Shipping</h3>
        <p>{mailing ? serviceLabels[mailing.serviceLevel] : 'Service not selected'}</p>
        <p>{mailing?.includePostage && mailing.postageType ? postageLabels[mailing.postageType] : 'Postage not included'}</p>
        {address && mailing?.serviceLevel !== 'print_only' && <address className="not-italic text-sm mt-2"><p>{mailing?.serviceLevel === 'ship_processed' ? 'Ship to:' : 'Billing address:'}</p><p>{address.address_line_1} {address.address_line_2}</p><p>{address.city}, {address.state} {address.zip_code}</p></address>}
      </section>
      <section className="sm:col-span-2"><h3 className="font-medium mb-2">Campaign Settings</h3>
        {campaign?.isSplitCampaign ? <p>{campaign.splitConfig?.numberOfDrops} drops every {campaign.splitConfig?.intervalWeeks} weeks</p> : <p>Single mailing drop</p>}
        {campaign?.isRepeating ? <p>{campaign.repeatConfig?.repetitions} repetitions, {campaign.repeatConfig?.frequency}</p> : <p>No repeat campaign</p>}
        {date && !Number.isNaN(date.getTime()) && <p>Scheduled start: {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</p>}
      </section>
    </CardContent>
  </Card>
}
