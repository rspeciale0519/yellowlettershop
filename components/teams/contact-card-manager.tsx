'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Star,
  MapPin,
  Mail,
  Phone
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  getContactCards, 
  createContactCard, 
  updateContactCard, 
  deleteContactCard, 
  setDefaultContactCard 
} from '@/lib/supabase/teams'
import type { ContactCard } from '@/types/supabase'

export function ContactCardManager() {
  const [contactCards, setContactCards] = useState<ContactCard[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<ContactCard | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    first_name: '',
    last_name: '',
    street_address: '',
    suite_unit_apt: '',
    city: '',
    state: '',
    zip_code: '',
    email: '',
    phone: '',
    is_default: false
  })

  useEffect(() => {
    loadContactCards()
  }, [])

  const loadContactCards = async () => {
    try {
      const cards = await getContactCards()
      setContactCards(cards)
    } catch (error) {
      console.error('Error loading contact cards:', error)
      toast.error('Failed to load contact cards')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      first_name: '',
      last_name: '',
      street_address: '',
      suite_unit_apt: '',
      city: '',
      state: '',
      zip_code: '',
      email: '',
      phone: '',
      is_default: false
    })
    setEditingCard(null)
  }

  const handleOpenDialog = (card?: ContactCard) => {
    if (card) {
      setEditingCard(card)
      setFormData({
        name: card.name,
        company: card.company || '',
        first_name: card.first_name,
        last_name: card.last_name,
        street_address: card.street_address,
        suite_unit_apt: card.suite_unit_apt || '',
        city: card.city,
        state: card.state,
        zip_code: card.zip_code,
        email: card.email,
        phone: card.phone,
        is_default: card.is_default
      })
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingCard) {
        await updateContactCard(editingCard.id, formData)
        toast.success('Contact card updated successfully')
      } else {
        await createContactCard(formData)
        toast.success('Contact card created successfully')
      }
      
      await loadContactCards()
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving contact card:', error)
      toast.error('Failed to save contact card')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact card?')) return

    try {
      await deleteContactCard(id)
      toast.success('Contact card deleted successfully')
      await loadContactCards()
    } catch (error) {
      console.error('Error deleting contact card:', error)
      toast.error('Failed to delete contact card')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultContactCard(id)
      toast.success('Default contact card updated')
      await loadContactCards()
    } catch (error) {
      console.error('Error setting default:', error)
      toast.error('Failed to set default contact card')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contact Cards</h2>
          <p className="text-muted-foreground">
            Manage your return addresses and sender information
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCard ? 'Edit Contact Card' : 'Add Contact Card'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Main Office"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Your Company Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street_address">Street Address</Label>
                <Input
                  id="street_address"
                  value={formData.street_address}
                  onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suite_unit_apt">Suite/Unit/Apt</Label>
                <Input
                  id="suite_unit_apt"
                  value={formData.suite_unit_apt}
                  onChange={(e) => setFormData({ ...formData, suite_unit_apt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
                <Label htmlFor="is_default">Set as default</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingCard ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {contactCards.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">No contact cards yet</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first contact card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contactCards.map((card) => (
            <Card key={card.id} className="relative">
              {card.is_default && (
                <Badge className="absolute -top-2 -right-2 bg-yellow-500">
                  <Star className="h-3 w-3 mr-1" />
                  Default
                </Badge>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{card.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDialog(card)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {!card.is_default && (
                        <DropdownMenuItem onClick={() => handleSetDefault(card.id)}>
                          <Star className="mr-2 h-4 w-4" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(card.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {card.company && (
                  <p className="text-sm text-muted-foreground">{card.company}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{card.first_name} {card.last_name}</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p>{card.street_address}</p>
                    {card.suite_unit_apt && <p>{card.suite_unit_apt}</p>}
                    <p>{card.city}, {card.state} {card.zip_code}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{card.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{card.phone}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
