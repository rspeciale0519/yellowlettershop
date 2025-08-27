'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface ColumnState {
  visible: boolean;
  width?: number;
  order: number;
}

interface ColumnStates {
  [key: string]: ColumnState;
}

interface ColumnDef {
  id: string;
  header: string;
  minWidth?: number;
  cell: (row: any) => React.ReactNode;
}

export function useCustomizableTable(columns: ColumnDef[], data: any[]) {
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

      const measureTextWidth = (text: string, font: string) => {
        if (!text) return 0;
        try {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
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
      const newColumnStates = { ...columnStates };
      let updated = false;

      columns.forEach((column) => {
        if (column.id === 'select' || column.id === 'actions') return;

        const currentState = newColumnStates[column.id];
        if (currentState && currentState.width) return;

        let maxWidth = measureTextWidth(column.header, font) + 60;

        const sampleSize = Math.min(data.length, 20);
        for (let i = 0; i < sampleSize; i++) {
          const record = data[i];
          try {
            const cellContent = column.cell(record);
            let textContent = '';

            if (typeof cellContent === 'string') {
              textContent = cellContent;
            } else if (typeof cellContent === 'number') {
              textContent = cellContent.toString();
            } else if (cellContent && typeof cellContent === 'object' && 'props' in cellContent) {
              const element = cellContent as any;
              if (element.props && element.props.children) {
                textContent = element.props.children.toString();
              }
            }

            const cellWidth = measureTextWidth(textContent, font) + 40;
            maxWidth = Math.max(maxWidth, cellWidth);
          } catch (error) {
            console.warn(`Error processing cell content for column ${column.id}:`, error);
          }
        }

        const finalWidth = Math.max(
          Math.min(maxWidth, 300),
          column.minWidth || 80
        );

        if (!currentState || currentState.width !== finalWidth) {
          newColumnStates[column.id] = {
            ...currentState,
            visible: currentState?.visible ?? true,
            width: finalWidth,
            order: currentState?.order ?? columns.indexOf(column),
          };
          updated = true;
        }
      });

      if (updated) {
        setColumnStates(newColumnStates);
      }
    };

    const timeoutId = setTimeout(autoResizeColumns, 100);
    return () => clearTimeout(timeoutId);
  }, [data, columns, columnStates, setColumnStates]);

  const toggleColumnVisibility = useCallback((columnId: string) => {
    if (columnId === 'select') return;

    setColumnStates((prev) => ({
      ...prev,
      [columnId]: {
        ...prev[columnId],
        visible: !(prev[columnId]?.visible ?? true),
        width: prev[columnId]?.width,
        order: prev[columnId]?.order ?? columns.findIndex(c => c.id === columnId),
      },
    }));
  }, [columns, setColumnStates]);

  const resetColumnOrder = useCallback(() => {
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
  }, [columns, setColumnStates]);

  const resetColumnVisibility = useCallback(() => {
    setColumnStates((prev) => {
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
    setColumnStates((prev) => {
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

  const handleDragStart = useCallback((columnId: string) => {
    if (!isColumnDraggable(columnId)) return;
    setDraggedColumn(columnId);
  }, [isColumnDraggable]);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (!draggedColumn || !isColumnDraggable(columnId) || draggedColumn === columnId) {
      return;
    }
  }, [draggedColumn, isColumnDraggable]);

  const handleDrop = useCallback((targetColumnId: string) => {
    if (!draggedColumn || !isColumnDraggable(targetColumnId) || draggedColumn === targetColumnId) {
      return;
    }

    setColumnStates((prev) => {
      const newStates = { ...prev };
      const draggedOrder = newStates[draggedColumn]?.order ?? columns.findIndex(c => c.id === draggedColumn);
      const targetOrder = newStates[targetColumnId]?.order ?? columns.findIndex(c => c.id === targetColumnId);

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
  }, [draggedColumn, isColumnDraggable, columns, setColumnStates]);

  const handleDragEnd = useCallback(() => {
    setDraggedColumn(null);
  }, []);

  const getVisibleColumns = useCallback(() => {
    return columns
      .filter(column => columnStates[column.id]?.visible !== false)
      .sort((a, b) => {
        const aOrder = columnStates[a.id]?.order ?? columns.findIndex(c => c.id === a.id);
        const bOrder = columnStates[b.id]?.order ?? columns.findIndex(c => c.id === b.id);
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