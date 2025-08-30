// Custom hook for mortgage filters callbacks
import { useCallback } from 'react';
import type { MortgageCriteria } from '@/types/list-builder';

// Define the template type directly since MORTGAGE_TEMPLATES might not be available
interface MortgageCriteriaTemplate {
  id: string;
  name: string;
  description: string;
  criteria: Partial<MortgageCriteria>;
}

interface UseMortgageFiltersCallbacksProps {
  criteria: MortgageCriteria;
  onUpdate: (values: Partial<MortgageCriteria>) => void;
  expandedPanels: string[];
  setExpandedPanels: (panels: string[]) => void;
  savedCriteria: MortgageCriteriaTemplate[];
  setSavedCriteria: (criteria: MortgageCriteriaTemplate[]) => void;
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
    },
    [criteria.selectedCriteria, onUpdate, setExpandedPanels]
  );

  const removeCriterion = useCallback(
    (criterion: string) => {
      onUpdate({
        selectedCriteria: criteria.selectedCriteria.filter((c) => c !== criterion),
      });
      setExpandedPanels((prev) => prev.filter((p) => p !== criterion));
    },
    [criteria.selectedCriteria, onUpdate, setExpandedPanels]
  );

  const togglePanel = useCallback(
    (panelId: string) => {
      setExpandedPanels((prev) =>
        prev.includes(panelId)
          ? prev.filter((p) => p !== panelId)
          : [...prev, panelId]
      );
    },
    [setExpandedPanels]
  );

  const applyTemplate = useCallback(
    (template: MortgageCriteriaTemplate) => {
      onUpdate(template.criteria);
      // Expand relevant panels
      setExpandedPanels(template.criteria.selectedCriteria || []);
    },
    [onUpdate, setExpandedPanels]
  );

  const saveCurrentCriteria = useCallback(() => {
    const name = prompt("Enter a name for this criteria set:");
    if (name && name.trim()) {
      const newTemplate: MortgageCriteriaTemplate = {
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
      };
      setSavedCriteria((prev) => [...prev, newTemplate]);
    }
  }, [criteria, setSavedCriteria]);

  const deleteSavedCriteria = useCallback(
    (templateId: string) => {
      setSavedCriteria((prev) => prev.filter((t) => t.id !== templateId));
    },
    [setSavedCriteria]
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
