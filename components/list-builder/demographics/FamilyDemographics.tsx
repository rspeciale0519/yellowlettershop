"use client"

import type React from "react"
import { Baby } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { DemographicsCriteria } from "@/types/list-builder"
import { CHILDREN_AGE_RANGES } from "@/data/demographics"
import { DemographicsGroup } from "./DemographicsGroup"
import { MultiSelectField } from "./MultiSelectField"
import { RangeSliderField } from "./RangeSliderField"

interface FamilyDemographicsProps {
  criteria: DemographicsCriteria
  expanded: boolean
  onToggle: () => void
  onUpdate: (values: Partial<DemographicsCriteria>) => void
}

export function FamilyDemographics({ criteria, expanded, onToggle, onUpdate }: FamilyDemographicsProps) {
  return (
    <DemographicsGroup
      title="Family Demographics"
      icon={<Baby className="h-5 w-5 text-pink-600" />}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        <Label className="text-sm font-medium">Has Children</Label>
        <RadioGroup
          value={criteria.childrenInHousehold.hasChildren}
          onValueChange={(value) =>
            onUpdate({
              childrenInHousehold: {
                ...criteria.childrenInHousehold,
                hasChildren: value,
              },
            })
          }
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="any" id="children-any" />
            <Label htmlFor="children-any">Any</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="children-yes" />
            <Label htmlFor="children-yes">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="children-no" />
            <Label htmlFor="children-no">No</Label>
          </div>
        </RadioGroup>
      </div>

      {criteria.childrenInHousehold.hasChildren === "yes" && (
        <>
          <MultiSelectField
            label="Children Age Ranges"
            options={CHILDREN_AGE_RANGES}
            values={criteria.childrenInHousehold.ageRanges}
            onChange={(values) =>
              onUpdate({
                childrenInHousehold: {
                  ...criteria.childrenInHousehold,
                  ageRanges: values,
                },
              })
            }
            icon={<Baby className="h-4 w-4 text-pink-600" />}
            tooltip="Age ranges of children in household"
          />

          <RangeSliderField
            label="Number of Children"
            value={[
              criteria.childrenInHousehold.numberOfChildren[0],
              criteria.childrenInHousehold.numberOfChildren[1]
            ]}
            min={0}
            max={5}
            onChange={(value) =>
              onUpdate({
                childrenInHousehold: {
                  ...criteria.childrenInHousehold,
                  numberOfChildren: value,
                },
              })
            }
            formatValue={(value) => `${value} ${value === 1 ? "child" : "children"}`}
            icon={<Baby className="h-4 w-4 text-pink-600" />}
            tooltip="Total number of children in household"
            ariaLabel="Number of children selector"
          />
        </>
      )}
    </DemographicsGroup>
  )
}