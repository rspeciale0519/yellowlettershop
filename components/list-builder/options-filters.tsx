"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ChevronDown, ChevronUp, X, Plus, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OptionsCriteria } from "@/types/list-builder"

interface DraggableSliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min: number
  max: number
  step?: number
  formatValue?: (value: number) => string
  label: string
  className?: string
}

function DraggableSlider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  formatValue = (val) => val.toString(),
  label,
  className,
}: DraggableSliderProps) {
  // Safety check to ensure value is always a valid array
  const safeValue = value && Array.isArray(value) && value.length === 2 ? value : [min, max]

  const [isDragging, setIsDragging] = useState<number | null>(null)

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(index)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging === null) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newValue = min + percentage * (max - min)
    const steppedValue = Math.round(newValue / step) * step

    const newValues = [...safeValue]
    newValues[isDragging] = Math.max(min, Math.min(max, steppedValue))

    // For single-value sliders, just update the single value
    if (isDragging === 0) {
      onValueChange([newValues[0], max])
    }
  }

  const handleMouseUp = () => {
    setIsDragging(null)
  }

  const getPercentage = (val: number) => ((val - min) / (max - min)) * 100

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="text-sm text-gray-600 dark:text-gray-400">{formatValue(safeValue[0])}</div>
      </div>
      <div
        className="relative h-6 cursor-pointer select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Track */}
        <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 bg-gray-200 dark:bg-gray-700 rounded-full" />

        {/* Active range */}
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 bg-yellow-500 rounded-full"
          style={{
            left: `0%`,
            width: `${getPercentage(safeValue[0])}%`,
          }}
        />

        {/* Thumb */}
        <div
          className={cn(
            "absolute top-1/2 w-5 h-5 -translate-y-1/2 -translate-x-1/2 bg-white border-2 border-yellow-500 rounded-full cursor-grab shadow-sm transition-transform hover:scale-110",
            isDragging === 0 && "scale-110 cursor-grabbing",
          )}
          style={{ left: `${getPercentage(safeValue[0])}%` }}
          onMouseDown={handleMouseDown(0)}
        />
      </div>
    </div>
  )
}

interface OptionsFiltersProps {
  criteria?: OptionsCriteria
  onUpdate?: (values: Partial<OptionsCriteria>) => void
}

