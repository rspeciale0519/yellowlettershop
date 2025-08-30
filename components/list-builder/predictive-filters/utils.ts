import type {
  PredictiveFiltersState,
  ScoreRange,
  PredictiveModel,
} from './types';

export const calculateEstimatedCount = (
  totalCount: number,
  scoreRange: ScoreRange,
  enablePredictive: boolean
): number => {
  const safeTotal = Number.isFinite(totalCount)
    ? Math.max(0, Math.floor(totalCount))
    : 0;
  if (!enablePredictive) return safeTotal;
  if (!validateScoreRange(scoreRange)) return safeTotal;
  // Simple estimation based on score range
  // In a real implementation, this would use actual data distribution
  const rangeSize = scoreRange.max - scoreRange.min;
  const baseReduction = Math.max(0.1, rangeSize / 100);
  // Higher minimum scores result in more aggressive filtering
  const minScoreFactor = (100 - scoreRange.min) / 100;
  const maxScoreFactor = scoreRange.max / 100;
  const fraction = Math.max(
    0,
    Math.min(1, baseReduction * minScoreFactor * maxScoreFactor)
  );
  return Math.floor(safeTotal * fraction);
};

export const validateScoreRange = (range: ScoreRange): boolean => {
  return range.min >= 0 && range.max <= 100 && range.min <= range.max;
};

export const getModelById = (
  models: PredictiveModel[],
  id: string
): PredictiveModel | undefined => {
  return models.find((model) => model.id === id);
};

export const getActiveModels = (
  models: PredictiveModel[]
): PredictiveModel[] => {
  return models.filter((model) => model.isActive);
};

export const formatScoreRange = (range: ScoreRange): string => {
  return `${range.min}% - ${range.max}%`;
};

export const getDefaultFiltersState = (): PredictiveFiltersState => ({
  selectedModel: 'response_likelihood',
  scoreRange: { min: 60, max: 100 },
  enablePredictive: false,
  showAdvanced: false,
  customThreshold: 70,
  includeUncertain: false,
});

export const resetFiltersState = (
  currentState: PredictiveFiltersState
): PredictiveFiltersState => ({
  ...getDefaultFiltersState(),
  enablePredictive: currentState.enablePredictive, // Preserve the main toggle
});
