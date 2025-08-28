// Custom hook for build lists page state and calculations
import { useState, useMemo, useCallback } from 'react';
import type { ListCriteria } from '@/types/list-builder';
import { initialCriteria } from '@/app/mailing-services/build-lists/config/initialCriteria';

export type Category =
  | 'geography'
  | 'property'
  | 'demographics'
  | 'mortgage'
  | 'foreclosure'
  | 'predictive'
  | 'options';

export type UpdateCriteria = <K extends keyof ListCriteria>(
  category: K,
  values: Partial<ListCriteria[K]>
) => void;
export function useBuildListsPage() {
  const [listName, setListName] = useState('My New Mailing List');
  const [criteria, setCriteria] = useState<ListCriteria>(initialCriteria);
  const [activeCategory, setActiveCategory] = useState<string>('geography');

  const updateCriteria = useCallback<UpdateCriteria>((category, values) => {
    setCriteria((prev) => ({
      ...prev,
      [category]: { ...prev[category], ...values },
    }));
  }, []);

  const clearAllCriteria = useCallback(() => {
    setCriteria(initialCriteria);
  }, []);

  const recordCount = useMemo(() => {
    // This is a mock calculation. In a real app, this would be an API call.
    let count = 100000;

    // Geography impact
    if (criteria.geography.states.length > 0)
      count /= Math.max(1, criteria.geography.states.length * 2);
    if (criteria.geography.zipCodes.length > 0)
      count /= Math.max(1, criteria.geography.zipCodes.length);
    if (criteria.geography.cities.length > 0)
      count /= Math.max(1, criteria.geography.cities.length * 3);
    if (criteria.geography.zipRadius.length > 0) count *= 0.6;

    // Property impact
    if (criteria.property.propertyTypes.length > 0) count *= 0.3;
    count -= (2024 - criteria.property.yearBuilt[1]) * 100;
    count -= (criteria.property.yearBuilt[0] - 1900) * 50;

    // Property value impact
    const avgValue =
      (criteria.property.propertyValue[0] +
        criteria.property.propertyValue[1]) /
      2;
    if (avgValue > 500000) count *= 0.7;
    if (avgValue < 200000) count *= 1.2;

    // Square footage impact
    const avgSqFt =
      (criteria.property.squareFootage[0] +
        criteria.property.squareFootage[1]) /
      2;
    if (avgSqFt > 3000) count *= 0.8;
    if (avgSqFt < 1500) count *= 1.1;

    // Mortgage criteria impact
    if (criteria.mortgage.selectedCriteria.length > 0) count *= 0.7;
    if (criteria.mortgage.lienPosition === 'first') count *= 0.8;
    if (criteria.mortgage.lienPosition === 'junior') count *= 0.2;

    // Foreclosure criteria impact
    if (criteria.foreclosure.selectedCriteria.length > 0) count *= 0.1;
    if (
      Array.isArray(criteria.foreclosure.foreclosureStatus) &&
      criteria.foreclosure.foreclosureStatus.length > 0
    ) {
      // Different statuses have different availability
      const statusMultiplier = criteria.foreclosure.foreclosureStatus.reduce(
        (mult, status) => {
          switch (status) {
            case 'pre-foreclosure':
            case 'notice-of-default':
              return mult * 0.8;
            case 'reo':
              return mult * 0.3;
            case 'auction-scheduled':
              return mult * 0.2;
            default:
              return mult * 0.5;
          }
        },
        1
      );
      count *= statusMultiplier;
    }

    // Predictive criteria impact
    const { modelScores, selectedCriteria } = criteria.predictive;
    if (selectedCriteria && selectedCriteria.length > 0) {
      count *= 0.2; // Predictive filters are highly specific

      // Check if any high likelihood scores are selected
      const hasHighLikelihood = Object.values(modelScores || {}).some(
        (scores) => scores?.some((score) => score.includes('high'))
      );
      if (hasHighLikelihood) {
        count *= 0.5; // High likelihood scores are rarer
      }
    }

    return Math.max(0, Math.floor(count));
  }, [criteria]);

  const totalCost = useMemo(() => {
    // Mock cost: $0.12 per record, but predictive data costs more
    let baseRate = 0.12;
    if (
      criteria.predictive.selectedCriteria &&
      criteria.predictive.selectedCriteria.length > 0
    ) {
      baseRate = 0.2; // Premium for predictive data
    }
    return recordCount * baseRate;
  }, [recordCount, criteria.predictive.selectedCriteria]);

  return {
    listName,
    setListName,
    criteria,
    setCriteria,
    activeCategory,
    setActiveCategory,
    updateCriteria,
    clearAllCriteria,
    recordCount,
    totalCost,
  };
}
