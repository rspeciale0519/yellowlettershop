"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp } from "lucide-react"
import { ListCleaningSection } from "./ListCleaningSection"
import { DataQualitySection } from "./DataQualitySection"
import { DeliveryPreferencesSection } from "./DeliveryPreferencesSection"
import { SuppressionListsSection } from "./SuppressionListsSection"
import { DataFreshnessSection } from "./DataFreshnessSection"
import { AdditionalDataSection } from "./AdditionalDataSection"
import { ExportOptionsSection } from "./ExportOptionsSection"
import type { OptionsCriteria } from "@/types/list-builder"

interface OptionsFiltersProps {
  criteria?: OptionsCriteria
  onUpdate?: (values: Partial<OptionsCriteria>) => void
}

const defaultCriteria: OptionsCriteria = {
  selectedCriteria: [],
  listCleaning: {
    removeDuplicates: false,
    removeDeceased: false,
    removePrisonersInmates: false,
    removeBusinesses: false,
    removeVacantProperties: false,
  },
  dataQuality: {
    requirePhoneNumbers: false,
    requireEmailAddresses: false,
    requireCompleteAddresses: false,
    minimumConfidenceScore: 50,
  },
  deliveryPreferences: {
    excludePoBoxes: false,
    excludeApartments: false,
    excludeCondos: false,
    excludeMobileHomes: false,
    requireCarrierRoute: false,
  },
  suppressionLists: {
    nationalDoNotMail: false,
    customSuppressionList: [],
    previousMailings: false,
    competitors: false,
  },
  dataFreshness: {
    maxAge: 12,
    requireRecentUpdate: false,
  },
  additionalData: {
    appendPhoneNumbers: false,
    appendEmailAddresses: false,
    appendPropertyDetails: false,
    appendDemographics: false,
    appendLifestyleData: false,
  },
  exportOptions: {
    format: "csv",
    includeHeaders: true,
    sortBy: "address",
    maxRecordsPerFile: 10000,
  },
}

