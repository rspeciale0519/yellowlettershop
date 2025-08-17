"use client"

import React, { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import type { ListCriteria } from '@/lib/supabase/mailing-lists'

interface MortgageTabProps {
  criteria: ListCriteria
  setCriteria: React.Dispatch<React.SetStateAction<ListCriteria>>
  onEstimateUpdate?: (count: number) => void
}

const LOAN_TYPES = [
  'Conventional',
  'FHA',
  'VA',
  'USDA',
  'Jumbo',
  'ARM',
  'Fixed'
]

export function MortgageTab({ criteria, setCriteria, onEstimateUpdate }: MortgageTabProps) {
  const [loanAmountRange, setLoanAmountRange] = useState([0, 1000000])
  const [interestRateRange, setInterestRateRange] = useState([0, 10])
  const [ltvRange, setLtvRange] = useState([0, 100])

  const selectedLoanTypes = criteria.mortgage?.loanType || []

  const handleLoanTypeToggle = (type: string) => {
    setCriteria(prev => {
      const currentTypes = prev.mortgage?.loanType || []
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type]

      return {
        ...prev,
        mortgage: {
          ...prev.mortgage,
          loanType: newTypes.length > 0 ? newTypes : undefined
        }
      }
    })
  }

  const updateLoanAmount = (value: number[]) => {
    setLoanAmountRange(value)
    setCriteria(prev => ({
      ...prev,
      mortgage: {
        ...prev.mortgage,
        loanAmount: value[0] > 0 || value[1] < 1000000
          ? { min: value[0], max: value[1] }
          : undefined
      }
    }))
  }

  const updateInterestRate = (value: number[]) => {
    setInterestRateRange(value)
    setCriteria(prev => ({
      ...prev,
      mortgage: {
        ...prev.mortgage,
        interestRate: value[0] > 0 || value[1] < 10
          ? { min: value[0], max: value[1] }
          : undefined
      }
    }))
  }

  const updateLTV = (value: number[]) => {
    setLtvRange(value)
    setCriteria(prev => ({
      ...prev,
      mortgage: {
        ...prev.mortgage,
        ltv: value[0] > 0 || value[1] < 100
          ? { min: value[0], max: value[1] }
          : undefined
      }
    }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        {/* Loan Types */}
        <div>
          <Label>Loan Types</Label>
          <div className="space-y-2 mt-2">
            {LOAN_TYPES.map(type => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={type}
                  checked={selectedLoanTypes.includes(type)}
                  onCheckedChange={() => handleLoanTypeToggle(type)}
                />
                <label htmlFor={type} className="text-sm cursor-pointer">
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Ranges */}
        <div className="space-y-4">
          <div>
            <Label>Loan Amount Range</Label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm w-24">${loanAmountRange[0].toLocaleString()}</span>
              <Slider
                value={loanAmountRange}
                onValueChange={updateLoanAmount}
                min={0}
                max={1000000}
                step={10000}
                className="flex-1"
              />
              <span className="text-sm w-24 text-right">${loanAmountRange[1].toLocaleString()}</span>
            </div>
          </div>

          <div>
            <Label>Interest Rate Range</Label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm w-12">{interestRateRange[0]}%</span>
              <Slider
                value={interestRateRange}
                onValueChange={updateInterestRate}
                min={0}
                max={10}
                step={0.25}
                className="flex-1"
              />
              <span className="text-sm w-12 text-right">{interestRateRange[1]}%</span>
            </div>
          </div>

          <div>
            <Label>LTV Range</Label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm w-12">{ltvRange[0]}%</span>
              <Slider
                value={ltvRange}
                onValueChange={updateLTV}
                min={0}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="text-sm w-12 text-right">{ltvRange[1]}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
