"use client"

import { CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { OptionsCriteria } from "@/types/list-builder"

interface DeliveryPreferencesSectionProps {
  criteria: OptionsCriteria
  onUpdate: (field: keyof OptionsCriteria["deliveryPreferences"]) => void
}

export function DeliveryPreferencesSection({ criteria, onUpdate }: DeliveryPreferencesSectionProps) {
  return (
    <CardContent className="pt-0">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure delivery preferences for your mailing campaign.
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="exclude-po-boxes" className="text-sm font-medium">
              Exclude PO Boxes
            </Label>
            <Switch
              id="exclude-po-boxes"
              checked={criteria.deliveryPreferences.excludePoBoxes}
              onCheckedChange={() => onUpdate("excludePoBoxes")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="exclude-apartments" className="text-sm font-medium">
              Exclude Apartments
            </Label>
            <Switch
              id="exclude-apartments"
              checked={criteria.deliveryPreferences.excludeApartments}
              onCheckedChange={() => onUpdate("excludeApartments")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="exclude-condos" className="text-sm font-medium">
              Exclude Condominiums
            </Label>
            <Switch
              id="exclude-condos"
              checked={criteria.deliveryPreferences.excludeCondos}
              onCheckedChange={() => onUpdate("excludeCondos")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="exclude-mobile-homes" className="text-sm font-medium">
              Exclude Mobile Homes
            </Label>
            <Switch
              id="exclude-mobile-homes"
              checked={criteria.deliveryPreferences.excludeMobileHomes}
              onCheckedChange={() => onUpdate("excludeMobileHomes")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="require-carrier-route" className="text-sm font-medium">
              Require Carrier Route Information
            </Label>
            <Switch
              id="require-carrier-route"
              checked={criteria.deliveryPreferences.requireCarrierRoute}
              onCheckedChange={() => onUpdate("requireCarrierRoute")}
            />
          </div>
        </div>
      </div>
    </CardContent>
  )
}