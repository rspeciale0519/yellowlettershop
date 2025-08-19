'use client';

import { useState, useEffect } from 'react';
import type React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, GripVertical, EyeOff, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { DataOperationsDropdown } from './data-operations-dropdown';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Add a global error handler for ResizeObserver errors
if (typeof window !== 'undefined') {
  // Override the error event to catch and suppress ResizeObserver errors
  window.addEventListener(
    'error',
    (event) => {
      if (event.message && event.message.includes('ResizeObserver')) {
        event.stopImmediatePropagation();
        event.preventDefault();
        console.log('Suppressed ResizeObserver error in customizable-table');
        return false;
      }
    },
    true
  );

  // Also handle unhandled promise rejections
  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (
        event.reason &&
        event.reason.message &&
        event.reason.message.includes('ResizeObserver')
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
        console.log(
          'Suppressed ResizeObserver promise rejection in customizable-table'
        );
        return false;
      }
    },
    true
  );
}

// Update the ColumnDef interface to include autoSize property
export interface ColumnDef {
  id: string;
  header: React.ReactNode;
  cell?: (record: any, index?: number) => React.ReactNode;
  enableSorting?: boolean;
  minWidth?: number;
  maxWidth?: number;
  hidden?: boolean;
  stickyLeft?: number;
  autoSize?: boolean; // Add this property
}

interface ColumnState {
  id: string;
  visible: boolean;
  width: number;
  order: number;
}

interface CustomizableTableProps {
  data: any[];
  columns: ColumnDef[];
  tableId: string;
  renderRow: (
    record: any,
    visibleColumns: ColumnDef[],
    columnStates: Record<string, ColumnState>,
    index?: number
  ) => React.ReactNode;
  renderHeader?: (column: ColumnDef, index: number) => React.ReactNode;
  showDataOperations?: boolean;
  onNameFormatChange?: (format: 'lastFirst' | 'firstLast') => void;
  onCreateCampaignList?: () => void;
}

