"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { UserProfile } from './types'

interface BusinessInfoTabProps {
  profile: UserProfile
  onProfileUpdate: (updates: Partial<UserProfile>) => Promise<boolean>
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export function BusinessInfoTab({ profile, onProfileUpdate }: BusinessInfoTabProps) {
  const [saving, setSaving] = useState(false)

  const formatZipCode = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 5) {
      return digits
    } else if (digits.length <= 9) {
      return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`
    }
    return digits.slice(0, 5)
  }

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatZipCode(e.target.value)
    e.target.value = formatted
  }

  const handleBusinessInfoSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      setSaving(true)
      const formData = new FormData(e.currentTarget)
      
      const updates = {
        company_name: formData.get('company-name') as string,
        job_title: formData.get('job-title') as string,
        street_address: formData.get('address') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        zip_code: formData.get('zip') as string,
        country: formData.get('country') as string,
      }

      await onProfileUpdate(updates)
      toast.success('Business information updated successfully!')
    } catch (error) {
      console.error('Error updating business info:', error)
      toast.error('Failed to update business information')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleBusinessInfoSave}>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Update your business and address details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                name="company-name"
                type="text"
                defaultValue={profile.company_name || ''}
                placeholder="Your company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title</Label>
              <Input
                id="job-title"
                name="job-title"
                type="text"
                defaultValue={profile.job_title || ''}
                placeholder="Your job title"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              name="address"
              type="text"
              defaultValue={profile.street_address || ''}
              placeholder="123 Main St, Suite 100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                type="text"
                defaultValue={profile.city || ''}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select name="state" defaultValue={profile.state || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                name="zip"
                type="text"
                defaultValue={profile.zip_code || ''}
                placeholder="12345"
                onChange={handleZipChange}
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select name="country" defaultValue={profile.country || 'US'}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="MX">Mexico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}