"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { X, InfoIcon, Trash2, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import type { PredictiveCriteria } from "@/types/list-builder"
import { cn } from "@/lib/utils"

interface PredictiveFiltersProps {
  criteria: PredictiveCriteria
  onUpdate: (criteria: Partial<PredictiveCriteria>) => void
}

const PREDICTIVE_MODELS = [
  { value: "heloc", label: "Likelihood to apply for a HELOC" },
  { value: "purchase", label: "Likelihood to apply for a purchase mortgage" },
  { value: "refinance", label: "Likelihood to apply for a refinance" },
  { value: "rent", label: "Likelihood to list their home for rent" },
  { value: "sale", label: "Likelihood to list their home for sale" },
]

const SCORE_LEVELS: Record<string, { value: string; label: string; description: string }[]> = {
  heloc: [
    { value: "very-low", label: "Very Low (1-370)", description: "Minimal likelihood of HELOC application" },
    { value: "low", label: "Low (371-480)", description: "Below average likelihood of HELOC application" },
    { value: "moderate", label: "Moderate (481-600)", description: "Average likelihood of HELOC application" },
    { value: "high", label: "High (601-795)", description: "Above average likelihood of HELOC application" },
    { value: "very-high", label: "Very High (796-999)", description: "Highest likelihood of HELOC application" },
  ],
  purchase: [
    { value: "very-low", label: "Very Low (1-350)", description: "Minimal likelihood of purchase mortgage" },
    { value: "low", label: "Low (351-450)", description: "Below average likelihood of purchase mortgage" },
    { value: "moderate", label: "Moderate (451-650)", description: "Average likelihood of purchase mortgage" },
    { value: "high", label: "High (651-850)", description: "Above average likelihood of purchase mortgage" },
    { value: "very-high", label: "Very High (851-999)", description: "Highest likelihood of purchase mortgage" },
  ],
  refinance: [
    { value: "very-low", label: "Very Low (1-400)", description: "Minimal likelihood of refinancing" },
    { value: "low", label: "Low (401-550)", description: "Below average likelihood of refinancing" },
    { value: "moderate", label: "Moderate (551-700)", description: "Average likelihood of refinancing" },
    { value: "high", label: "High (701-880)", description: "Above average likelihood of refinancing" },
    { value: "very-high", label: "Very High (881-999)", description: "Highest likelihood of refinancing" },
  ],
  rent: [
    { value: "very-low", label: "Very Low (1-300)", description: "Minimal likelihood of listing for rent" },
    { value: "low", label: "Low (301-500)", description: "Below average likelihood of listing for rent" },
    { value: "moderate", label: "Moderate (501-700)", description: "Average likelihood of listing for rent" },
    { value: "high", label: "High (701-900)", description: "Above average likelihood of listing for rent" },
    { value: "very-high", label: "Very High (901-999)", description: "Highest likelihood of listing for rent" },
  ],
  sale: [
    { value: "very-low", label: "Very Low (1-320)", description: "Minimal likelihood of listing for sale" },
    { value: "low", label: "Low (321-480)", description: "Below average likelihood of listing for sale" },
    { value: "moderate", label: "Moderate (481-650)", description: "Average likelihood of listing for sale" },
    { value: "high", label: "High (651-820)", description: "Above average likelihood of listing for sale" },
    { value: "very-high", label: "Very High (821-999)", description: "Highest likelihood of listing for sale" },
  ],
}

const MODEL_DESCRIPTIONS: Record<string, string> = {
  heloc:
    "The scores are derived are not tied to the individual but tied to the household or corporation. As we get new transactions like recent sales the scores change. We score every property every month with the latest data about the property available at the time.",
  purchase:
    "This model predicts the likelihood of a household applying for a new mortgage to purchase a property. It analyzes financial health, market trends, and life stage indicators.",
  refinance:
    "This model identifies households likely to refinance their existing mortgage, considering factors like interest rate changes, loan-to-value ratios, and credit score improvements.",
  rent: "Predicts the likelihood of a property owner listing their home for rent. This is useful for property managers and rental service providers.",
  sale: "This model forecasts the likelihood of a homeowner listing their property for sale, based on equity, time at property, and other life event triggers.",
}

