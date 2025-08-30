'use client';

import type React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { DataOperationsDropdown } from '../data-operations-dropdown';
import { useCustomizableTable } from '@/hooks/filters/useCustomizableTable';
import type { ColumnStates } from '@/hooks/filters/useCustomizableTable';
import { ResizeObserverErrorHandler } from './ResizeObserverErrorHandler';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { TableSettingsDialog } from './TableSettingsDialog';
import { useLocalStorage } from '@/hooks/use-local-storage';

export interface ColumnDef<TRecord = unknown> {
  id: string;
  header: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  cell: (row: TRecord, index?: number) => React.ReactNode;
  enableSorting?: boolean;
  hidden?: boolean;
}
export interface CustomizableTableProps<TRecord = unknown> {
  data: TRecord[];
  columns: ColumnDef<TRecord>[];
  renderRow: (
    record: TRecord,
    columns: ColumnDef<TRecord>[],
    columnStates: ColumnStates,
    index: number
  ) => React.ReactNode;
  renderHeader?: (column: ColumnDef<TRecord>, index: number) => React.ReactNode;
  viewMode: string;
  selectedRecords?: Set<unknown>;
  onDataOperation?: (operation: string, records: Set<unknown>) => void;
  className?: string;
  storageKeyPrefix?: string;
  ariaLabel?: string;
}

export function CustomizableTable<TRecord = unknown>({
  data,
  columns,
  renderRow,
  renderHeader,
  viewMode,
  selectedRecords = new Set(),
  onDataOperation,
  className = '',
  storageKeyPrefix = 'mlm',
  ariaLabel = 'Data table',
}: CustomizableTableProps<TRecord>): React.JSX.Element {
  const [nameFormat, setNameFormat] = useLocalStorage(
    'nameFormat',
    'lastFirst'
  );

  const {
    columnStates,
    settingsOpen,
    setSettingsOpen,
    draggedColumn,
    toggleColumnVisibility,
    resetColumnOrder,
    resetColumnVisibility,
    handleResetColumnWidths,
    isColumnDraggable,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    getVisibleColumns,
  } = useCustomizableTable(columns, data);

  const visibleColumns = getVisibleColumns();

  return (
    <div className={`space-y-4 ${className}`}>
      <ResizeObserverErrorHandler />

      {/* Table actions */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {data.length > 0 && (
            <DataOperationsDropdown
              columns={columns as any}
              records={data as any}
            />
          )}
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setSettingsOpen(true)}
            className='flex items-center'
          >
            <Settings className='h-4 w-4 mr-2' />
            <span>Table Settings</span>
          </Button>
        </div>
      </div>

      {/* Table container */}
      <div className='w-full'>
        <div className='overflow-x-auto relative'>
          <table
            className='w-full border-collapse table-fixed'
            style={{ minWidth: '100%' }}
          >
            <TableHeader
              columns={visibleColumns}
              columnStates={columnStates}
              viewMode={viewMode}
              draggedColumn={draggedColumn}
              isColumnDraggable={isColumnDraggable}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDragEnd={handleDragEnd}
              renderHeader={renderHeader}
            />
            <TableBody
              data={data}
              columns={visibleColumns}
              columnStates={columnStates}
              renderRow={renderRow}
            />
          </table>
        </div>
      </div>

      {/* Settings Dialog */}
      <TableSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        columns={columns}
        columnStates={columnStates}
        nameFormat={nameFormat}
        setNameFormat={setNameFormat}
        toggleColumnVisibility={toggleColumnVisibility}
        resetColumnOrder={resetColumnOrder}
        resetColumnVisibility={resetColumnVisibility}
        handleResetColumnWidths={handleResetColumnWidths}
      />
    </div>
  );
}