export function OptionsFilters({ criteria, onUpdate }: OptionsFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["cleaning", "quality"])

  const activeCriteria = criteria || defaultCriteria

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => 
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    )
  }

  const handleListCleaningToggle = (field: keyof OptionsCriteria["listCleaning"]) => {
    if (!onUpdate) return
    onUpdate({
      listCleaning: {
        ...activeCriteria.listCleaning,
        [field]: !activeCriteria.listCleaning[field],
      },
    })
  }

  const handleDataQualityToggle = (field: keyof OptionsCriteria["dataQuality"]) => {
    if (!onUpdate || field === "minimumConfidenceScore") return
    onUpdate({
      dataQuality: {
        ...activeCriteria.dataQuality,
        [field]: !activeCriteria.dataQuality[field as keyof Omit<OptionsCriteria["dataQuality"], "minimumConfidenceScore">],
      },
    })
  }

  const handleConfidenceScoreChange = (values: number[]) => {
    if (!onUpdate) return
    onUpdate({
      dataQuality: {
        ...activeCriteria.dataQuality,
        minimumConfidenceScore: values[0],
      },
    })
  }

  const handleDeliveryToggle = (field: keyof OptionsCriteria["deliveryPreferences"]) => {
    if (!onUpdate) return
    onUpdate({
      deliveryPreferences: {
        ...activeCriteria.deliveryPreferences,
        [field]: !activeCriteria.deliveryPreferences[field],
      },
    })
  }

  const handleSuppressionToggle = (field: keyof OptionsCriteria["suppressionLists"]) => {
    if (!onUpdate || field === "customSuppressionList") return
    onUpdate({
      suppressionLists: {
        ...activeCriteria.suppressionLists,
        [field]: !activeCriteria.suppressionLists[field as keyof Omit<OptionsCriteria["suppressionLists"], "customSuppressionList">],
      },
    })
  }

  const addSuppressionFile = (filename: string) => {
    if (!onUpdate) return
    onUpdate({
      suppressionLists: {
        ...activeCriteria.suppressionLists,
        customSuppressionList: [...activeCriteria.suppressionLists.customSuppressionList, filename],
      },
    })
  }

  const removeSuppressionFile = (index: number) => {
    if (!onUpdate) return
    onUpdate({
      suppressionLists: {
        ...activeCriteria.suppressionLists,
        customSuppressionList: activeCriteria.suppressionLists.customSuppressionList.filter((_, i) => i !== index),
      },
    })
  }

  const handleDataFreshnessChange = (field: keyof OptionsCriteria["dataFreshness"], value: number | boolean) => {
    if (!onUpdate) return
    onUpdate({
      dataFreshness: {
        ...activeCriteria.dataFreshness,
        [field]: value,
      },
    })
  }

  const handleAdditionalDataToggle = (field: keyof OptionsCriteria["additionalData"]) => {
    if (!onUpdate) return
    onUpdate({
      additionalData: {
        ...activeCriteria.additionalData,
        [field]: !activeCriteria.additionalData[field],
      },
    })
  }

  const handleExportOptionChange = (
    field: keyof OptionsCriteria["exportOptions"],
    value: string | boolean | number,
  ) => {
    if (!onUpdate) return
    onUpdate({
      exportOptions: {
        ...activeCriteria.exportOptions,
        [field]: value,
      },
    })
  }

  const sections = [
    {
      id: "cleaning",
      title: "List Cleaning",
      count: Object.values(activeCriteria.listCleaning).filter(Boolean).length,
      component: (
        <ListCleaningSection
          criteria={activeCriteria}
          onUpdate={handleListCleaningToggle}
        />
      ),
    },
    {
      id: "quality",
      title: "Data Quality",
      count:
        Object.values(activeCriteria.dataQuality).filter((v, i) => i < 3 && Boolean(v)).length +
        (activeCriteria.dataQuality.minimumConfidenceScore > 50 ? 1 : 0),
      component: (
        <DataQualitySection
          criteria={activeCriteria}
          onToggle={handleDataQualityToggle}
          onConfidenceScoreChange={handleConfidenceScoreChange}
        />
      ),
    },
    {
      id: "delivery",
      title: "Delivery Preferences",
      count: Object.values(activeCriteria.deliveryPreferences).filter(Boolean).length,
      component: (
        <DeliveryPreferencesSection
          criteria={activeCriteria}
          onUpdate={handleDeliveryToggle}
        />
      ),
    },
    {
      id: "suppression",
      title: "Suppression Lists",
      count:
        Object.values(activeCriteria.suppressionLists).filter((v, i) => i < 3 && Boolean(v)).length +
        activeCriteria.suppressionLists.customSuppressionList.length,
      component: (
        <SuppressionListsSection
          criteria={activeCriteria}
          onToggle={handleSuppressionToggle}
          onAddSuppressionFile={addSuppressionFile}
          onRemoveSuppressionFile={removeSuppressionFile}
        />
      ),
    },
    {
      id: "freshness",
      title: "Data Freshness",
      count:
        (activeCriteria.dataFreshness.maxAge < 12 ? 1 : 0) + 
        (activeCriteria.dataFreshness.requireRecentUpdate ? 1 : 0),
      component: (
        <DataFreshnessSection
          criteria={activeCriteria}
          onUpdate={handleDataFreshnessChange}
        />
      ),
    },
    {
      id: "additional",
      title: "Additional Data",
      count: Object.values(activeCriteria.additionalData).filter(Boolean).length,
      component: (
        <AdditionalDataSection
          criteria={activeCriteria}
          onUpdate={handleAdditionalDataToggle}
        />
      ),
    },
    {
      id: "export",
      title: "Export Options",
      count:
        (activeCriteria.exportOptions.format !== "csv" ? 1 : 0) +
        (!activeCriteria.exportOptions.includeHeaders ? 1 : 0) +
        (activeCriteria.exportOptions.sortBy !== "address" ? 1 : 0) +
        (activeCriteria.exportOptions.maxRecordsPerFile !== 10000 ? 1 : 0),
      component: (
        <ExportOptionsSection
          criteria={activeCriteria}
          onUpdate={handleExportOptionChange}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">List Options & Processing</h2>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {(activeCriteria.selectedCriteria || []).length} options selected
        </Badge>
      </div>

      <div className="grid gap-6">
        {sections.map((section) => (
          <Card key={section.id} className="overflow-hidden">
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {section.title}
                  {section.count > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    >
                      {section.count}
                    </Badge>
                  )}
                </CardTitle>
                {expandedSections.includes(section.id) ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </CardHeader>

            {expandedSections.includes(section.id) && section.component}
          </Card>
        ))}
      </div>
    </div>
  )
}