// Custom hook for build lists page state and calculations
import { useState, useCallback } from 'react';
import type { ListCriteria } from '@/types/list-builder';
import { initialCriteria } from '@/app/mailing-services/build-lists/config/initialCriteria';
import { useListEstimate } from '@/hooks/use-list-estimate';

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

  // Use the real-time estimate hook
  const { recordCount, cost: totalCost, loading: estimateLoading, error: estimateError, refreshEstimate } = useListEstimate(criteria, {
    debounceMs: 750,
    enableRealTimeAPI: process.env.NODE_ENV === 'production', // Enable real API in production
  });

  const updateCriteria = useCallback<UpdateCriteria>((category, values) => {
    setCriteria((prev) => ({
      ...prev,
      [category]: { ...prev[category], ...values },
    }));
  }, []);

  const clearAllCriteria = useCallback(() => {
    setCriteria(initialCriteria);
  }, []);


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
    estimateLoading,
    estimateError,
    refreshEstimate,
  };
}
