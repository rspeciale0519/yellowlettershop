"use client"

import { CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { OptionsCriteria } from "@/types/list-builder"

interface ListCleaningSectionProps {
  criteria: OptionsCriteria
  onUpdate: (field: keyof OptionsCriteria["listCleaning"]) => void
}

export function ListCleaningSection({ criteria, onUpdate }: ListCleaningSectionProps) {
  return (
    <CardContent className="pt-0">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Clean your list by removing unwanted records and duplicates.
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="remove-duplicates" className="text-sm font-medium">
              Remove Duplicate Records
            </Label>
            <Switch
              id="remove-duplicates"
              checked={criteria.listCleaning.removeDuplicates}
              onCheckedChange={() => onUpdate("removeDuplicates")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="remove-deceased" className="text-sm font-medium">
              Remove Deceased Individuals
            </Label>
            <Switch
              id="remove-deceased"
              checked={criteria.listCleaning.removeDeceased}
              onCheckedChange={() => onUpdate("removeDeceased")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="remove-prisoners" className="text-sm font-medium">
              Remove Prisoners & Inmates
            </Label>
            <Switch
              id="remove-prisoners"
              checked={criteria.listCleaning.removePrisonersInmates}
              onCheckedChange={() => onUpdate("removePrisonersInmates")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="remove-businesses" className="text-sm font-medium">
              Remove Business Addresses
            </Label>
            <Switch
              id="remove-businesses"
              checked={criteria.listCleaning.removeBusinesses}
              onCheckedChange={() => onUpdate("removeBusinesses")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="remove-vacant" className="text-sm font-medium">
              Remove Vacant Properties
            </Label>
            <Switch
              id="remove-vacant"
              checked={criteria.listCleaning.removeVacantProperties}
              onCheckedChange={() => onUpdate("removeVacantProperties")}
            />
          </div>
        </div>
      </div>
    </CardContent>
  )
}