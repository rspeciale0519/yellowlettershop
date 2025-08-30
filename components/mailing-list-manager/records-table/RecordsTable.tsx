'use client';

import { useMemo, useEffect } from 'react';
import { CustomizableTable } from '../customizable-table/CustomizableTable';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { createRecordColumns } from './recordColumns';
import type {
  MailingRecordUI,
  EditingRecord,
  TagOption,
  RecordStatus,
} from '@/types/mailing-records';

export interface RecordsTableProps {
  records: MailingRecordUI[];
  selectedRecords: string[];
  onCheckboxToggle: (id: string) => void;
  selectAll: boolean;
  onSelectAllChange: (checked: boolean | 'indeterminate') => void;
  sortBy: { column: string; direction: 'asc' | 'desc' };
  onSort: (column: string) => void;
  onDelete: (id: string) => void;
  onAddTag: (listId: string, tagId: string) => void;
  onRemoveTag: (listId: string, tagId: string) => void;
  onUpdateStatus: (id: string, status: RecordStatus) => void;
  onRecordFieldEdit: (id: string, field: string, value: string) => void;
  editingRecord: EditingRecord | null;
  saveRecordFieldEdit: () => void;
  setEditingRecord: (value: EditingRecord | null) => void;
  availableTags: TagOption[];
  onOpenCampaignModal: (campaigns: unknown[], title: string) => void;
  onCreateCampaignList?: () => void;
}
export function RecordsTable({
  records,
  selectedRecords,
  onCheckboxToggle,
  selectAll,
  onSelectAllChange,
  sortBy,
  onSort,
  onDelete,
  onAddTag,
  onRemoveTag,
  onUpdateStatus,
  onRecordFieldEdit,
  editingRecord,
  saveRecordFieldEdit,
  setEditingRecord,
  availableTags,
  onOpenCampaignModal,
  onCreateCampaignList,
}: RecordsTableProps) {
  // Cleanup function to ensure any ResizeObserver is disconnected
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.ResizeObserver) {
        // Safety measure for cleanup
      }
    };
  }, []);

  // State for name format preference
  const [nameFormat, setNameFormat] = useLocalStorage<
    'lastFirst' | 'firstLast'
  >('table-name-format-mailing-records', 'lastFirst');

  // Function to extract numeric ID from record ID
  const getNumericId = (recordId: string) => {
    // Extract the numeric part at the end of the ID
    const match = recordId.match(/\d+$/);
    if (match) {
      return match[0];
    }

    // If no match found, generate a numeric hash from the string
    let hash = 0;
    for (let i = 0; i < recordId.length; i++) {
      const char = recordId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString().substring(0, 8);
  };

  // Create columns using the extracted function
  const columns = useMemo(
    () =>
      createRecordColumns({
        selectedRecords,
        onCheckboxToggle,
        selectAll,
        onSelectAllChange,
        sortBy,
        onSort,
        onDelete,
        onAddTag,
        onRemoveTag,
        onUpdateStatus,
        onRecordFieldEdit,
        editingRecord,
        saveRecordFieldEdit,
        setEditingRecord,
        availableTags,
        onOpenCampaignModal,
        nameFormat,
        getNumericId,
      }),
    [
      selectAll,
      onSelectAllChange,
      selectedRecords,
      onCheckboxToggle,
      sortBy,
      onSort,
      onUpdateStatus,
      onDelete,
      onRecordFieldEdit,
      editingRecord,
      saveRecordFieldEdit,
      setEditingRecord,
      onOpenCampaignModal,
      onRemoveTag,
      onAddTag,
      availableTags,
      nameFormat,
    ]
  );

  // Handle name format change from the CustomizableTable
  const handleNameFormatChange = (format: 'lastFirst' | 'firstLast') => {
    setNameFormat(format);
  };

  return (
    <>
      <CustomizableTable
        data={records}
        columns={columns}
        viewMode='records'
        renderRow={(record, visibleColumns, columnStates, index) => {
          // Create a stable key for the row
          const rowKey = `row-${record.id}`;

          return (
            <tr
              key={rowKey}
              className={`hover:bg-muted/50 ${
                record.status === 'doNotContact'
                  ? 'bg-red-50 dark:bg-red-950/20'
                  : record.status === 'returnedMail'
                  ? 'bg-amber-50 dark:bg-amber-950/20'
                  : ''
              }`}
            >
              {visibleColumns.map((column) => {
                // Create a stable key for the cell
                const cellKey = `${rowKey}-${column.id}`;

                // Determine background color based on record status
                let bgColor = 'bg-white dark:bg-gray-950';
                if (record.status === 'doNotContact') {
                  bgColor = 'bg-red-50 dark:bg-red-950/20';
                } else if (record.status === 'returnedMail') {
                  bgColor = 'bg-amber-50 dark:bg-amber-950/20';
                }

                return (
                  <td
                    key={cellKey}
                    data-column-id={column.id}
                    className={`py-3 overflow-hidden text-ellipsis whitespace-nowrap ${
                      column.id === 'select'
                        ? `sticky z-10 ${bgColor} px-4`
                        : column.id === 'actions'
                        ? `sticky z-10 ${bgColor} px-2 border-r border-gray-200 dark:border-gray-700`
                        : 'px-4'
                    }`}
                    style={{
                      width:
                        column.id === 'rowNumber'
                          ? '60px'
                          : column.id === 'id'
                          ? '100px'
                          : column.id === 'actions'
                          ? '220px'
                          : `${
                              columnStates[column.id]?.width ||
                              column.minWidth ||
                              150
                            }px`,
                      minWidth:
                        column.id === 'rowNumber'
                          ? '60px'
                          : column.id === 'id'
                          ? '80px'
                          : column.id === 'actions'
                          ? '220px'
                          : column.minWidth || 150,
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
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {column.cell ? column.cell(record, index) : null}
                  </td>
                );
              })}
            </tr>
          );
        }}
      />
    </>
  );
}
