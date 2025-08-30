export interface PredictiveModel {
  id: string
  name: string
  description: string
  accuracy: number
  features: string[]
  isActive: boolean
}

export interface ScoreRange {
  min: number
  max: number
}

export interface PredictiveFiltersState {
  selectedModel: string
  scoreRange: ScoreRange
  enablePredictive: boolean
  showAdvanced: boolean
  customThreshold: number
  includeUncertain: boolean
}

export const PREDICTIVE_MODELS: PredictiveModel[] = [
  {
    id: "response_likelihood",
    name: "Response Likelihood",
    description: "Predicts likelihood of response based on demographics and past behavior",
    accuracy: 0.78,
    features: ["Age", "Income", "Property Value", "Previous Responses"],
    isActive: true,
  },
  {
    id: "conversion_probability", 
    name: "Conversion Probability",
    description: "Estimates probability of converting to a sale",
    accuracy: 0.82,
    features: ["Demographics", "Property Details", "Market Conditions"],
    isActive: true,
  },
  {
    id: "engagement_score",
    name: "Engagement Score", 
    description: "Measures overall engagement potential",
    accuracy: 0.75,
    features: ["Social Media Activity", "Online Presence", "Communication History"],
    isActive: false,
  },
]

export const DEFAULT_SCORE_RANGE: ScoreRange = { min: 60, max: 100 }
export const DEFAULT_CUSTOM_THRESHOLD = 70
