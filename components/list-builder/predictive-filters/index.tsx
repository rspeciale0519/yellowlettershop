"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Brain, Zap } from "lucide-react"
import { ModelSelector } from "./model-selector"
import { ScoreRangeSlider } from "./score-range-slider"
import { AdvancedOptions } from "./advanced-options"
import { FilterSummary } from "./filter-summary"
import { 
  PREDICTIVE_MODELS, 
  DEFAULT_SCORE_RANGE, 
  DEFAULT_CUSTOM_THRESHOLD,
  type PredictiveFiltersState 
} from "./types"
import { 
  calculateEstimatedCount, 
  getModelById, 
  getActiveModels,
  getDefaultFiltersState,
  resetFiltersState 
} from "./utils"

interface PredictiveFiltersProps {
  totalRecords: number
  onFiltersChange?: (filters: PredictiveFiltersState) => void
  onApply?: (filters: PredictiveFiltersState) => void
}

export function PredictiveFilters({ 
  totalRecords = 0, 
  onFiltersChange,
  onApply 
}: PredictiveFiltersProps) {
  const [state, setState] = useState<PredictiveFiltersState>(getDefaultFiltersState())
  
  const activeModels = getActiveModels(PREDICTIVE_MODELS)
  const selectedModelData = getModelById(PREDICTIVE_MODELS, state.selectedModel)
  const estimatedCount = calculateEstimatedCount(totalRecords, state.scoreRange, state.enablePredictive)

  // Notify parent of state changes
  useEffect(() => {
    onFiltersChange?.(state)
  }, [state, onFiltersChange])

  const updateState = (updates: Partial<PredictiveFiltersState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const handleApplyFilters = () => {
    onApply?.(state)
  }

  const handleResetFilters = () => {
    setState(resetFiltersState(state))
  }

  const handleModelSelect = (modelId: string) => {
    updateState({ selectedModel: modelId })
  }

  const handleScoreRangeChange = (scoreRange: typeof state.scoreRange) => {
    updateState({ scoreRange })
  }

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>Predictive Filtering</span>
                  <Zap className="h-4 w-4 text-yellow-500" />
                </CardTitle>
                <CardDescription>
                  Use AI to optimize your mailing list for better response rates
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={state.enablePredictive}
              onCheckedChange={(checked) => updateState({ enablePredictive: checked })}
            />
          </div>
        </CardHeader>
        
        {state.enablePredictive && (
          <CardContent className="pt-0">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Predictive filtering is active</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Filter Configuration */}
      {state.enablePredictive && (
        <>
          <ModelSelector
            models={activeModels}
            selectedModel={state.selectedModel}
            onModelSelect={handleModelSelect}
          />

          <ScoreRangeSlider
            scoreRange={state.scoreRange}
            onScoreRangeChange={handleScoreRangeChange}
            estimatedCount={estimatedCount}
          />

          <AdvancedOptions
            showAdvanced={state.showAdvanced}
            customThreshold={state.customThreshold}
            includeUncertain={state.includeUncertain}
            onShowAdvancedChange={(show) => updateState({ showAdvanced: show })}
            onCustomThresholdChange={(threshold) => updateState({ customThreshold: threshold })}
            onIncludeUncertainChange={(include) => updateState({ includeUncertain: include })}
          />

          <FilterSummary
            state={state}
            selectedModelData={selectedModelData}
            estimatedCount={estimatedCount}
            totalCount={totalRecords}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
          />
        </>
      )}

      {/* Disabled State Info */}
      {!state.enablePredictive && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Brain className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Boost Your Response Rates</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Enable predictive filtering to use AI-powered insights and target the most likely 
                  responders in your mailing list.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Higher Response Rates</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Lower Costs</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span>Better ROI</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
