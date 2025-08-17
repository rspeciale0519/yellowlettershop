"use client"

import React, { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"
import { X } from "lucide-react"
import type { ListCriteria } from '@/lib/supabase/mailing-lists'

interface GeographyTabProps {
  criteria: ListCriteria
  setCriteria: React.Dispatch<React.SetStateAction<ListCriteria>>
  onEstimateUpdate?: (count: number) => void
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
]

export function GeographyTab({ criteria, setCriteria, onEstimateUpdate }: GeographyTabProps) {
  const [zipCodeInput, setZipCodeInput] = useState('')
  const [cityInput, setCityInput] = useState('')
  const [countyInput, setCountyInput] = useState('')
  const [radiusSearch, setRadiusSearch] = useState({ lat: '', lng: '', miles: '10' })

  const selectedStates = criteria.geography?.states || []

  const handleAddZipCode = () => {
    if (zipCodeInput && /^\d{5}$/.test(zipCodeInput)) {
      setCriteria(prev => ({
        ...prev,
        geography: {
          ...prev.geography,
          zipCodes: [...(prev.geography?.zipCodes || []), zipCodeInput]
        }
      }))
      setZipCodeInput('')
    } else {
      toast({
        title: "Invalid Zip Code",
        description: "Please enter a valid 5-digit zip code.",
        variant: "destructive"
      })
    }
  }

  const handleAddCity = () => {
    if (cityInput) {
      setCriteria(prev => ({
        ...prev,
        geography: {
          ...prev.geography,
          cities: [...(prev.geography?.cities || []), cityInput]
        }
      }))
      setCityInput('')
    }
  }

  const handleAddCounty = () => {
    if (countyInput) {
      setCriteria(prev => ({
        ...prev,
        geography: {
          ...prev.geography,
          counties: [...(prev.geography?.counties || []), countyInput]
        }
      }))
      setCountyInput('')
    }
  }

  const handleStateToggle = (stateCode: string) => {
    setCriteria(prev => {
      const currentStates = prev.geography?.states || []
      const newStates = currentStates.includes(stateCode) 
        ? currentStates.filter(s => s !== stateCode)
        : [...currentStates, stateCode]
      
      return {
        ...prev,
        geography: {
          ...prev.geography,
          states: newStates
        }
      }
    })
  }

  const handleRadiusUpdate = () => {
    if (radiusSearch.lat && radiusSearch.lng) {
      setCriteria(prev => ({
        ...prev,
        geography: {
          ...prev.geography,
          radius: {
            lat: parseFloat(radiusSearch.lat),
            lng: parseFloat(radiusSearch.lng),
            miles: parseFloat(radiusSearch.miles)
          }
        }
      }))
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* States Selection */}
        <div>
          <Label>States</Label>
          <ScrollArea className="h-64 w-full rounded-md border mt-2">
            <div className="p-4">
              {US_STATES.map((state) => (
                <div key={state.code} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={state.code}
                    checked={selectedStates.includes(state.code)}
                    onCheckedChange={() => handleStateToggle(state.code)}
                  />
                  <label
                    htmlFor={state.code}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {state.name}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
          {selectedStates.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {selectedStates.map(code => (
                <Badge key={code} variant="secondary" className="text-xs">
                  {code}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => handleStateToggle(code)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Other Geography Inputs */}
        <div className="space-y-4">
          {/* Zip Codes */}
          <div>
            <Label>Zip Codes</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Enter zip code"
                value={zipCodeInput}
                onChange={(e) => setZipCodeInput(e.target.value)}
                maxLength={5}
              />
              <Button onClick={handleAddZipCode} size="sm">Add</Button>
            </div>
            {criteria.geography?.zipCodes && criteria.geography.zipCodes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {criteria.geography.zipCodes.map((zip, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {zip}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => {
                        setCriteria(prev => ({
                          ...prev,
                          geography: {
                            ...prev.geography,
                            zipCodes: prev.geography?.zipCodes?.filter((_, i) => i !== idx)
                          }
                        }))
                      }}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Cities */}
          <div>
            <Label>Cities</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Enter city name"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
              />
              <Button onClick={handleAddCity} size="sm">Add</Button>
            </div>
            {criteria.geography?.cities && criteria.geography.cities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {criteria.geography.cities.map((city, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {city}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => {
                        setCriteria(prev => ({
                          ...prev,
                          geography: {
                            ...prev.geography,
                            cities: prev.geography?.cities?.filter((_, i) => i !== idx)
                          }
                        }))
                      }}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Counties */}
          <div>
            <Label>Counties</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Enter county name"
                value={countyInput}
                onChange={(e) => setCountyInput(e.target.value)}
              />
              <Button onClick={handleAddCounty} size="sm">Add</Button>
            </div>
            {criteria.geography?.counties && criteria.geography.counties.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {criteria.geography.counties.map((county, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {county}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => {
                        setCriteria(prev => ({
                          ...prev,
                          geography: {
                            ...prev.geography,
                            counties: prev.geography?.counties?.filter((_, i) => i !== idx)
                          }
                        }))
                      }}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Radius Search */}
          <div>
            <Label>Radius Search</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <Input
                placeholder="Latitude"
                value={radiusSearch.lat}
                onChange={(e) => setRadiusSearch(prev => ({ ...prev, lat: e.target.value }))}
                onBlur={handleRadiusUpdate}
              />
              <Input
                placeholder="Longitude"
                value={radiusSearch.lng}
                onChange={(e) => setRadiusSearch(prev => ({ ...prev, lng: e.target.value }))}
                onBlur={handleRadiusUpdate}
              />
              <Input
                placeholder="Miles"
                value={radiusSearch.miles}
                onChange={(e) => setRadiusSearch(prev => ({ ...prev, miles: e.target.value }))}
                onBlur={handleRadiusUpdate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
