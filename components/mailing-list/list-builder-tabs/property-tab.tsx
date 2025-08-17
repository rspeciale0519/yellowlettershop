"use client"

import React, { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import type { ListCriteria } from '@/lib/supabase/mailing-lists'

interface PropertyTabProps {
  criteria: ListCriteria
  setCriteria: React.Dispatch<React.SetStateAction<ListCriteria>>
  onEstimateUpdate?: (count: number) => void
}

const PROPERTY_TYPES = [
  'Single Family',
  'Condo',
  'Townhouse',
  'Multi-Family',
  'Land',
  'Mobile Home',
  'Commercial'
]

export function PropertyTab({ criteria, setCriteria, onEstimateUpdate }: PropertyTabProps) {
  const currentYear = new Date().getFullYear()
  const [bedroomRange, setBedroomRange] = useState([0, 10])
  const [bathroomRange, setBathroomRange] = useState([0, 10])
  const [sqftRange, setSqftRange] = useState([0, 10000])
  const [yearBuiltRange, setYearBuiltRange] = useState([1900, currentYear])
  const [valueRange, setValueRange] = useState([0, 5000000])

  const selectedPropertyTypes = criteria.property?.propertyType || []

  const handlePropertyTypeToggle = (type: string) => {
    setCriteria(prev => {
      const currentTypes = prev.property?.propertyType || []
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type]

      return {
        ...prev,
        property: {
          ...prev.property,
          propertyType: newTypes.length > 0 ? newTypes : undefined
        }
      }
    })
  }

  const updateBedrooms = (value: number[]) => {
    setBedroomRange(value)
    setCriteria(prev => ({
      ...prev,
      property: {
        ...prev.property,
        bedrooms: value[0] > 0 || value[1] < 10
          ? { min: value[0], max: value[1] }
          : undefined
      }
    }))
  }

  const updateBathrooms = (value: number[]) => {
    setBathroomRange(value)
    setCriteria(prev => ({
      ...prev,
      property: {
        ...prev.property,
        bathrooms: value[0] > 0 || value[1] < 10
          ? { min: value[0], max: value[1] }
          : undefined
      }
    }))
  }

  const updateSquareFeet = (value: number[]) => {
    setSqftRange(value)
    setCriteria(prev => ({
      ...prev,
      property: {
        ...prev.property,
        squareFeet: value[0] > 0 || value[1] < 10000
          ? { min: value[0], max: value[1] }
          : undefined
      }
    }))
  }

  const updateYearBuilt = (value: number[]) => {
    setYearBuiltRange(value)
    setCriteria(prev => ({
      ...prev,
      property: {
        ...prev.property,
        yearBuilt: value[0] > 1900 || value[1] < currentYear
          ? { min: value[0], max: value[1] }
          : undefined
      }
    }))
  }

  const updateValue = (value: number[]) => {
    setValueRange(value)
    setCriteria(prev => ({
      ...prev,
      property: {
        ...prev.property,
        estimatedValue: value[0] > 0 || value[1] < 5000000
          ? { min: value[0], max: value[1] }
          : undefined
      }
    }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        {/* Property Types */}
        <div>
          <Label>Property Types</Label>
          <div className="space-y-2 mt-2">
            {PROPERTY_TYPES.map(type => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={type}
                  checked={selectedPropertyTypes.includes(type)}
                  onCheckedChange={() => handlePropertyTypeToggle(type)}
                />
                <label htmlFor={type} className="text-sm cursor-pointer">
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Property Ranges */}
        <div className="space-y-4">
          <div>
            <Label>Bedrooms</Label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm w-8">{bedroomRange[0]}</span>
              <Slider
                value={bedroomRange}
                onValueChange={updateBedrooms}
                min={0}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="text-sm w-8 text-right">{bedroomRange[1]}+</span>
            </div>
          </div>

          <div>
            <Label>Bathrooms</Label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm w-8">{bathroomRange[0]}</span>
              <Slider
                value={bathroomRange}
                onValueChange={updateBathrooms}
                min={0}
                max={10}
                step={0.5}
                className="flex-1"
              />
              <span className="text-sm w-8 text-right">{bathroomRange[1]}+</span>
            </div>
          </div>

          <div>
            <Label>Square Feet</Label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm w-16">{sqftRange[0].toLocaleString()}</span>
              <Slider
                value={sqftRange}
                onValueChange={updateSquareFeet}
                min={0}
                max={10000}
                step={100}
                className="flex-1"
              />
              <span className="text-sm w-16 text-right">{sqftRange[1].toLocaleString()}+</span>
            </div>
          </div>

          <div>
            <Label>Year Built</Label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm w-12">{yearBuiltRange[0]}</span>
              <Slider
                value={yearBuiltRange}
                onValueChange={updateYearBuilt}
                min={1900}
                max={currentYear}
                step={1}
                className="flex-1"
              />
              <span className="text-sm w-12 text-right">{yearBuiltRange[1]}</span>
            </div>
          </div>

          <div>
            <Label>Estimated Value</Label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm w-24">${valueRange[0].toLocaleString()}</span>
              <Slider
                value={valueRange}
                onValueChange={updateValue}
                min={0}
                max={5000000}
                step={25000}
                className="flex-1"
              />
              <span className="text-sm w-24 text-right">${valueRange[1].toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