export function OptionsFilters({ criteria, onUpdate }: OptionsFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["cleaning", "quality"])
  const [newSuppressionFile, setNewSuppressionFile] = useState("")

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const handleCriteriaToggle = (criterion: string) => {
    if (!criteria || !onUpdate) return

    const currentCriteria = criteria.selectedCriteria || []
    const updatedCriteria = currentCriteria.includes(criterion)
      ? currentCriteria.filter((c) => c !== criterion)
      : [...currentCriteria, criterion]

    onUpdate({ selectedCriteria: updatedCriteria })
  }

  const handleListCleaningToggle = (field: keyof OptionsCriteria["listCleaning"]) => {
    if (!criteria || !onUpdate) return

    onUpdate({
      listCleaning: {
        ...criteria.listCleaning,
        [field]: !criteria.listCleaning[field],
      },
    })
  }

  const handleDataQualityToggle = (field: keyof OptionsCriteria["dataQuality"]) => {
    if (!criteria || !onUpdate) return

    if (field === "minimumConfidenceScore") return // Handled by slider

    onUpdate({
      dataQuality: {
        ...criteria.dataQuality,
        [field]: !criteria.dataQuality[field as keyof Omit<OptionsCriteria["dataQuality"], "minimumConfidenceScore">],
      },
    })
  }

  const handleConfidenceScoreChange = (values: number[]) => {
    if (!criteria || !onUpdate) return

    onUpdate({
      dataQuality: {
        ...criteria.dataQuality,
        minimumConfidenceScore: values[0],
      },
    })
  }

  const handleDeliveryToggle = (field: keyof OptionsCriteria["deliveryPreferences"]) => {
    if (!criteria || !onUpdate) return

    onUpdate({
      deliveryPreferences: {
        ...criteria.deliveryPreferences,
        [field]: !criteria.deliveryPreferences[field],
      },
    })
  }

  const handleSuppressionToggle = (field: keyof OptionsCriteria["suppressionLists"]) => {
    if (!criteria || !onUpdate) return

    if (field === "customSuppressionList") return // Handled separately

    onUpdate({
      suppressionLists: {
        ...criteria.suppressionLists,
        [field]:
          !criteria.suppressionLists[field as keyof Omit<OptionsCriteria["suppressionLists"], "customSuppressionList">],
      },
    })
  }

  const addSuppressionFile = () => {
    if (!criteria || !onUpdate || !newSuppressionFile.trim()) return

    onUpdate({
      suppressionLists: {
        ...criteria.suppressionLists,
        customSuppressionList: [...criteria.suppressionLists.customSuppressionList, newSuppressionFile.trim()],
      },
    })
    setNewSuppressionFile("")
  }

  const removeSuppressionFile = (index: number) => {
    if (!criteria || !onUpdate) return

    onUpdate({
      suppressionLists: {
        ...criteria.suppressionLists,
        customSuppressionList: criteria.suppressionLists.customSuppressionList.filter((_, i) => i !== index),
      },
    })
  }

  const handleDataFreshnessChange = (field: keyof OptionsCriteria["dataFreshness"], value: number | boolean) => {
    if (!criteria || !onUpdate) return

    onUpdate({
      dataFreshness: {
        ...criteria.dataFreshness,
        [field]: value,
      },
    })
  }

  const handleAdditionalDataToggle = (field: keyof OptionsCriteria["additionalData"]) => {
    if (!criteria || !onUpdate) return

    onUpdate({
      additionalData: {
        ...criteria.additionalData,
        [field]: !criteria.additionalData[field],
      },
    })
  }

  const handleExportOptionChange = (
    field: keyof OptionsCriteria["exportOptions"],
    value: string | boolean | number,
  ) => {
    if (!criteria || !onUpdate) return

    onUpdate({
      exportOptions: {
        ...criteria.exportOptions,
        [field]: value,
      },
    })
  }

  // Default criteria for display purposes
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

  const activeCriteria = criteria || defaultCriteria

  const sections = [
    {
      id: "cleaning",
      title: "List Cleaning",
      count: Object.values(activeCriteria.listCleaning).filter(Boolean).length,
    },
    {
      id: "quality",
      title: "Data Quality",
      count:
        Object.values(activeCriteria.dataQuality).filter((v, i) => i < 3 && Boolean(v)).length +
        (activeCriteria.dataQuality.minimumConfidenceScore > 50 ? 1 : 0),
    },
    {
      id: "delivery",
      title: "Delivery Preferences",
      count: Object.values(activeCriteria.deliveryPreferences).filter(Boolean).length,
    },
    {
      id: "suppression",
      title: "Suppression Lists",
      count:
        Object.values(activeCriteria.suppressionLists).filter((v, i) => i < 3 && Boolean(v)).length +
        activeCriteria.suppressionLists.customSuppressionList.length,
    },
    {
      id: "freshness",
      title: "Data Freshness",
      count:
        (activeCriteria.dataFreshness.maxAge < 12 ? 1 : 0) + (activeCriteria.dataFreshness.requireRecentUpdate ? 1 : 0),
    },
    {
      id: "additional",
      title: "Additional Data",
      count: Object.values(activeCriteria.additionalData).filter(Boolean).length,
    },
    {
      id: "export",
      title: "Export Options",
      count:
        (activeCriteria.exportOptions.format !== "csv" ? 1 : 0) +
        (!activeCriteria.exportOptions.includeHeaders ? 1 : 0) +
        (activeCriteria.exportOptions.sortBy !== "address" ? 1 : 0) +
        (activeCriteria.exportOptions.maxRecordsPerFile !== 10000 ? 1 : 0),
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

            {expandedSections.includes(section.id) && (
              <CardContent className="pt-0">
                {section.id === "cleaning" && (
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
                          checked={activeCriteria.listCleaning.removeDuplicates}
                          onCheckedChange={() => handleListCleaningToggle("removeDuplicates")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="remove-deceased" className="text-sm font-medium">
                          Remove Deceased Individuals
                        </Label>
                        <Switch
                          id="remove-deceased"
                          checked={activeCriteria.listCleaning.removeDeceased}
                          onCheckedChange={() => handleListCleaningToggle("removeDeceased")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="remove-prisoners" className="text-sm font-medium">
                          Remove Prisoners & Inmates
                        </Label>
                        <Switch
                          id="remove-prisoners"
                          checked={activeCriteria.listCleaning.removePrisonersInmates}
                          onCheckedChange={() => handleListCleaningToggle("removePrisonersInmates")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="remove-businesses" className="text-sm font-medium">
                          Remove Business Addresses
                        </Label>
                        <Switch
                          id="remove-businesses"
                          checked={activeCriteria.listCleaning.removeBusinesses}
                          onCheckedChange={() => handleListCleaningToggle("removeBusinesses")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="remove-vacant" className="text-sm font-medium">
                          Remove Vacant Properties
                        </Label>
                        <Switch
                          id="remove-vacant"
                          checked={activeCriteria.listCleaning.removeVacantProperties}
                          onCheckedChange={() => handleListCleaningToggle("removeVacantProperties")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {section.id === "quality" && (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Set data quality requirements for your mailing list.
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="require-phone" className="text-sm font-medium">
                          Require Phone Numbers
                        </Label>
                        <Switch
                          id="require-phone"
                          checked={activeCriteria.dataQuality.requirePhoneNumbers}
                          onCheckedChange={() => handleDataQualityToggle("requirePhoneNumbers")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="require-email" className="text-sm font-medium">
                          Require Email Addresses
                        </Label>
                        <Switch
                          id="require-email"
                          checked={activeCriteria.dataQuality.requireEmailAddresses}
                          onCheckedChange={() => handleDataQualityToggle("requireEmailAddresses")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="require-complete-address" className="text-sm font-medium">
                          Require Complete Addresses
                        </Label>
                        <Switch
                          id="require-complete-address"
                          checked={activeCriteria.dataQuality.requireCompleteAddresses}
                          onCheckedChange={() => handleDataQualityToggle("requireCompleteAddresses")}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <DraggableSlider
                        value={[activeCriteria.dataQuality.minimumConfidenceScore, 100]}
                        onValueChange={handleConfidenceScoreChange}
                        min={0}
                        max={100}
                        step={5}
                        formatValue={(value) => `${value}%`}
                        label="Minimum Data Confidence Score"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Higher confidence scores mean more accurate data but fewer records.
                      </p>
                    </div>
                  </div>
                )}

                {section.id === "delivery" && (
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
                          checked={activeCriteria.deliveryPreferences.excludePoBoxes}
                          onCheckedChange={() => handleDeliveryToggle("excludePoBoxes")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="exclude-apartments" className="text-sm font-medium">
                          Exclude Apartments
                        </Label>
                        <Switch
                          id="exclude-apartments"
                          checked={activeCriteria.deliveryPreferences.excludeApartments}
                          onCheckedChange={() => handleDeliveryToggle("excludeApartments")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="exclude-condos" className="text-sm font-medium">
                          Exclude Condominiums
                        </Label>
                        <Switch
                          id="exclude-condos"
                          checked={activeCriteria.deliveryPreferences.excludeCondos}
                          onCheckedChange={() => handleDeliveryToggle("excludeCondos")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="exclude-mobile-homes" className="text-sm font-medium">
                          Exclude Mobile Homes
                        </Label>
                        <Switch
                          id="exclude-mobile-homes"
                          checked={activeCriteria.deliveryPreferences.excludeMobileHomes}
                          onCheckedChange={() => handleDeliveryToggle("excludeMobileHomes")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="require-carrier-route" className="text-sm font-medium">
                          Require Carrier Route Information
                        </Label>
                        <Switch
                          id="require-carrier-route"
                          checked={activeCriteria.deliveryPreferences.requireCarrierRoute}
                          onCheckedChange={() => handleDeliveryToggle("requireCarrierRoute")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {section.id === "suppression" && (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Apply suppression lists to ensure compliance and avoid unwanted contacts.
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="national-do-not-mail" className="text-sm font-medium">
                          National Do Not Mail Registry
                        </Label>
                        <Switch
                          id="national-do-not-mail"
                          checked={activeCriteria.suppressionLists.nationalDoNotMail}
                          onCheckedChange={() => handleSuppressionToggle("nationalDoNotMail")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="previous-mailings" className="text-sm font-medium">
                          Suppress Previous Mailings
                        </Label>
                        <Switch
                          id="previous-mailings"
                          checked={activeCriteria.suppressionLists.previousMailings}
                          onCheckedChange={() => handleSuppressionToggle("previousMailings")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="competitors" className="text-sm font-medium">
                          Suppress Competitor Lists
                        </Label>
                        <Switch
                          id="competitors"
                          checked={activeCriteria.suppressionLists.competitors}
                          onCheckedChange={() => handleSuppressionToggle("competitors")}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Custom Suppression Files</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Upload or enter suppression file name"
                          value={newSuppressionFile}
                          onChange={(e) => setNewSuppressionFile(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addSuppressionFile()}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addSuppressionFile}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="sm">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeCriteria.suppressionLists.customSuppressionList.map((file, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {file}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => removeSuppressionFile(index)} />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {section.id === "freshness" && (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Control the freshness and recency of your data.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Maximum Data Age (months)</Label>
                        <Select
                          value={activeCriteria.dataFreshness.maxAge.toString()}
                          onValueChange={(value) => handleDataFreshnessChange("maxAge", Number.parseInt(value))}
                        >
                          <SelectTrigger className="w-full mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 month</SelectItem>
                            <SelectItem value="3">3 months</SelectItem>
                            <SelectItem value="6">6 months</SelectItem>
                            <SelectItem value="12">12 months</SelectItem>
                            <SelectItem value="24">24 months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="require-recent-update" className="text-sm font-medium">
                          Require Recent Data Updates
                        </Label>
                        <Switch
                          id="require-recent-update"
                          checked={activeCriteria.dataFreshness.requireRecentUpdate}
                          onCheckedChange={(checked) => handleDataFreshnessChange("requireRecentUpdate", checked)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {section.id === "additional" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enhance your list with additional data points.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="append-phone" className="text-sm font-medium">
                          Append Phone Numbers
                        </Label>
                        <Switch
                          id="append-phone"
                          checked={activeCriteria.additionalData.appendPhoneNumbers}
                          onCheckedChange={() => handleAdditionalDataToggle("appendPhoneNumbers")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="append-email" className="text-sm font-medium">
                          Append Email Addresses
                        </Label>
                        <Switch
                          id="append-email"
                          checked={activeCriteria.additionalData.appendEmailAddresses}
                          onCheckedChange={() => handleAdditionalDataToggle("appendEmailAddresses")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="append-property" className="text-sm font-medium">
                          Append Property Details
                        </Label>
                        <Switch
                          id="append-property"
                          checked={activeCriteria.additionalData.appendPropertyDetails}
                          onCheckedChange={() => handleAdditionalDataToggle("appendPropertyDetails")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="append-demographics" className="text-sm font-medium">
                          Append Demographics
                        </Label>
                        <Switch
                          id="append-demographics"
                          checked={activeCriteria.additionalData.appendDemographics}
                          onCheckedChange={() => handleAdditionalDataToggle("appendDemographics")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="append-lifestyle" className="text-sm font-medium">
                          Append Lifestyle Data
                        </Label>
                        <Switch
                          id="append-lifestyle"
                          checked={activeCriteria.additionalData.appendLifestyleData}
                          onCheckedChange={() => handleAdditionalDataToggle("appendLifestyleData")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {section.id === "export" && (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configure how your list will be exported and delivered.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Export Format</Label>
                        <Select
                          value={activeCriteria.exportOptions.format}
                          onValueChange={(value) => handleExportOptionChange("format", value)}
                        >
                          <SelectTrigger className="w-full mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                            <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                            <SelectItem value="txt">Text File (Tab Delimited)</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="include-headers" className="text-sm font-medium">
                          Include Column Headers
                        </Label>
                        <Switch
                          id="include-headers"
                          checked={activeCriteria.exportOptions.includeHeaders}
                          onCheckedChange={(checked) => handleExportOptionChange("includeHeaders", checked)}
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Sort Records By</Label>
                        <Select
                          value={activeCriteria.exportOptions.sortBy}
                          onValueChange={(value) => handleExportOptionChange("sortBy", value)}
                        >
                          <SelectTrigger className="w-full mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="address">Address</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="zip">ZIP Code</SelectItem>
                            <SelectItem value="value">Property Value</SelectItem>
                            <SelectItem value="date">Date Added</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Maximum Records Per File</Label>
                        <Select
                          value={activeCriteria.exportOptions.maxRecordsPerFile.toString()}
                          onValueChange={(value) =>
                            handleExportOptionChange("maxRecordsPerFile", Number.parseInt(value))
                          }
                        >
                          <SelectTrigger className="w-full mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1000">1,000 records</SelectItem>
                            <SelectItem value="5000">5,000 records</SelectItem>
                            <SelectItem value="10000">10,000 records</SelectItem>
                            <SelectItem value="25000">25,000 records</SelectItem>
                            <SelectItem value="50000">50,000 records</SelectItem>
                            <SelectItem value="100000">100,000 records</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Large lists will be split into multiple files for easier handling.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
