"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"
import type { OptionsCriteria } from "@/types/list-builder"

interface OptionsFiltersProps {
  criteria?: OptionsCriteria
  onUpdate?: (values: Partial<OptionsCriteria>) => void
}

export function OptionsFilters({ criteria, onUpdate }: OptionsFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-500" />
          <CardTitle>List Options</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600">Options filters are being updated. Please check back soon.</p>
        </div>
      </CardContent>
    </Card>
  )
}