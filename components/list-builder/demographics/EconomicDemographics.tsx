"use client"

import type React from "react"
import { Briefcase, GraduationCap, Home, CreditCard } from "lucide-react"
import type { DemographicsCriteria } from "@/types/list-builder"
import {
  EDUCATION_LEVELS,
  OCCUPATION_CATEGORIES,
  EMPLOYMENT_STATUS,
  HOME_OWNERSHIP,
  CREDIT_RATINGS,
} from "@/data/demographics"
import { DemographicsGroup } from "./DemographicsGroup"
import { MultiSelectField } from "./MultiSelectField"
import { RangeSliderField } from "./RangeSliderField"

interface EconomicDemographicsProps {
  criteria: DemographicsCriteria
  expanded: boolean
  onToggle: () => void
  onUpdate: (values: Partial<DemographicsCriteria>) => void
}

export function EconomicDemographics({ criteria, expanded, onToggle, onUpdate }: EconomicDemographicsProps) {
  return (
    <DemographicsGroup
      title="Economic Demographics"
      icon={<Briefcase className="h-5 w-5 text-green-600" />}
      expanded={expanded}
      onToggle={onToggle}
    >
      <RangeSliderField
        label="Household Income"
        value={[criteria.income[0], criteria.income[1]]}
        min={25000}
        max={250000}
        step={5000}
        onChange={(value) => onUpdate({ income: value })}
        formatValue={(value) => `$${value.toLocaleString()}`}
        icon={<CreditCard className="h-4 w-4 text-green-600" />}
        tooltip="Annual household income range"
        ariaLabel="Income range selector"
      />

      <MultiSelectField
        label="Education Level"
        options={EDUCATION_LEVELS}
        values={criteria.educationLevel}
        onChange={(values) => onUpdate({ educationLevel: values })}
        icon={<GraduationCap className="h-4 w-4 text-purple-600" />}
        tooltip="Highest education level achieved"
      />

      <MultiSelectField
        label="Occupation"
        options={OCCUPATION_CATEGORIES}
        values={criteria.occupation}
        onChange={(values) => onUpdate({ occupation: values })}
        icon={<Briefcase className="h-4 w-4 text-green-600" />}
        tooltip="Professional occupation categories"
      />

      <MultiSelectField
        label="Employment Status"
        options={EMPLOYMENT_STATUS}
        values={criteria.employmentStatus}
        onChange={(values) => onUpdate({ employmentStatus: values })}
        icon={<Briefcase className="h-4 w-4 text-green-600" />}
        tooltip="Current employment status"
      />

      <MultiSelectField
        label="Home Ownership"
        options={HOME_OWNERSHIP}
        values={criteria.homeOwnership}
        onChange={(values) => onUpdate({ homeOwnership: values })}
        icon={<Home className="h-4 w-4 text-orange-600" />}
        tooltip="Home ownership status"
      />

      <MultiSelectField
        label="Credit Rating"
        options={CREDIT_RATINGS}
        values={criteria.creditRating}
        onChange={(values) => onUpdate({ creditRating: values })}
        icon={<CreditCard className="h-4 w-4 text-red-600" />}
        tooltip="Credit score ranges"
      />
    </DemographicsGroup>
  )
}