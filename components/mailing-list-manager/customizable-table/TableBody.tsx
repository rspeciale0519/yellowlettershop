'use client';

import type React from 'react';

interface ColumnDef {
  id: string;
  header: string;
  minWidth?: number;
  cell: (row: any) => React.ReactNode;
}

interface ColumnState {
  visible: boolean;
  width?: number;
  order: number;
}

interface TableBodyProps {
  data: any[];
  columns: ColumnDef[];
  columnStates: { [key: string]: ColumnState };
  renderRow: (record: any, columns: ColumnDef[], columnStates: { [key: string]: ColumnState }, index: number) => React.ReactNode;
}

export function TableBody({
  data,
  columns,
  columnStates,
  renderRow,
}: TableBodyProps) {
  return (
    <tbody className="divide-y">
      {data.length === 0 ? (
        <tr>
          <td
            colSpan={columns.length}
            className="px-4 py-8 text-center"
          >
            <p className="text-muted-foreground">No data available</p>
          </td>
        </tr>
      ) : (
        data.map((record, index) =>
          renderRow(record, columns, columnStates, index)
        )
      )}
    </tbody>
  );
}