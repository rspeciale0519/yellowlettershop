// Custom hook for mortgage filters callbacks
import { useCallback } from 'react';
import type { MortgageCriteria } from '@/types/list-builder';

interface UseMortgageFiltersCallbacksProps {
  criteria: MortgageCriteria;
  onUpdate: (values: Partial<MortgageCriteria>) => void;
  expandedPanels: string[];
  setExpandedPanels: (panels: string[]) => void;
  savedCriteria: (typeof MORTGAGE_TEMPLATES)[];
  setSavedCriteria: (criteria: (typeof MORTGAGE_TEMPLATES)[]) => void;
}

export function useMortgageFiltersCallbacks({
  criteria,
  onUpdate,
  expandedPanels,
  setExpandedPanels,
  savedCriteria,
  setSavedCriteria,
}: UseMortgageFiltersCallbacksProps) {
  const addCriterion = useCallback(
    (criterion: string) => {
      if (criterion && !criteria.selectedCriteria.includes(criterion)) {
        onUpdate({
          selectedCriteria: [...criteria.selectedCriteria, criterion],
        });
        setExpandedPanels((prev) =>
          prev.includes(criterion) ? prev : [...prev, criterion]
        );
      }
  const removeCriterion = useCallback(
    (criterion: string) => {
      onUpdate({
        selectedCriteria: criteria.selectedCriteria.filter((c) => c !== criterion),
      })
      setExpandedPanels((prev) => prev.filter((p) => p !== criterion))
    },
    [criteria.selectedCriteria, onUpdate, setExpandedPanels],
  )
      });
      setExpandedPanels(expandedPanels.filter((p) => p !== criterion));
    },
    [criteria.selectedCriteria, expandedPanels, onUpdate]
  );
  const applyTemplate = useCallback(
    (template: MortgageCriteriaTemplate) => {
      onUpdate(template.criteria)
      // Expand relevant panels
      setExpandedPanels(template.criteria.selectedCriteria || [])
    },
    [onUpdate, setExpandedPanels],
  )
    (template: (typeof MORTGAGE_TEMPLATES)[0]) => {
      onUpdate(template.criteria);
  const saveCurrentCriteria = useCallback(() => {
    const name = prompt("Enter a name for this criteria set:")
    if (name && name.trim()) {
      const newTemplate = {
        id: `custom-${Date.now()}`,
        name: name.trim(),
        description: "Custom saved criteria",
        criteria: {
          selectedCriteria: [...criteria.selectedCriteria],
          lienPosition: criteria.lienPosition,
          mortgageAmount: criteria.mortgageAmount,
          interestRate: criteria.interestRate,
          mortgageOriginationDate: criteria.mortgageOriginationDate,
          maturityDate: criteria.maturityDate,
          mortgageTerm: criteria.mortgageTerm,
          primaryLoanType: criteria.primaryLoanType,
        },
      }
      setSavedCriteria((prev) => [...prev, newTemplate])
    }
  }, [criteria, setSavedCriteria])
          mortgageTerm: criteria.mortgageTerm,
  const deleteSavedCriteria = useCallback(
    (templateId: string) => {
      setSavedCriteria((prev) => prev.filter((t) => t.id !== templateId))
    },
    [setSavedCriteria],
  )

  const deleteSavedCriteria = useCallback(
    (templateId: string) => {
      setSavedCriteria(savedCriteria.filter((t) => t.id !== templateId));
    },
    [savedCriteria]
  );

  return {
    addCriterion,
    removeCriterion,
    togglePanel,
    applyTemplate,
    saveCurrentCriteria,
    deleteSavedCriteria,
  };
}
