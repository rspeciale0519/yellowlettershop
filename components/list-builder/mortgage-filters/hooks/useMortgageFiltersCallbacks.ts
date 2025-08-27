// Custom hook for mortgage filters callbacks
import { useCallback } from "react"
import type { MortgageCriteria } from "@/types/list-builder"

interface UseMortgageFiltersCallbacksProps {
  criteria: MortgageCriteria
  onUpdate: (values: Partial<MortgageCriteria>) => void
  expandedPanels: string[]
  setExpandedPanels: (panels: string[]) => void
  savedCriteria: (typeof MORTGAGE_TEMPLATES)[]
  setSavedCriteria: (criteria: (typeof MORTGAGE_TEMPLATES)[]) => void
}

export function useMortgageFiltersCallbacks({
  criteria,
  onUpdate,
  expandedPanels,
  setExpandedPanels,
  savedCriteria,
  setSavedCriteria,
}: UseMortgageFiltersCallbacksProps) {
  const addCriterion = useCallback(() => {
    if (selectedCriterion && !criteria.selectedCriteria.includes(selectedCriterion)) {
      onUpdate({
        selectedCriteria: [...criteria.selectedCriteria, selectedCriterion],
      })
      setExpandedPanels([...expandedPanels, selectedCriterion])
      setSelectedCriterion("")
    }
  }, [selectedCriterion, criteria.selectedCriteria, expandedPanels, onUpdate])

  const removeCriterion = useCallback(
    (criterion: string) => {
      onUpdate({
        selectedCriteria: criteria.selectedCriteria.filter((c) => c !== criterion),
      })
      setExpandedPanels(expandedPanels.filter((p) => p !== criterion))
    },
    [criteria.selectedCriteria, expandedPanels, onUpdate],
  )

  const togglePanel = useCallback((criterion: string) => {
    setExpandedPanels((prev) => (prev.includes(criterion) ? prev.filter((p) => p !== criterion) : [...prev, criterion]))
  }, [])

  const applyTemplate = useCallback(
    (template: (typeof MORTGAGE_TEMPLATES)[0]) => {
      onUpdate(template.criteria)
      setShowTemplates(false)
      // Expand relevant panels
      setExpandedPanels(template.criteria.selectedCriteria || [])
    },
    [onUpdate],
  )

  const saveCurrentCriteria = useCallback(() => {
    const name = prompt("Enter a name for this criteria set:")
    if (name && name.trim()) {
      const newTemplate = {
        id: `custom-${Date.now()}`,
        name: name.trim(),
        description: "Custom saved criteria",
        criteria: {
          selectedCriteria: criteria.selectedCriteria,
          lienPosition: criteria.lienPosition,
          mortgageAmount: criteria.mortgageAmount,
          interestRate: criteria.interestRate,
          mortgageOriginationDate: criteria.mortgageOriginationDate,
          maturityDate: criteria.maturityDate,
          mortgageTerm: criteria.mortgageTerm,
          primaryLoanType: criteria.primaryLoanType,
        },
      }
      setSavedCriteria([...savedCriteria, newTemplate])
    }
  }, [criteria, savedCriteria])

  const deleteSavedCriteria = useCallback(
    (templateId: string) => {
      setSavedCriteria(savedCriteria.filter((t) => t.id !== templateId))
    },
    [savedCriteria],
  )

  return {
    addCriterion,
    removeCriterion,
    togglePanel,
    applyTemplate,
    saveCurrentCriteria,
    deleteSavedCriteria,
  }
}
