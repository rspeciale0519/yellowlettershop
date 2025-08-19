import * as React from "react"

// Generic helper hook to standardize onUpdate usage for criteria objects.
// Returns a stable mergeUpdate function that shallow-merges partial updates.
export function useCriterionUpdate<TCriteria>(
  onUpdate: (values: Partial<TCriteria>) => void,
) {
  const mergeUpdate = React.useCallback(
    (patch: Partial<TCriteria>) => {
      onUpdate(patch)
    },
    [onUpdate],
  )

  const updateField = React.useCallback(
    <K extends keyof TCriteria>(key: K, value: TCriteria[K]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mergeUpdate({ [key]: value } as any)
    },
    [mergeUpdate],
  )

  return { mergeUpdate, updateField }
}
