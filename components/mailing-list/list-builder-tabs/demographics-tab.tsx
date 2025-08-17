"use client"

import React, { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import type { ListCriteria } from '@/lib/supabase/mailing-lists'

interface DemographicsTabProps {
  criteria: ListCriteria
  setCriteria: React.Dispatch<React.SetStateAction<ListCriteria>>
  onEstimateUpdate?: (count: number) => void
}

const HOME_OWNERSHIP_TYPES = [
  'Owner',
  'Renter',
  'Unknown'
]

const MARITAL_STATUSES = [
  'Single',
  'Married',
  'Divorced',
  'Widowed',
  'Unknown'
]

export function DemographicsTab({ criteria, setCriteria, onEstimateUpdate }: DemographicsTabProps) {
  const [ageRange, setAgeRange] = useState([18, 100])
  const [incomeRange, setIncomeRange] = useState([0, 500000])
  const [netWorthRange, setNetWorthRange] = useState([0, 10000000])

  const selectedHomeOwnership = criteria.demographics?.homeOwnership || []
  const selectedMaritalStatus = criteria.demographics?.maritalStatus || []

  const handleHomeOwnershipToggle = (type: string) => {
    setCriteria(prev => {
      const currentTypes = prev.demographics?.homeOwnership || []
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type]

      return {
        ...prev,
        demographics: {
          ...prev.demographics,
          homeOwnership: newTypes.length > 0 ? newTypes : undefined
        }
      }
    })
  }

  const handleMaritalStatusToggle = (status: string) => {
    setCriteria(prev => {
      const currentStatuses = prev.demographics?.maritalStatus || []
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter(s => s !== status)
        : [...currentStatuses, status]

      return {
        ...prev,
        demographics: {
          ...prev.demographics,
          maritalStatus: newStatuses.length > 0 ? newStatuses : undefined
        }
      }
    })
  }

  const updateAge = (value: number[]) => {
    setAgeRange(value)
    setCriteria(prev => ({
      ...prev,
      demographics: {
        ...prev.demographics,
        age: value[0] > 18 || value[1] < 100
          ? { min: value[0], max: value[1] }
          : undefined
      }
    }))
  }

  const updateIncome = (value: number[]) => {
    setIncomeRange(value)
    setCriteria(prev => ({
      ...prev,
      demographics: {
        ...prev.demographics,
        income: value[0] > 0 || value[1] < 500000
          ? { min: value[0], max: value[1] }
          : undefined
      }
    }))
  }

  const updateNetWorth = (value: number[]) => {
    setNetWorthRange(value)
    setCriteria(prev => ({
      ...prev,
      demographics: {
        ...prev.demographics,
        netWorth: value[0] > 0 || value[1] < 10000000
          ? { min: value[0], max: value[1] }
          : undefined
      }
    }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        {/* Categories */}
        <div className="space-y-4">
          <div>
            <Label>Home Ownership</Label>
            <div className="space-y-2 mt-2">
              {HOME_OWNERSHIP_TYPES.map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ownership-${type}`}
                    checked={selectedHomeOwnership.includes(type)}
                    onCheckedChange={() => handleHomeOwnershipToggle(type)}
                  />
                  <label htmlFor={`ownership-${type}`} className="text-sm cursor-pointer">
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Marital Status</Label>
            <div className="space-y-2 mt-2">
              {MARITAL_STATUSES.map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`marital-${status}`}
                    checked={selectedMaritalStatus.includes(status)}
                    onCheckedChange={() => handleMaritalStatusToggle(status)}
                  />
                  <label htmlFor={`marital-${status}`} className="text-sm cursor-pointer">
                    {status}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ranges */}
        <div className="space-y-4">
          <div>
            <Label>Age Range</Label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm w-12">{ageRange[0]}</span>
              <Slider
                value={ageRange}
                onValueChange={updateAge}
                min={18}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm w-12 text-right">{ageRange[1]}</span>
            </div>
          </div>

          <div>
            <Label>Income Range</Label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm w-20">${incomeRange[0].toLocaleString()}</span>
              <Slider
                value={incomeRange}
                onValueChange={updateIncome}
                min={0}
                max={500000}
                step={5000}
                className="flex-1"
              />
              <span className="text-sm w-20 text-right">${incomeRange[1].toLocaleString()}</span>
            </div>
          </div>

          <div>
            <Label>Net Worth Range</Label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm w-24">${netWorthRange[0].toLocaleString()}</span>
              <Slider
                value={netWorthRange}
                onValueChange={updateNetWorth}
                min={0}
                max={10000000}
                step={50000}
                className="flex-1"
              />
              <span className="text-sm w-24 text-right">${netWorthRange[1].toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
