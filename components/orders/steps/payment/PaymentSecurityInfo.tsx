import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Lock, Clock, CheckCircle } from 'lucide-react'

const ITEMS = [
  { icon: Lock, title: 'SSL Encrypted', detail: '256-bit encryption', tone: 'text-green-600' },
  { icon: Shield, title: 'PCI Compliant', detail: 'Secure card processing', tone: 'text-green-600' },
  { icon: Clock, title: 'Payment Hold', detail: 'Authorized, not charged', tone: 'text-blue-600' },
  { icon: CheckCircle, title: 'Charge on Approval', detail: 'After proof approval', tone: 'text-blue-600' },
]

/** Static trust/securty explainer for the payment step. */
export function PaymentSecurityInfo() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Secure Payment Processing</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {ITEMS.map((item) => (
              <div key={item.title} className="flex items-center space-x-3">
                <item.icon className={`h-5 w-5 ${item.tone}`} />
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-gray-600">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          <strong>Payment Authorization:</strong> Your card will be authorized for the full amount,
          but not charged until you approve the final proof. This ensures you&apos;re satisfied with
          the design before payment is captured.
        </AlertDescription>
      </Alert>
    </>
  )
}
