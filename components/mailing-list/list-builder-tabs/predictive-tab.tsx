"use client"

import React, { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import type { ListCriteria } from '@/lib/supabase/mailing-lists'

interface PredictiveTabProps {
  criteria: ListCriteria
  setCriteria: React.Dispatch<React.SetStateAction<ListCriteria>>
  onEstimateUpdate?: (count: number) => void
}

export function PredictiveTab({ criteria, setCriteria, onEstimateUpdate }: PredictiveTabProps) {
  const [motivationScoreRange, setMotivationScoreRange] = useState([0, 100])

  const likelyToMove = criteria.predictiveAnalytics?.likelyToMove || false
  const likelyToSell = criteria.predictiveAnalytics?.likelyToSell || false
  const likelyToRefinance = criteria.predictiveAnalytics?.likelyToRefinance || false

  const handleLikelyToMoveToggle = (checked: boolean) => {
    setCriteria(prev => ({
      ...prev,
      predictiveAnalytics: {
        ...prev.predictiveAnalytics,
        likelyToMove: checked || undefined
      }
    }))
  }

  const handleLikelyToSellToggle = (checked: boolean) => {
    setCriteria(prev => ({
      ...prev,
      predictiveAnalytics: {
        ...prev.predictiveAnalytics,
        likelyToSell: checked || undefined
      }
    }))
  }

  const handleLikelyToRefinanceToggle = (checked: boolean) => {
    setCriteria(prev => ({
      ...prev,
      predictiveAnalytics: {
        ...prev.predictiveAnalytics,
        likelyToRefinance: checked || undefined
      }
    }))
  }

  const updateMotivationScore = (value: number[]) => {
    setMotivationScoreRange(value)
    setCriteria(prev => ({
      ...prev,
      predictiveAnalytics: {
        ...prev.predictiveAnalytics,
        motivationScore: value[0] > 0 || value[1] < 100
          ? { min: value[0], max: value[1] }
          : undefined
      }
    }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        {/* Predictive Flags */}
        <div>
          <Label>Predictive Indicators</Label>
          <div className="space-y-3 mt-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="likely-to-move"
                checked={likelyToMove}
                onCheckedChange={handleLikelyToMoveToggle}
              />
              <label htmlFor="likely-to-move" className="text-sm cursor-pointer">
                Likely to Move
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="likely-to-sell"
                checked={likelyToSell}
                onCheckedChange={handleLikelyToSellToggle}
              />
              <label htmlFor="likely-to-sell" className="text-sm cursor-pointer">
                Likely to Sell
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="likely-to-refinance"
                checked={likelyToRefinance}
                onCheckedChange={handleLikelyToRefinanceToggle}
              />
              <label htmlFor="likely-to-refinance" className="text-sm cursor-pointer">
                Likely to Refinance
              </label>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              These predictive indicators use machine learning models to identify homeowners 
              with high propensity for specific actions based on historical data patterns.
            </p>
          </div>
        </div>

        {/* Motivation Score */}
        <div>
          <Label>Motivation Score Range</Label>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm w-12">{motivationScoreRange[0]}</span>
            <Slider
              value={motivationScoreRange}
              onValueChange={updateMotivationScore}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-sm w-12 text-right">{motivationScoreRange[1]}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Score from 0-100 indicating likelihood to take action
          </p>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Low (0-33)</span>
              <span>Unlikely to act soon</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Medium (34-66)</span>
              <span>Moderate interest</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">High (67-100)</span>
              <span>Strong motivation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
