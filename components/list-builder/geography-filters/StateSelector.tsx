"use client"

import React, { useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { US_STATES } from './constants'
import type { GeographyCriteria } from '@/types/list-builder'

interface StateSelectorProps {
  criteria: GeographyCriteria
  onUpdate: (values: Partial<GeographyCriteria>) => void
}

export function StateSelector({ criteria, onUpdate }: StateSelectorProps) {
  const handleStateChange = useCallback(
    (state: string, checked: boolean) => {
      const set = new Set(criteria.states)
      if (checked) set.add(state)
      else set.delete(state)
      onUpdate({ states: Array.from(set) })
    },
    [criteria.states, onUpdate]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 border rounded-md max-h-64 overflow-y-auto">
        {US_STATES.map((state) => (
          <div key={state} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`state-${state}`}
              checked={criteria.states.includes(state)}
              onChange={(e) => handleStateChange(state, e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <label htmlFor={`state-${state}`} className="text-sm font-medium leading-none cursor-pointer">
              {state}
            </label>
          </div>
        ))}
      </div>
      {criteria.states.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {criteria.states.map((state) => (
            <Badge key={state} variant="secondary">
              {state}
              <button
                onClick={() => handleStateChange(state, false)}
                className="ml-1 rounded-full hover:bg-gray-400/20 p-0.5"
                aria-label={`Remove ${state}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}