'use client';

import type React from 'react';
import { GripVertical, EyeOff } from 'lucide-react';
import type { ColumnDef } from './CustomizableTable';
import type { ColumnStates } from '@/hooks/filters/useCustomizableTable';

interface TableHeaderProps<T = unknown> {
  columns: ColumnDef<T>[];
  columnStates: Partial<ColumnStates>;
  viewMode: string;
  draggedColumn: string | null;
  isColumnDraggable: (columnId: string) => boolean;
  handleDragStart: (columnId: string) => void;
  handleDragOver: (e: React.DragEvent, columnId: string) => void;
  handleDragEnd: () => void;
  renderHeader?: (column: ColumnDef<T>, index: number) => React.ReactNode;
}

// Keep column-width logic centralized
const SELECT_COL_WIDTH = 70;

export function TableHeader<T = unknown>({
  columns,
  columnStates,
  viewMode,
  draggedColumn,
  isColumnDraggable,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  renderHeader,
}: TableHeaderProps<T>) {
  return (
    <thead className='bg-muted/50'>
      <tr>
        {columns.map((column) => (
          <th
            key={column.id}
            className={`relative px-4 py-3 text-left font-medium ${
              draggedColumn === column.id ? 'opacity-50' : ''
            } ${
              column.id === 'select' || column.id === 'actions'
                ? 'sticky z-20'
                : ''
            } ${
              column.id === 'actions'
                ? 'border-r border-gray-200 dark:border-gray-700 px-2'
                : ''
            } ${
              column.id === 'select'
                ? 'bg-muted'
                : column.id === 'actions'
                ? 'bg-muted'
                : ''
            }`}
            style={{
              width:
                column.id === 'rowNumber'
                  ? '60px'
                  : column.id === 'id'
                  ? '100px'
                  : column.id === 'select'
                  ? `${columnStates['select']?.width ?? SELECT_COL_WIDTH}px`
                  : column.id === 'actions'
                  ? viewMode === 'records'
                    ? '220px'
                    : '140px'
                  : `${
                      columnStates[column.id]?.width ||
                      column.minWidth ||
                      150
                    }px`,
              minWidth: column.minWidth || 'auto',
              left:
                column.id === 'select'
                  ? 0
                  : column.id === 'actions'
                  ? (columnStates['select']?.visible !== false ? SELECT_COL_WIDTH : 0)
                  : undefined,
              boxShadow:
                column.id === 'select' || column.id === 'actions'
                  ? '4px 0 6px -2px rgba(0, 0, 0, 0.1)'
                  : undefined,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            draggable={isColumnDraggable(column.id)}
            onDragStart={() => handleDragStart(column.id)}
            onDragOver={(e) => {
              e.preventDefault();
              handleDragOver(e, column.id);
            }}
            onDragEnd={handleDragEnd}
          >
            <div className='flex items-center'>
              {isColumnDraggable(column.id) && (
                <span className='inline-flex'>
                  <GripVertical className='h-4 w-4 mr-2 cursor-grab text-muted-foreground' />
                </span>
              )}
              {renderHeader
                ? renderHeader(column, columns.indexOf(column))
                : column.header}
              {columnStates[column.id]?.visible === false && (
                <EyeOff className='h-4 w-4 ml-2 text-muted-foreground' />
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}
