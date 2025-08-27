// This file has been modularized into customizable-table/ directory
// Re-export the main component to maintain backward compatibility

export { CustomizableTable } from './customizable-table/CustomizableTable';

// Re-export types for backward compatibility
export type { ColumnDef, CustomizableTableProps } from './customizable-table/CustomizableTable';