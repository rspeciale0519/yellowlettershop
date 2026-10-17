'use client'
import type { MailingOptionsConfig } from '../../../../types/orders'
import { Alert, AlertDescription } from '../../../ui/alert'
const notices = {
  full_service: 'Full service includes CASS-certified addressing, printing, postage, and USPS drop-off. Your mail will be processed and mailed within 3-5 business days.',
  ship_processed: "Printed mail pieces will be shipped to your address within 2-3 business days. You'll need to apply postage and mail locally.",
  print_only: "You'll receive print-ready PDF files optimized for commercial printing. Files will be available for download immediately after order completion.",
}
const delivery = { full_service: '5-7 business days', ship_processed: '2-3 business days', print_only: '0-1 business days' }
export function MailingServiceNotices({ service }: { service: MailingOptionsConfig['serviceLevel'] }) {
  return <div className="space-y-3">
    <Alert><AlertDescription>{notices[service]}</AlertDescription></Alert>
    <p className="text-sm text-gray-600">Estimated delivery: {delivery[service]}. Campaign schedules and repeat drops are shown at review.</p>
  </div>
}
