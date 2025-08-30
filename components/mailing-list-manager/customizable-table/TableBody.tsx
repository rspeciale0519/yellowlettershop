'use client';

import type React from 'react';
import { Fragment } from 'react';
import type { ColumnDef } from './CustomizableTable';
import type { ColumnStates } from '@/hooks/filters/useCustomizableTable';

interface TableBodyProps<TRecord = unknown> {
  data: TRecord[];
  columns: ColumnDef<TRecord>[];
  columnStates: ColumnStates;
  renderRow: (
    record: TRecord,
    columns: ColumnDef<TRecord>[],
    columnStates: ColumnStates,
    index: number
  ) => React.ReactNode;
  getRowKey?: (record: TRecord, index: number) => React.Key;
}

export function TableBody<TRecord = unknown>({
  data,
  columns,
  columnStates,
  renderRow,
  getRowKey,
}: TableBodyProps<TRecord>): React.ReactElement {
  return (
    <tbody className='divide-y'>
      {data.length === 0 ? (
        <tr>
          <td colSpan={columns.length} className='px-4 py-8 text-center'>
            <p className='text-muted-foreground'>No data available</p>
          </td>
        </tr>
      ) : (
        data.map((record, index) => (
          <Fragment key={getRowKey ? getRowKey(record, index) : index}>
            {renderRow(record, columns, columnStates, index)}
          </Fragment>
        ))
      )}
    </tbody>
  );
}
