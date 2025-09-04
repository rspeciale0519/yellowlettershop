// Pure helper for transforming parsed spreadsheet rows using user-provided mappings.
export function transformDataWithMappings(
  headers: string[],
  rows: string[][],
  columnMappings: Record<string, string>
) {
  const transformedRows: Array<Record<string, any>> = []

  for (const row of rows) {
    const transformedRow: Record<string, any> = {}

    headers.forEach((header, index) => {
      const systemField = columnMappings[header]
      // Treat empty and explicit 'skip' as unmapped selections
      if (systemField && systemField !== '' && systemField !== 'skip') {
        transformedRow[systemField] = row[index] || ''
      }
    })

    // Only include rows that have at least one mapped field with data
    if (Object.values(transformedRow).some((value) => value !== '')) {
      transformedRows.push(transformedRow)
    }
  }

  return transformedRows
}

