"use client"

import React, { useState, useEffect } from 'react'
import { OrderStepProps, ContactCard } from '@/types/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Plus, 
  Check, 
  Edit3, 
  MapPin, 
  Mail, 
  Phone,
  Building,
  Star,
  AlertCircle
} from 'lucide-react'
import { useOrderWorkflow } from '../OrderProvider'
import { useToast } from '@/components/ui/use-toast'
import { ContactCardForm } from '../contact-card-form'

export function ContactCardsStep({ orderState }: OrderStepProps) {
  const { updateOrderState, nextStep, previousStep } = useOrderWorkflow()
  const { toast } = useToast()
  const [contactCards, setContactCards] = useState<ContactCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    orderState.contactCard?.contactCardId || null
  )

  // Load contact cards on component mount
  useEffect(() => {
    loadContactCards()
  }, [])

  const loadContactCards = async () => {
    try {
      const response = await fetch('/api/contact-cards')
      if (!response.ok) {
        throw new Error('Failed to load contact cards')
      }
      
      const cards = await response.json()
      
      // Transform supabase format to order workflow format
      const transformedCards = cards.map((card: any) => ({
        id: card.id,
        firstName: card.first_name,
        lastName: card.last_name,
        company: card.company,
        address: {
          address_line_1: card.street_address,
          address_line_2: card.suite_unit_apt,
          city: card.city,
          state: card.state,
          zip_code: card.zip_code
        },
        email: card.email,
        phone: card.phone,
        isDefault: card.is_default,
        userId: card.user_id,
        createdAt: new Date(card.created_at),
        updatedAt: new Date(card.updated_at)
      }))
      
      setContactCards(transformedCards)
      
      // Auto-select default card if none selected
      if (!selectedCardId && transformedCards.length > 0) {
        const defaultCard = transformedCards.find((card: ContactCard) => card.isDefault)
        if (defaultCard) {
          setSelectedCardId(defaultCard.id)
          handleCardSelect(defaultCard)
        }
      }
    } catch (error) {
      console.error('Failed to load contact cards:', error)
      toast({
        title: "Load failed",
        description: "Unable to load contact cards. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCardSelect = (card: ContactCard) => {
    setSelectedCardId(card.id)
    updateOrderState({
      contactCard: {
        contactCardId: card.id,
        contactCardData: card
      }
    })
  }

  const handleCreateNew = () => {
    setShowCreateForm(true)
  }

  const canProceed = () => {
    return selectedCardId && orderState.contactCard
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contact cards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Contact Cards</h2>
        <p className="text-gray-600">
          Select the sender information that will appear on your mail pieces
        </p>
      </div>

      {/* Information Alert */}
      <Alert>
        <User className="h-4 w-4" />
        <AlertDescription>
          Contact cards contain the sender information (return address) that will be printed on your mail pieces. 
          This information is also used for variable injection when personalizing your designs.
        </AlertDescription>
      </Alert>

      {/* Contact Cards Grid */}
      {contactCards.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {contactCards.map((card) => (
            <Card 
              key={card.id}
              className={`cursor-pointer transition-all border-2 ${
                selectedCardId === card.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleCardSelect(card)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>{card.firstName} {card.lastName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {card.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                    {selectedCardId === card.id && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {card.company && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span>{card.company}</span>
                  </div>
                )}
                
                <div className="flex items-start space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <div>{card.address.address_line_1}</div>
                    {card.address.address_line_2 && (
                      <div>{card.address.address_line_2}</div>
                    )}
                    <div>
                      {card.address.city}, {card.address.state} {card.address.zip_code}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{card.email}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{card.phone}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create New Contact Card Button */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <CardContent className="p-6">
          <Button 
            variant="ghost" 
            className="w-full h-auto p-6 flex flex-col items-center space-y-3"
            onClick={handleCreateNew}
          >
            <Plus className="h-8 w-8 text-gray-400" />
            <div className="text-center">
              <div className="font-medium text-gray-900">Create New Contact Card</div>
              <div className="text-sm text-gray-500">Add a new sender address</div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* No Contact Cards State */}
      {contactCards.length === 0 && !showCreateForm && (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Contact Cards Found</h3>
            <p className="text-gray-600 mb-6">
              You need to create a contact card before proceeding with your order.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Contact Card
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Selected Card Summary */}
      {selectedCardId && orderState.contactCard && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Check className="h-5 w-5" />
              <span>Selected Contact Card</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium text-green-800 mb-2">Sender Information:</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <div>{orderState.contactCard.contactCardData.firstName} {orderState.contactCard.contactCardData.lastName}</div>
                  {orderState.contactCard.contactCardData.company && (
                    <div>{orderState.contactCard.contactCardData.company}</div>
                  )}
                  <div>{orderState.contactCard.contactCardData.address.address_line_1}</div>
                  {orderState.contactCard.contactCardData.address.address_line_2 && (
                    <div>{orderState.contactCard.contactCardData.address.address_line_2}</div>
                  )}
                  <div>
                    {orderState.contactCard.contactCardData.address.city}, {orderState.contactCard.contactCardData.address.state} {orderState.contactCard.contactCardData.address.zip_code}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-green-800 mb-2">Available Variables:</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <div><code>{"{{sender_first}}"}</code> - {orderState.contactCard.contactCardData.firstName}</div>
                  <div><code>{"{{sender_last}}"}</code> - {orderState.contactCard.contactCardData.lastName}</div>
                  <div><code>{"{{sender_company}}"}</code> - {orderState.contactCard.contactCardData.company || 'N/A'}</div>
                  <div><code>{"{{sender_phone}}"}</code> - {orderState.contactCard.contactCardData.phone}</div>
                  <div><code>{"{{sender_email}}"}</code> - {orderState.contactCard.contactCardData.email}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Card Creation Form */}
      <ContactCardForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={loadContactCards}
      />

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={previousStep}>
          Back
        </Button>
        <Button 
          onClick={nextStep}
          disabled={!canProceed()}
        >
          Continue to Design
        </Button>
      </div>
    </div>
  )
}