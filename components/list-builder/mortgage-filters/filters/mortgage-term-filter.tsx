"use client"

import type { MortgageCriteria } from "@/types/list-builder"
import { Button } from "@/components/ui/button"

interface MortgageTermFilterProps {
  criteria: MortgageCriteria
  onUpdate: (values: Partial<MortgageCriteria>) => void
}

const TERM_OPTIONS = [1, 3, 5, 7, 10, 15, 20, 30, 40, 50]

export function MortgageTermFilter({ criteria, onUpdate }: MortgageTermFilterProps) {
  const handleTermToggle = (term: number) => {
    const currentTerms = criteria.mortgageTerm?.terms || []
    const newTerms = currentTerms.includes(term)
      ? currentTerms.filter((t: number) => t !== term)
      : [...currentTerms, term]
    onUpdate({ mortgageTerm: { terms: newTerms } })
  }

  return (
    <div className="space-y-4 p-4 border-t">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Select mortgage term lengths to include in your search.
      </p>
      <div className="grid grid-cols-5 gap-2">
        {TERM_OPTIONS.map((term) => (
          <Button
            key={term}
            variant={criteria.mortgageTerm?.terms?.includes(term) ? "default" : "outline"}
            size="sm"
            onClick={() => handleTermToggle(term)}
            className="text-xs"
          >
            {term} Year{term > 1 ? "s" : ""}
          </Button>
        ))}
      </div>
    </div>
  )
}
