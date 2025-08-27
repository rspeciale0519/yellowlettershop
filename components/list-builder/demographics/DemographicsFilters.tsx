"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { DemographicsCriteria } from "@/types/list-builder"

import { useDemographicsFilters } from "@/hooks/filters/useDemographicsFilters"
import { SectionHeader } from "./SectionHeader"
import { SelectedChips } from "./SelectedChips"
import { BasicDemographics } from "./BasicDemographics"
import { EconomicDemographics } from "./EconomicDemographics"
import { LifestyleDemographics } from "./LifestyleDemographics"
import { CulturalDemographics } from "./CulturalDemographics"
import { FamilyDemographics } from "./FamilyDemographics"
import { PresetDialogs } from "./PresetDialogs"

interface DemographicsFiltersProps {
  criteria: DemographicsCriteria
  onUpdate: (values: Partial<DemographicsCriteria>) => void
}

export function DemographicsFilters({ criteria, onUpdate }: DemographicsFiltersProps) {
  const {
    safeCriteria,
    expandedSections,
    showPresetDialog,
    setShowPresetDialog,
    presetName,
    setPresetName,
    deletePresetId,
    setDeletePresetId,
    handleRemoveCriterion,
    toggleSection,
    savePreset,
    loadPreset,
    deletePreset,
  } = useDemographicsFilters({ criteria, onUpdate })

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Active Criteria Section */}
        <Card>
          <SectionHeader
            title="Active Criteria"
            expanded={true}
            onToggle={() => {}}
          />
          <SelectedChips
            criteria={safeCriteria.selectedCriteria}
            onRemove={handleRemoveCriterion}
            presets={safeCriteria.presets}
            activePreset={safeCriteria.activePreset}
            onLoadPreset={loadPreset}
            onDeletePreset={(id) => setDeletePresetId(id)}
            onSavePreset={() => setShowPresetDialog(true)}
          />
        </Card>

        {/* Demographics Sections */}
        <BasicDemographics
          criteria={safeCriteria}
          expanded={expandedSections.basic}
          onToggle={() => toggleSection("basic")}
          onUpdate={onUpdate}
        />

        <EconomicDemographics
          criteria={safeCriteria}
          expanded={expandedSections.economic}
          onToggle={() => toggleSection("economic")}
          onUpdate={onUpdate}
        />

        <LifestyleDemographics
          criteria={safeCriteria}
          expanded={expandedSections.lifestyle}
          onToggle={() => toggleSection("lifestyle")}
          onUpdate={onUpdate}
        />

        <CulturalDemographics
          criteria={safeCriteria}
          expanded={expandedSections.cultural}
          onToggle={() => toggleSection("cultural")}
          onUpdate={onUpdate}
        />

        <FamilyDemographics
          criteria={safeCriteria}
          expanded={expandedSections.family}
          onToggle={() => toggleSection("family")}
          onUpdate={onUpdate}
        />

        {/* Preset Management Dialogs */}
        <PresetDialogs
          showPresetDialog={showPresetDialog}
          setShowPresetDialog={setShowPresetDialog}
          presetName={presetName}
          setPresetName={setPresetName}
          deletePresetId={deletePresetId}
          setDeletePresetId={setDeletePresetId}
          onSavePreset={savePreset}
          onDeletePreset={deletePreset}
        />
      </div>
    </TooltipProvider>
  )
}