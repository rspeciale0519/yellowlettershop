"use client"

import type React from "react"
import { Globe, BookOpen, Flag, Shield } from "lucide-react"
import type { DemographicsCriteria } from "@/types/list-builder"
import {
  ETHNICITY_OPTIONS,
  LANGUAGE_OPTIONS,
  POLITICAL_AFFILIATIONS,
  VETERAN_STATUS,
} from "@/data/demographics"
import { DemographicsGroup } from "./DemographicsGroup"
import { MultiSelectField } from "./MultiSelectField"

interface CulturalDemographicsProps {
  criteria: DemographicsCriteria
  expanded: boolean
  onToggle: () => void
  onUpdate: (values: Partial<DemographicsCriteria>) => void
}

export function CulturalDemographics({ criteria, expanded, onToggle, onUpdate }: CulturalDemographicsProps) {
  return (
    <DemographicsGroup
      title="Cultural Demographics"
      icon={<Globe className="h-5 w-5 text-indigo-600" />}
      expanded={expanded}
      onToggle={onToggle}
    >
      <MultiSelectField
        label="Ethnicity"
        options={ETHNICITY_OPTIONS}
        values={criteria.ethnicity}
        onChange={(values) => onUpdate({ ethnicity: values })}
        icon={<Globe className="h-4 w-4 text-indigo-600" />}
        tooltip="Ethnic background"
      />

      <MultiSelectField
        label="Language"
        options={LANGUAGE_OPTIONS}
        values={criteria.language}
        onChange={(values) => onUpdate({ language: values })}
        icon={<BookOpen className="h-4 w-4 text-teal-600" />}
        tooltip="Primary language spoken"
      />

      <MultiSelectField
        label="Political Affiliation"
        options={POLITICAL_AFFILIATIONS}
        values={criteria.politicalAffiliation}
        onChange={(values) => onUpdate({ politicalAffiliation: values })}
        icon={<Flag className="h-4 w-4 text-red-600" />}
        tooltip="Political party affiliation"
      />

      <MultiSelectField
        label="Veteran Status"
        options={VETERAN_STATUS}
        values={criteria.veteranStatus}
        onChange={(values) => onUpdate({ veteranStatus: values })}
        icon={<Shield className="h-4 w-4 text-gray-600" />}
        tooltip="Military service history"
      />
    </DemographicsGroup>
  )
}