export function PredictiveFilters({ criteria, onUpdate }: PredictiveFiltersProps) {
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([])
  const [selectedToRemove, setSelectedToRemove] = useState<string[]>([])
  const [showRemovalConfirmation, setShowRemovalConfirmation] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  // Generate selected criteria labels for display
  const generateSelectedCriteriaLabels = () => {
    const labels: string[] = []
    const modelScores = criteria.modelScores || {}

    Object.entries(modelScores).forEach(([modelKey, scores]) => {
      if (scores && scores.length > 0) {
        const modelLabel = PREDICTIVE_MODELS.find((m) => m.value === modelKey)?.label || modelKey
        const scoreLabels = scores.map((scoreValue) => {
          const scoreLabel = SCORE_LEVELS[modelKey]?.find((s) => s.value === scoreValue)?.label || scoreValue
          return `${modelLabel}: ${scoreLabel}`
        })
        labels.push(...scoreLabels)
      }
    })

    return labels
  }

  // Update selected criteria whenever model scores change
  useEffect(() => {
    const newSelectedCriteria = generateSelectedCriteriaLabels()
    onUpdate({ selectedCriteria: newSelectedCriteria })
  }, [criteria.modelScores])

  const handleModelChange = (modelValue: string) => {
    onUpdate({ selectedModel: modelValue })
    // Clear selection states when switching models
    setSelectedAvailable([])
    setSelectedToRemove([])
  }

  const currentModel = criteria.selectedModel
  const availableScores = currentModel ? SCORE_LEVELS[currentModel] : []
  const selectedScores = (currentModel && criteria.modelScores?.[currentModel]) || []

  const availableOptions = availableScores.filter((score) => !selectedScores.includes(score.value))
  const selectedOptions = availableScores.filter((score) => selectedScores.includes(score.value))

  const handleAdd = () => {
    if (!currentModel || selectedAvailable.length === 0) return
    const newSelectedScores = [...selectedScores, ...selectedAvailable]
    const newModelScores = {
      ...criteria.modelScores,
      [currentModel]: newSelectedScores,
    }
    onUpdate({
      modelScores: newModelScores,
    })
    setSelectedAvailable([])
  }

  const handleRemove = () => {
    if (!currentModel || selectedToRemove.length === 0) return
    const newSelectedScores = selectedScores.filter((score) => !selectedToRemove.includes(score))
    const newModelScores = {
      ...criteria.modelScores,
      [currentModel]: newSelectedScores,
    }
    onUpdate({
      modelScores: newModelScores,
    })
    setSelectedToRemove([])
  }

  const toggleSelection = (
    list: "available" | "remove",
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value)
      } else {
        return [...prev, value]
      }
    })
  }

  const removeCriterion = (criterionToRemove: string) => {
    setShowRemovalConfirmation(criterionToRemove)
  }

  const confirmRemoval = (criterionToRemove: string) => {
    // Parse the criterion to find which model and score to remove
    const modelScores = { ...criteria.modelScores }
    let updated = false

    Object.entries(modelScores).forEach(([modelKey, scores]) => {
      if (scores && scores.length > 0) {
        const modelLabel = PREDICTIVE_MODELS.find((m) => m.value === modelKey)?.label || modelKey
        const updatedScores = scores.filter((scoreValue) => {
          const scoreLabel = SCORE_LEVELS[modelKey]?.find((s) => s.value === scoreValue)?.label || scoreValue
          const fullLabel = `${modelLabel}: ${scoreLabel}`
          return fullLabel !== criterionToRemove
        })

        if (updatedScores.length !== scores.length) {
          modelScores[modelKey] = updatedScores
          updated = true
        }
      }
    })

    if (updated) {
      onUpdate({ modelScores })
    }
    setShowRemovalConfirmation(null)
  }

  const clearAllCriteria = () => {
    onUpdate({
      selectedModel: null,
      modelScores: {},
      selectedCriteria: [],
    })
    setSelectedAvailable([])
    setSelectedToRemove([])
  }

  const getTotalSelectedCount = () => {
    const modelScores = criteria.modelScores || {}
    return Object.values(modelScores).reduce((total, scores) => total + (scores?.length || 0), 0)
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-yellow-600">Predictive Analytics</h2>
            <p className="text-muted-foreground mt-1">
              A group of products that use the power of CoreLogic Data and Machine Learning techniques to provide
              insights into potential future actions, outcomes and/or performances.
            </p>
            {/* Help Toggle */}
            <div className="space-y-2 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
                className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
              >
                <div className="flex items-center gap-2">
                  {showHelp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="text-sm">How to use Predictive Analytics</span>
                </div>
              </Button>

              {showHelp && (
                <Card className="border-muted animate-in slide-in-from-top-2 duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <InfoIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Select a likelihood model from the dropdown</li>
                          <li>Choose score ranges from the available options</li>
                          <li>Use Add/Remove buttons to manage your selections</li>
                          <li>Switch between models - your selections will be saved</li>
                          <li>Remove individual criteria using the X button in the active criteria section</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          {getTotalSelectedCount() > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {getTotalSelectedCount()} criteria selected
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={clearAllCriteria}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove all predictive criteria selections</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Active Criteria Display */}
        {criteria.selectedCriteria && criteria.selectedCriteria.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <Label className="text-sm font-medium">Active Predictive Criteria</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>These criteria will persist when you switch between different likelihood models</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-wrap gap-2">
                {criteria.selectedCriteria.map((criterion, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 pr-1">
                    <span className="text-xs">{criterion}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-red-100 hover:text-red-600"
                          onClick={() => removeCriterion(criterion)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remove this criterion</p>
                      </TooltipContent>
                    </Tooltip>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Removal Confirmation */}
        {showRemovalConfirmation && (
          <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <Label className="text-sm font-medium">Confirm Removal</Label>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Are you sure you want to remove "{showRemovalConfirmation}"?
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => confirmRemoval(showRemovalConfirmation)}>
                  Yes, Remove
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowRemovalConfirmation(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="predictive-criteria-select">Select Criteria</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Choose a predictive model to add criteria. Your selections will be saved when switching models.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select value={criteria.selectedModel || ""} onValueChange={handleModelChange}>
            <SelectTrigger id="predictive-criteria-select" className="w-full md:w-1/2">
              <SelectValue placeholder="Select Criteria" />
            </SelectTrigger>
            <SelectContent>
              {PREDICTIVE_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex items-center gap-2">
                    {model.label}
                    {criteria.modelScores?.[model.value]?.length && (
                      <Badge variant="secondary" className="text-xs">
                        {criteria.modelScores[model.value].length}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentModel && (
          <div className="space-y-6">
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{MODEL_DESCRIPTIONS[currentModel]}</p>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Available Options */}
              <div className="w-full md:w-5/12">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-sm font-medium">Available Options</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to select options, then use the Add button to move them to your criteria</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-48">
                      <div className="p-2">
                        {availableOptions.length > 0 ? (
                          availableOptions.map((option) => (
                            <Tooltip key={option.value}>
                              <TooltipTrigger asChild>
                                <div
                                  onClick={() => toggleSelection("available", option.value, setSelectedAvailable)}
                                  className={cn(
                                    "p-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
                                    selectedAvailable.includes(option.value) && "bg-accent text-accent-foreground",
                                  )}
                                >
                                  {option.label}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{option.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))
                        ) : (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            All options have been selected
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Add/Remove Buttons */}
              <div className="flex flex-row md:flex-col gap-2 mx-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleAdd} disabled={selectedAvailable.length === 0}>
                      Add &gt;
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add selected options to your criteria</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleRemove} disabled={selectedToRemove.length === 0}>
                      &lt; Remove
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Remove selected options from your criteria</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Selected Options */}
              <div className="w-full md:w-5/12">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-sm font-medium">Selected Options</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to select options for removal, then use the Remove button</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-48">
                      <div className="p-2">
                        {selectedOptions.length > 0 ? (
                          selectedOptions.map((option) => (
                            <Tooltip key={option.value}>
                              <TooltipTrigger asChild>
                                <div
                                  onClick={() => toggleSelection("remove", option.value, setSelectedToRemove)}
                                  className={cn(
                                    "p-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
                                    selectedToRemove.includes(option.value) && "bg-accent text-accent-foreground",
                                  )}
                                >
                                  {option.label}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{option.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))
                        ) : (
                          <div className="p-4 text-center text-muted-foreground text-sm">No options selected</div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
