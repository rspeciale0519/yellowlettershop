"use client"

interface ListSummaryProps {
  listName: string
  onNameChange: (name: string) => void
  recordCount: number
  totalCost: number
}

export function ListSummary({ listName, onNameChange, recordCount, totalCost }: ListSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="text-right"></div>
    </div>
  )
}