export function CustomizableTable({
  data,
  columns,
  tableId,
  renderRow,
  renderHeader,
  showDataOperations = false,
  onNameFormatChange,
  onCreateCampaignList,
}: CustomizableTableProps) {
  // Get column states from local storage or initialize with defaults
  const [columnStates, setColumnStates] = useLocalStorage<
    Record<string, ColumnState>
  >(
    `table-columns-${tableId}`,
    columns.reduce((acc, column, index) => {
      acc[column.id] = {
        id: column.id,
        visible: column.hidden !== true,
        width: column.minWidth || 150,
        order: index,
      };
      return acc;
    }, {} as Record<string, ColumnState>)
  );

  // State for name format preference
  const [nameFormat, setNameFormat] = useLocalStorage<
    'lastFirst' | 'firstLast'
  >(`table-name-format-${tableId}`, 'firstLast');

  // State for column settings dialog
  const [settingsOpen, setSettingsOpen] = useState(false);

  // State for drag and drop
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  // Add cleanup for any potential ResizeObserver instances
  useEffect(() => {
    return () => {
      // This is a cleanup function that will run when the component unmounts
      // It helps prevent ResizeObserver errors when the component is removed from the DOM
      if (typeof window !== 'undefined' && window.ResizeObserver) {
        // Just a safety measure
      }
    };
  }, []);

  // Update parent component when name format changes
  useEffect(() => {
    if (onNameFormatChange) {
      onNameFormatChange(nameFormat);
    }
  }, [nameFormat, onNameFormatChange]);

  // Update the initialization of column states to respect the hidden property
  useEffect(() => {
    let updated = false;
    const newColumnStates = { ...columnStates };

    // Add any new columns
    columns.forEach((column, index) => {
      if (!newColumnStates[column.id]) {
        // Set appropriate default width based on column type
        let defaultWidth = column.minWidth || 150;
        if (column.id === 'rowNumber') defaultWidth = 60;
        if (column.id === 'id') defaultWidth = 100;

        newColumnStates[column.id] = {
          id: column.id,
          visible: column.hidden !== true,
          width: defaultWidth,
          order: index,
        };
        updated = true;
      } else if (
        column.id === 'rowNumber' &&
        newColumnStates[column.id].width !== 60
      ) {
        // Ensure rowNumber column always has width of 60px
        newColumnStates[column.id] = {
          ...newColumnStates[column.id],
          width: 60,
        };
        updated = true;
      } else if (
        column.id === 'id' &&
        newColumnStates[column.id].width !== 100
      ) {
        // Ensure id column always has width of 100px
        newColumnStates[column.id] = {
          ...newColumnStates[column.id],
          width: 100,
        };
        updated = true;
      }
    });

    // Remove any columns that no longer exist
    Object.keys(newColumnStates).forEach((columnId) => {
      if (!columns.find((col) => col.id === columnId)) {
        delete newColumnStates[columnId];
        updated = true;
      }
    });

    if (updated) {
      setColumnStates(newColumnStates);
    }
  }, [columns, columnStates, setColumnStates]);

  // Add content-based auto-sizing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Create a function to measure text width
      const measureTextWidth = (text, font) => {
        if (!text) return 0;
        try {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          context.font = font;
          const metrics = context.measureText(text);
          return metrics.width;
        } catch (error) {
          console.log('Error measuring text width:', error);
          return 150; // Default width
        }
      };

      // Get the current font from the table
      const getTableFont = () => {
        const tableElement = document.querySelector('table');
        if (!tableElement) return '14px system-ui';
        const computedStyle = window.getComputedStyle(tableElement);
        return `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;
      };

      // Only run this if we have data and columns
      if (data.length > 0 && columns.length > 0) {
        const font = getTableFont();
        const newColumnStates = { ...columnStates };
        let updated = false;

        // Process columns that should be auto-sized
        columns.forEach((column) => {
          if (
            column.autoSize &&
            column.id !== 'select' &&
            column.id !== 'actions'
          ) {
            // Start with header width + padding
            const headerText =
              typeof column.header === 'string'
                ? column.header
                : column.id.charAt(0).toUpperCase() + column.id.slice(1);

            let maxWidth = measureTextWidth(headerText, font) + 40; // Add padding

            // Check cell contents - only for a sample of rows to avoid performance issues
            const sampleSize = Math.min(data.length, 20); // Check at most 20 rows
            for (let i = 0; i < sampleSize; i++) {
              const record = data[i];
              if (column.cell) {
                // For complex cell content, use a more conservative approach
                if (column.id === 'tags' || column.id === 'campaigns') {
                  // These columns have complex content, use a reasonable fixed width
                  maxWidth = Math.max(maxWidth, column.minWidth || 150);
                  continue;
                }

                // For simple text content
                let textContent = '';
                const cellContent = column.cell(record);

                if (typeof cellContent === 'string') {
                  textContent = cellContent;
                } else if (typeof cellContent === 'number') {
                  textContent = cellContent.toString();
                } else if (cellContent && typeof cellContent === 'object') {
                  // Try to extract text from simple React elements
                  // This is a simplified approach that works for basic cases
                  if (column.id === 'name') {
                    // Special handling for name column which has first and last name
                    const firstName = record.firstName || '';
                    const lastName = record.lastName || '';
                    textContent = `${firstName} ${lastName}`;
                  } else {
                    // For other columns, use a more conservative approach
                    continue;
                  }
                }

                const cellWidth = measureTextWidth(textContent, font) + 40; // Add padding
                maxWidth = Math.max(maxWidth, cellWidth);
              }
            }

            // Apply minimum width constraint
            maxWidth = Math.max(maxWidth, column.minWidth || 100);

            // Apply maximum width constraint to prevent excessive widths
            const reasonableMaxWidth = 300; // Set a reasonable maximum width
            if (column.maxWidth) {
              maxWidth = Math.min(maxWidth, column.maxWidth);
            } else {
              maxWidth = Math.min(maxWidth, reasonableMaxWidth);
            }

            // Update column state if width has changed significantly
            if (
              newColumnStates[column.id] &&
              Math.abs(newColumnStates[column.id].width - maxWidth) > 10
            ) {
              // Only update if difference is significant
              newColumnStates[column.id] = {
                ...newColumnStates[column.id],
                width: maxWidth,
              };
              updated = true;
            }
          }
        });

        if (updated) {
          setColumnStates(newColumnStates);
        }
      }
    } catch (error) {
      console.log('Error in column auto-sizing:', error);
    }
  }, [data, columns, columnStates, setColumnStates]);

  // Get visible columns in the correct order
  const visibleColumns = columns
    .filter((column) => columnStates[column.id]?.visible !== false)
    .sort(
      (a, b) =>
        (columnStates[a.id]?.order || 0) - (columnStates[b.id]?.order || 0)
    );

  // Handle column visibility toggle
  const toggleColumnVisibility = (columnId: string) => {
    // Don't allow toggling visibility for the select column
    if (columnId === 'select') return;

    setColumnStates((prev) => ({
      ...prev,
      [columnId]: {
        ...prev[columnId],
        visible: !prev[columnId].visible,
      },
    }));
  };

  // Handle column order reset
  const resetColumnOrder = () => {
    setColumnStates((prev) => {
      const newStates = { ...prev };
      columns.forEach((column, index) => {
        if (newStates[column.id]) {
          newStates[column.id] = {
            ...newStates[column.id],
            order: index,
          };
        }
      });
      return newStates;
    });
  };

  // Handle column visibility reset
  const resetColumnVisibility = () => {
    setColumnStates((prev) => {
      const newStates = { ...prev };
      columns.forEach((column) => {
        if (newStates[column.id]) {
          newStates[column.id] = {
            ...newStates[column.id],
            visible: column.hidden !== true,
          };
        }
      });
      return newStates;
    });
  };

  // Handle column width reset
  const handleResetColumnWidths = () => {
    setColumnStates((prev) => {
      const newStates = { ...prev };
      columns.forEach((column) => {
        if (newStates[column.id]) {
          newStates[column.id] = {
            ...newStates[column.id],
            width: column.minWidth || 150,
          };
        }
      });
      return newStates;
    });
  };

  // Check if a column is draggable
  const isColumnDraggable = (columnId: string) => {
    return (
      columnId !== 'select' &&
      columnId !== 'actions' &&
      columnId !== 'rowNumber' &&
      columnId !== 'id'
    );
  };

  // Handle column drag start
  const handleDragStart = (columnId: string) => {
    // Prevent dragging for non-draggable columns
    if (!isColumnDraggable(columnId)) return;

    setDraggedColumn(columnId);
  };

  // Handle column drag over
  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();

    // Prevent dropping onto non-draggable columns
    if (!isColumnDraggable(columnId)) return;

    if (draggedColumn && draggedColumn !== columnId) {
      // Get the current order of the dragged column and the target column
      const draggedOrder = columnStates[draggedColumn].order;
      const targetOrder = columnStates[columnId].order;

      // Update the order of all affected columns
      setColumnStates((prev) => {
        const newStates = { ...prev };

        if (draggedOrder < targetOrder) {
          // Moving right
          Object.keys(newStates).forEach((id) => {
            if (id === draggedColumn) {
              newStates[id] = { ...newStates[id], order: targetOrder };
            } else if (
              newStates[id].order > draggedOrder &&
              newStates[id].order <= targetOrder
            ) {
              newStates[id] = {
                ...newStates[id],
                order: newStates[id].order - 1,
              };
            }
          });
        } else {
          // Moving left
          Object.keys(newStates).forEach((id) => {
            if (id === draggedColumn) {
              newStates[id] = { ...newStates[id], order: targetOrder };
            } else if (
              newStates[id].order >= targetOrder &&
              newStates[id].order < draggedOrder
            ) {
              newStates[id] = {
                ...newStates[id],
                order: newStates[id].order + 1,
              };
            }
          });
        }

        return newStates;
      });
    }
  };

  // Handle column drag end
  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  const viewMode = 'records'; // TODO: Remove hardcoded value

  return (
    <div className='relative'>
      <div className='mb-4 p-2 flex justify-between items-center'>
        {showDataOperations && (
          <DataOperationsDropdown columns={columns} records={data} />
        )}

        {onCreateCampaignList && (
          <Button
            variant='default'
            size='sm'
            onClick={onCreateCampaignList}
            className='flex items-center gap-1 mx-2 bg-yellow-400 hover:bg-yellow-500 text-black border-0'
          >
            <Mail className='h-4 w-4' />
            <span>Create Campaign List</span>
          </Button>
        )}

        <div className={showDataOperations ? '' : 'ml-auto'}>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setSettingsOpen(true)}
            className='yellow-hover-button'
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
            <thead className='bg-muted/50'>
              <tr>
                {visibleColumns.map((column) => (
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
                        : 'bg-muted/50'
                    }`}
                    style={{
                      width:
                        column.id === 'rowNumber'
                          ? '60px'
                          : column.id === 'id'
                          ? '100px'
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
                          ? columnStates['select']?.width || 70
                          : undefined,
                      boxShadow:
                        column.id === 'select' || column.id === 'actions'
                          ? '4px 0 6px -2px rgba(0, 0, 0, 0.1)'
                          : undefined,
                      whiteSpace: 'nowrap', // Add this line to prevent text wrapping
                      overflow: 'hidden', // Add this line to handle overflow
                      textOverflow: 'ellipsis', // Add this line to show ellipsis for overflowing text
                    }}
                    draggable={isColumnDraggable(column.id)}
                    onDragStart={() => handleDragStart(column.id)}
                    onDragOver={(e) => handleDragOver(e, column.id)}
                    onDragEnd={handleDragEnd}
                  >
                    {/* Column header content */}
                    <div className='flex items-center'>
                      {isColumnDraggable(column.id) && (
                        <span className='inline-flex'>
                          <GripVertical className='h-4 w-4 mr-2 cursor-grab text-muted-foreground' />
                        </span>
                      )}
                      {renderHeader
                        ? renderHeader(column, visibleColumns.indexOf(column))
                        : column.header}
                      {columnStates[column.id]?.visible === false && (
                        <EyeOff className='h-4 w-4 ml-2 text-muted-foreground' />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y'>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length}
                    className='px-4 py-8 text-center'
                  >
                    <p className='text-muted-foreground'>No data available</p>
                  </td>
                </tr>
              ) : (
                data.map((record, index) =>
                  renderRow(record, visibleColumns, columnStates, index)
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className='sm:max-w-md md:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Table Settings</DialogTitle>
            <DialogDescription>
              Configure column visibility, name format, and other table options.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-6 py-4'>
            {/* Column Visibility Section */}
            <div>
              <h3 className='text-lg font-medium mb-3'>Column Visibility</h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
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
                      className='flex items-center space-x-2'
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
                        className='cursor-pointer'
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
                <h3 className='text-lg font-medium mb-3'>Name Format</h3>
                <div className='space-y-2'>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='name-format-last-first'
                      checked={nameFormat === 'lastFirst'}
                      onCheckedChange={() => setNameFormat('lastFirst')}
                    />
                    <Label
                      htmlFor='name-format-last-first'
                      className='cursor-pointer'
                    >
                      Last, First
                    </Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='name-format-first-last'
                      checked={nameFormat === 'firstLast'}
                      onCheckedChange={() => setNameFormat('firstLast')}
                    />
                    <Label
                      htmlFor='name-format-first-last'
                      className='cursor-pointer'
                    >
                      First Last
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Reset Options Section */}
            <div>
              <h3 className='text-lg font-medium mb-3'>Reset Options</h3>
              <div className='flex flex-wrap gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={resetColumnOrder}
                  className='yellow-hover-button'
                >
                  Reset Column Order
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={resetColumnVisibility}
                  className='yellow-hover-button'
                >
                  Reset Column Visibility
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleResetColumnWidths}
                  className='yellow-hover-button'
                >
                  Reset Column Widths
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setSettingsOpen(false)}
              className='yellow-hover-button'
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
