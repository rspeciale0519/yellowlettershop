'use client';

import type React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

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

interface TableSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnDef[];
  columnStates: { [key: string]: ColumnState };
  nameFormat: string;
  setNameFormat: (format: string) => void;
  toggleColumnVisibility: (columnId: string) => void;
  resetColumnOrder: () => void;
  resetColumnVisibility: () => void;
  handleResetColumnWidths: () => void;
}

export function TableSettingsDialog({
  open,
  onOpenChange,
  columns,
  columnStates,
  nameFormat,
  setNameFormat,
  toggleColumnVisibility,
  resetColumnOrder,
  resetColumnVisibility,
  handleResetColumnWidths,
}: TableSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Table Settings</DialogTitle>
          <DialogDescription>
            Configure column visibility, name format, and other table options.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Column Visibility Section */}
          <div>
            <h3 className="text-lg font-medium mb-3">Column Visibility</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {columns.map((column) => {
                // Skip columns that should always be visible
                if (column.id === 'select') {
                  return null;
                }

                const columnName =
                  typeof column.header === 'string'
                    ? column.header
                    : column.id === 'rowNumber'
                    ? 'Row ID'
                    : column.id === 'id'
                    ? 'ID'
                    : column.id.charAt(0).toUpperCase() + column.id.slice(1);

                return (
                  <div
                    key={column.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`visibility-${column.id}`}
                      checked={columnStates[column.id]?.visible !== false}
                      onCheckedChange={() =>
                        toggleColumnVisibility(column.id)
                      }
                    />
                    <Label
                      htmlFor={`visibility-${column.id}`}
                      className="cursor-pointer"
                    >
                      {columnName}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Name Format Section */}
          {columns.some((col) => col.id === 'name') && (
            <div>
              <h3 className="text-lg font-medium mb-3">Name Format</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="name-format-last-first"
                    checked={nameFormat === 'lastFirst'}
                    onCheckedChange={() => setNameFormat('lastFirst')}
                  />
                  <Label
                    htmlFor="name-format-last-first"
                    className="cursor-pointer"
                  >
                    Last, First
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="name-format-first-last"
                    checked={nameFormat === 'firstLast'}
                    onCheckedChange={() => setNameFormat('firstLast')}
                  />
                  <Label
                    htmlFor="name-format-first-last"
                    className="cursor-pointer"
                  >
                    First Last
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Reset Options Section */}
          <div>
            <h3 className="text-lg font-medium mb-3">Reset Options</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={resetColumnOrder}
                className="w-full justify-start"
              >
                Reset Column Order
              </Button>
              <Button
                variant="outline"
                onClick={resetColumnVisibility}
                className="w-full justify-start"
              >
                Show All Columns
              </Button>
              <Button
                variant="outline"
                onClick={handleResetColumnWidths}
                className="w-full justify-start"
              >
                Reset Column Widths
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}