"use client"

import type React from "react"
import { Heart, CreditCard } from "lucide-react"
import type { DemographicsCriteria } from "@/types/list-builder"
import { INTERESTS, PURCHASING_BEHAVIOR } from "@/data/demographics"
import { DemographicsGroup } from "./DemographicsGroup"
import { MultiSelectField } from "./MultiSelectField"

interface LifestyleDemographicsProps {
  criteria: DemographicsCriteria
  expanded: boolean
  onToggle: () => void
  onUpdate: (values: Partial<DemographicsCriteria>) => void
}

export function LifestyleDemographics({ criteria, expanded, onToggle, onUpdate }: LifestyleDemographicsProps) {
  return (
    <DemographicsGroup
      title="Lifestyle Demographics"
      icon={<Heart className="h-5 w-5 text-pink-600" />}
      expanded={expanded}
      onToggle={onToggle}
    >
      <MultiSelectField
        label="Interests"
        options={INTERESTS}
        values={criteria.lifestyle?.interests ?? []}
        onChange={(values) =>
          onUpdate({
            lifestyle: {
              ...(criteria.lifestyle ?? {}),
              interests: values,
            },
          })
        }
        icon={<Heart className="h-4 w-4 text-pink-600" />}
        tooltip="Personal interests and hobbies"
      />

      <MultiSelectField
        label="Purchasing Behavior"
        options={PURCHASING_BEHAVIOR}
        values={criteria.lifestyle?.purchasingBehavior ?? []}
        onChange={(values) =>
          onUpdate({
            lifestyle: {
              ...(criteria.lifestyle ?? {}),
              purchasingBehavior: values,
            },
          })
        }
        icon={<CreditCard className="h-4 w-4 text-blue-600" />}
        tooltip="Shopping and purchasing patterns"
      />
    </DemographicsGroup>
  )
}