import { useState, useEffect, useCallback, useRef } from 'react';
import type { ListCriteria } from '@/types/list-builder';

interface ListEstimate {
  recordCount: number;
  cost: number;
  loading: boolean;
  error: string | null;
}

interface UseListEstimateOptions {
  debounceMs?: number;
  enableRealTimeAPI?: boolean;
}

export function useListEstimate(
  criteria: ListCriteria,
  options: UseListEstimateOptions = {}
) {
  const { debounceMs = 500, enableRealTimeAPI = false } = options;
  
  const [estimate, setEstimate] = useState<ListEstimate>({
    recordCount: 0,
    cost: 0,
    loading: false,
    error: null,
  });

  const calculateMockEstimate = useCallback((criteria: ListCriteria): ListEstimate => {
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
      (criteria.property.propertyValue[0] + criteria.property.propertyValue[1]) / 2;
    if (avgValue > 500000) count *= 0.7;
    if (avgValue < 200000) count *= 1.2;

    // Square footage impact
    const avgSqFt =
      (criteria.property.squareFootage[0] + criteria.property.squareFootage[1]) / 2;
    if (avgSqFt > 3000) count *= 0.8;
    if (avgSqFt < 1500) count *= 1.1;

    // Mortgage criteria impact
    if (criteria.mortgage?.selectedCriteria?.length > 0) count *= 0.7;
    if (criteria.mortgage?.lienPosition === 'first') count *= 0.8;
    if (criteria.mortgage?.lienPosition === 'junior') count *= 0.2;

    // Foreclosure criteria impact
    if (criteria.foreclosure?.selectedCriteria?.length > 0) count *= 0.1;
    if (
      Array.isArray(criteria.foreclosure?.foreclosureStatus) &&
      criteria.foreclosure?.foreclosureStatus.length > 0
    ) {
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
    if (criteria.predictive?.selectedCriteria?.length > 0) {
      count *= 0.6;
      const predictiveCriteriaCount = criteria.predictive.selectedCriteria.length;
      count *= Math.pow(0.9, predictiveCriteriaCount);
    }

    const finalCount = Math.max(0, Math.floor(count));
    const cost = finalCount * 0.12; // $0.12 per record

    return {
      recordCount: finalCount,
      cost,
      loading: false,
      error: null,
    };
  }, []);

  const fetchRealTimeEstimate = useCallback(async (criteria: ListCriteria): Promise<ListEstimate> => {
    try {
      setEstimate(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/list-builder/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ criteria }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        recordCount: data.recordCount || 0,
        cost: data.cost || 0,
        loading: false,
        error: null,
      };
    } catch (error) {
      console.error('Failed to fetch real-time estimate:', error);
      
      // Fallback to mock calculation on API error
      const mockEstimate = calculateMockEstimate(criteria);
      return {
        ...mockEstimate,
        error: error instanceof Error ? error.message : 'Failed to get estimate',
      };
    }
  }, [calculateMockEstimate]);

  // Debounce functionality using useRef
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const debouncedEstimate = useCallback(
    async (criteria: ListCriteria) => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        let result: ListEstimate;
        
        if (enableRealTimeAPI) {
          result = await fetchRealTimeEstimate(criteria);
        } else {
          result = calculateMockEstimate(criteria);
        }
        
        setEstimate(result);
      }, debounceMs);
    },
    [enableRealTimeAPI, fetchRealTimeEstimate, calculateMockEstimate, debounceMs]
  );

  // Effect to trigger estimate calculation when criteria changes
  useEffect(() => {
    debouncedEstimate(criteria);
    
    // Cleanup function to cancel pending debounced calls
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [criteria, debouncedEstimate]);

  // Manual refresh function
  const refreshEstimate = useCallback(async () => {
    // Cancel any pending calls
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    let result: ListEstimate;
    if (enableRealTimeAPI) {
      result = await fetchRealTimeEstimate(criteria);
    } else {
      result = calculateMockEstimate(criteria);
    }
    
    setEstimate(result);
  }, [criteria, enableRealTimeAPI, fetchRealTimeEstimate, calculateMockEstimate]);

  return {
    ...estimate,
    refreshEstimate,
  };
}