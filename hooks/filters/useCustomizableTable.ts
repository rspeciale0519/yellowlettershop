'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { ColumnDef } from '@/components/mailing-list-manager/customizable-table/CustomizableTable';
import type React from 'react';

export interface ColumnState {
  visible: boolean;
  width?: number;
  order: number;
}

export interface ColumnStates {
  [key: string]: ColumnState;
}

export function useCustomizableTable<TRecord = unknown>(
  columns: ColumnDef<TRecord>[],
  data: TRecord[]
) {
  const [columnStates, setColumnStates] = useLocalStorage<ColumnStates>(
    'tableColumnStates',
    {}
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  // Auto-resize columns effect
  useEffect(() => {
    const autoResizeColumns = () => {
      if (data.length === 0 || columns.length === 0) return;

      // Create and cache the canvas/context once
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      const measureTextWidth = (text: string, font: string) => {
        if (!text) return 0;
        try {
          if (!context) return 0;
          context.font = font;
          const metrics = context.measureText(text);
          return metrics.width;
        } catch (error) {
          console.error('Error measuring text width:', error);
          return 0;
        }
      };

      const getTableFont = () => {
        const tableElement = document.querySelector('table');
        if (!tableElement) return '14px system-ui';
        const computedStyle = window.getComputedStyle(tableElement);
        return `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;
      };

      const font = getTableFont();

      // Use functional update to avoid stale columnStates and remove it from deps
      setColumnStates((currentStates: ColumnStates) => {
        const newColumnStates = { ...currentStates };
        let updated = false;

        columns.forEach((column) => {
          if (column.id === 'select' || column.id === 'actions') return;

          const currentState = newColumnStates[column.id];
          if (currentState && currentState.width) return;

          const headerText =
            typeof column.header === 'string'
              ? column.header
              : typeof column.header === 'number'
              ? String(column.header)
              : String(column.id);
          let maxWidth = measureTextWidth(headerText, font) + 40;

          // Sample a few rows to estimate column width
          const sampleSize = Math.min(data.length, 10);
          for (let i = 0; i < sampleSize; i++) {
            try {
              const cellContent = column.cell(data[i], i);
              let textContent = '';

              if (typeof cellContent === 'string') {
                textContent = cellContent;
              } else if (typeof cellContent === 'number') {
                textContent = cellContent.toString();
              } else if (cellContent && typeof cellContent === 'object' && 'props' in cellContent) {
                const element = cellContent as any;
                // Note: This is a simplified text extraction that may not handle complex React structures
                // Consider passing a textExtractor function as part of ColumnDef for complex cells
                if (element.props?.children) {
                  const children = element.props.children;
                  textContent = typeof children === 'string' ? children
                              : typeof children === 'number' ? children.toString()
                              : ''; // Default for complex nested structures
                }
              }

              const cellWidth = measureTextWidth(textContent, font) + 40;
              maxWidth = Math.max(maxWidth, cellWidth);
            } catch (error) {
              console.warn(
                `Error processing cell content for column ${column.id}:`,
                error
              );
            }
          }

          const finalWidth = Math.max(
            Math.min(maxWidth, 300),
            column.minWidth || 80
          );

          newColumnStates[column.id] = {
            visible: currentState?.visible ?? true,
            width: finalWidth,
            order: currentState?.order ?? columns.findIndex((c) => c.id === column.id),
          };
          updated = true;
        });

        return updated ? newColumnStates : currentStates;
      });
    };

    const timeoutId = setTimeout(autoResizeColumns, 100);
    return () => clearTimeout(timeoutId);
  }, [data, columns, setColumnStates]);
  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      if (columnId === 'select') return;

      setColumnStates((prev: ColumnStates) => ({
        ...prev,
        [columnId]: {
          ...prev[columnId],
          visible: !(prev[columnId]?.visible ?? true),
          width: prev[columnId]?.width,
          order:
            prev[columnId]?.order ??
            columns.findIndex((c) => c.id === columnId),
        },
      }));
    },
    [columns, setColumnStates]
  );

  const resetColumnOrder = useCallback(() => {
    setColumnStates((prev: ColumnStates) => {
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
  }, [columns, setColumnStates]);

  const resetColumnVisibility = useCallback(() => {
    setColumnStates((prev: ColumnStates) => {
      const newStates = { ...prev };
      columns.forEach((column) => {
        if (newStates[column.id]) {
          newStates[column.id] = {
            ...newStates[column.id],
            visible: true,
          };
        }
      });
      return newStates;
    });
  }, [columns, setColumnStates]);

  const handleResetColumnWidths = useCallback(() => {
    setColumnStates((prev: ColumnStates) => {
      const newStates = { ...prev };
      columns.forEach((column) => {
        if (newStates[column.id]) {
          delete newStates[column.id].width;
        }
      });
      return newStates;
    });
  }, [columns, setColumnStates]);

  const isColumnDraggable = useCallback((columnId: string) => {
    return (
      columnId !== 'select' &&
      columnId !== 'actions' &&
      columnId !== 'rowNumber'
    );
  }, []);

  const handleDragStart = useCallback(
    (columnId: string) => {
      if (!isColumnDraggable(columnId)) return;
      setDraggedColumn(columnId);
    },
    [isColumnDraggable]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, columnId: string) => {
      e.preventDefault();
      if (
        !draggedColumn ||
        !isColumnDraggable(columnId) ||
        draggedColumn === columnId
      ) {
        return;
      }
    },
    [draggedColumn, isColumnDraggable]
  );

  const handleDrop = useCallback(
    (targetColumnId: string) => {
      if (
        !draggedColumn ||
        !isColumnDraggable(targetColumnId) ||
        draggedColumn === targetColumnId
      ) {
        return;
      }

      setColumnStates((prev: ColumnStates) => {
        const newStates = { ...prev };
        const draggedOrder =
          newStates[draggedColumn]?.order ??
          columns.findIndex((c) => c.id === draggedColumn);
        const targetOrder =
          newStates[targetColumnId]?.order ??
          columns.findIndex((c) => c.id === targetColumnId);

        if (!newStates[draggedColumn]) {
          newStates[draggedColumn] = {
            visible: true,
            order: draggedOrder,
          };
        }
        if (!newStates[targetColumnId]) {
          newStates[targetColumnId] = {
            visible: true,
            order: targetOrder,
          };
        }

        newStates[draggedColumn].order = targetOrder;
        newStates[targetColumnId].order = draggedOrder;

        return newStates;
      });

      setDraggedColumn(null);
    },
    [draggedColumn, isColumnDraggable, columns, setColumnStates]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedColumn(null);
  }, []);

  const getVisibleColumns = useCallback((): ColumnDef<TRecord>[] => {
    return columns
      .filter((column) => columnStates[column.id]?.visible !== false)
      .sort((a, b) => {
        const aOrder =
          columnStates[a.id]?.order ?? columns.findIndex((c) => c.id === a.id);
        const bOrder =
          columnStates[b.id]?.order ?? columns.findIndex((c) => c.id === b.id);
        return aOrder - bOrder;
      });
  }, [columns, columnStates]);

  return {
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
    handleDrop,
    handleDragEnd,
    getVisibleColumns,
  };
}
