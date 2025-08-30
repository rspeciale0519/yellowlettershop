"use client"

import React, { useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import type { GeographyCriteria } from '@/types/list-builder'

interface CitySelectorProps {
  state: string
  criteria: GeographyCriteria
  onUpdate: (values: Partial<GeographyCriteria>) => void
}

export function CitySelector({ state, criteria, onUpdate }: CitySelectorProps) {
  // Mock city data - in real app, this would be fetched based on state
  const availableCities = ['City A', 'City B', 'City C', 'City D', 'City E', 'City F', 'City G', 'City H']

  const handleCityChange = useCallback(
    (city: string, checked: boolean) => {
      const newCities = checked
        ? criteria.cities.includes(city)
          ? criteria.cities
          : [...criteria.cities, city]
        : criteria.cities.filter((c) => c !== city);
      onUpdate({ cities: newCities });
    },
    [criteria.cities, onUpdate]
  )

  return (
    <div className="space-y-4">
      <Label>Available Cities in {state}</Label>
      <div className="grid grid-cols-2 gap-4 p-4 border rounded-md max-h-48 overflow-y-auto">
        {availableCities.map((city) => (
          <div key={city} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`city-${city}`}
              checked={criteria.cities.includes(city)}
              onChange={(e) => handleCityChange(city, e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <label htmlFor={`city-${city}`} className="text-sm font-medium leading-none cursor-pointer">
              {city}
            </label>
          </div>
        ))}
      </div>

      {criteria.cities.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {criteria.cities.map((city) => (
            <Badge key={city} variant="secondary">
              {city}
              <button
                onClick={() => handleCityChange(city, false)}
                className="ml-1 rounded-full hover:bg-gray-400/20 p-0.5"
                aria-label={`Remove ${city}`}
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