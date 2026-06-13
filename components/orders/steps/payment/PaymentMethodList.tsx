import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, CheckCircle, ExternalLink } from 'lucide-react'

export interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault?: boolean
}

interface Props {
  methods: PaymentMethod[]
  selectedId: string | null
  isLoading: boolean
  onSelect: (id: string) => void
  onAddNew: () => void
}

/** Saved-card picker for the payment step. */
export function PaymentMethodList({ methods, selectedId, isLoading, onSelect, onAddNew }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Payment Method</span>
        </CardTitle>
        <CardDescription>Select or add a payment method for this order</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600">Loading payment methods...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {methods.length > 0 ? (
              methods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedId === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onSelect(method.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {method.brand.toUpperCase()} ending in {method.last4}
                        </div>
                        <div className="text-sm text-gray-600">
                          Expires {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
                        </div>
                      </div>
                    </div>

                    {selectedId === method.id && <CheckCircle className="h-5 w-5 text-blue-600" />}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Methods</h3>
                <p className="text-gray-600 mb-4">Add a payment method to complete your order</p>
              </div>
            )}

            <Button variant="outline" className="w-full flex items-center space-x-2" onClick={onAddNew}>
              <CreditCard className="h-4 w-4" />
              <span>Add New Payment Method</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
