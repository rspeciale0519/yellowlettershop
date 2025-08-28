'use client';

import type React from 'react';
import { Fragment } from 'react';
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
  columnStates: Record<string, ColumnState>;
  renderRow: (record: any, columns: ColumnDef[], columnStates: Record<string, ColumnState>, index: number) => React.ReactNode;
  getRowKey?: (record: any, index: number) => React.Key;
}    columns: ColumnDef[],
    columnStates: { [key: string]: ColumnState },
    index: number
  ) => React.ReactNode;
}

export function TableBody({
  data,
  columns,
  columnStates,
  renderRow,
}: TableBodyProps) {
            colSpan={colSpan}    <tbody className='divide-y'>
      {data.length === 0 ? (
        <tr>
          <td colSpan={columns.length} className='px-4 py-8 text-center'>
            <p className='text-muted-foreground'>No data available</p>
          </td>
        </tr>
        data.map((record, index) => (
          <Fragment key={getRowKey ? getRowKey(record, index) : index}>
            {renderRow(record, columns, columnStates, index)}
          </Fragment>
        ))        )
      )}
    </tbody>
  );
}
