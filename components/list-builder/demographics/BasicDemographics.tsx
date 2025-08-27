"use client"

import type React from "react"
import { Users, Heart } from "lucide-react"
import type { DemographicsCriteria } from "@/types/list-builder"
import { GENDER_OPTIONS, MARITAL_STATUS_OPTIONS } from "@/data/demographics"
import { DemographicsGroup } from "./DemographicsGroup"
import { MultiSelectField } from "./MultiSelectField"
import { RangeSliderField } from "./RangeSliderField"

interface BasicDemographicsProps {
  criteria: DemographicsCriteria
  expanded: boolean
  onToggle: () => void
  onUpdate: (values: Partial<DemographicsCriteria>) => void
}

export function BasicDemographics({ criteria, expanded, onToggle, onUpdate }: BasicDemographicsProps) {
  return (
    <DemographicsGroup
      title="Basic Demographics"
      icon={<Users className="h-5 w-5 text-blue-600" />}
      expanded={expanded}
      onToggle={onToggle}
    >
      <RangeSliderField
        label="Age Range"
        value={[criteria.age[0], criteria.age[1]]}
        min={18}
        max={100}
        onChange={(value) => onUpdate({ age: value })}
        formatValue={(value) => `${value} years`}
        icon={<Users className="h-4 w-4 text-blue-600" />}
        tooltip="Target age range for recipients"
        ariaLabel="Age range selector"
      />

      <MultiSelectField
        label="Gender"
        options={GENDER_OPTIONS}
        values={criteria.gender}
        onChange={(values) => onUpdate({ gender: values })}
        icon={<Users className="h-4 w-4 text-blue-600" />}
        tooltip="Target specific genders"
      />

      <MultiSelectField
        label="Marital Status"
        options={MARITAL_STATUS_OPTIONS}
        values={criteria.maritalStatus}
        onChange={(values) => onUpdate({ maritalStatus: values })}
        icon={<Heart className="h-4 w-4 text-pink-600" />}
        tooltip="Target by relationship status"
      />

      <RangeSliderField
        label="Household Size"
        value={[criteria.householdSize[0], criteria.householdSize[1]]}
        min={1}
        max={8}
        onChange={(value) => onUpdate({ householdSize: value })}
        formatValue={(value) => `${value} ${value === 1 ? "person" : "people"}`}
        icon={<Users className="h-4 w-4 text-blue-600" />}
        tooltip="Number of people in household"
        ariaLabel="Household size selector"
      />
    </DemographicsGroup>
  )
}