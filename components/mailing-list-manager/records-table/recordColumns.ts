import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { ColumnDef } from '../customizable-table/CustomizableTable';
import type { MailingRecordUI } from '@/types/mailing-records';
import {
  SelectCell,
  ActionsCell,
  TagsCell,
  CampaignsCell,
  EditableNameCell,
  EditableTextCell,
} from './RecordCells';
import { formatDate } from '@/lib/utils';

export interface RecordColumnsProps {
  selectedRecords: string[]
  onCheckboxToggle: (id: string) => void
  selectAll: boolean | 'indeterminate'
  onSelectAllChange: (checked: boolean | 'indeterminate') => void
  sortBy: { column: string; direction: 'asc' | 'desc' }
  onSort: (column: string) => void
  onDelete: (id: string) => void
  onAddTag: (recordId: string, tagId: string) => void
  onRemoveTag: (recordId: string, tagId: string) => void
  onUpdateStatus: (id: string, status: 'active' | 'doNotContact' | 'returnedMail') => void
  onRecordFieldEdit: (id: string, field: string, value: string) => void
  editingRecord: { id: string; field: string; value: string } | null
  saveRecordFieldEdit: () => void
  setEditingRecord: (value: { id: string; field: string; value: string } | null) => void
  availableTags: { id: string; name: string }[]
  onOpenCampaignModal: (campaigns: unknown[], title: string) => void
  nameFormat: 'lastFirst' | 'firstLast'
  getNumericId: (recordId: string) => string
}

export function createRecordColumns({
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
}: RecordColumnsProps): ColumnDef<MailingRecordUI>[] {
  return [
    {
      id: 'select',
      header: React.createElement(Checkbox, {
        checked: selectAll,
        onCheckedChange: onSelectAllChange,
        'aria-label': 'Select all',
      }),
      cell: (record) =>
        React.createElement(SelectCell, {
          record,
          selectedRecords,
          onCheckboxToggle,
        }),
      enableSorting: false,
      minWidth: 50,
      maxWidth: 70,
    },
    {
      id: 'rowNumber',
      header: 'Row',
      cell: (record, index) => (index !== undefined ? index + 1 : ''),
      enableSorting: false,
      minWidth: 60,
      maxWidth: 60,
      hidden: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (record) =>
        React.createElement(ActionsCell, {
          record,
          onUpdateStatus,
          onDelete,
        }),
      enableSorting: false,
      minWidth: 220,
    },
    {
      id: 'tags',
      header: 'Tags',
      cell: (record) =>
        React.createElement(TagsCell, {
          record,
          onAddTag,
          onRemoveTag,
          availableTags,
        }),
      enableSorting: false,
      minWidth: 200,
      maxWidth: 250,
    },
    {
      id: 'campaigns',
      header: 'Campaign Usage',
      cell: (record) =>
        React.createElement(CampaignsCell, {
          record,
          onOpenCampaignModal,
        }),
      enableSorting: false,
      minWidth: 150,
    },
    {
      id: 'id',
      header: React.createElement(
        'div',
        {
          className: 'flex items-center cursor-pointer',
          onClick: () => onSort('id'),
        },
        'ID',
        sortBy.column === 'id' &&
          (sortBy.direction === 'asc'
            ? React.createElement(ChevronUp, { className: 'ml-1 h-4 w-4' })
            : React.createElement(ChevronDown, { className: 'ml-1 h-4 w-4' }))
      ),
      cell: (record) => getNumericId(record.id),
      enableSorting: true,
      minWidth: 80,
      maxWidth: 100,
      hidden: true,
    },
    {
      id: 'name',
      header: React.createElement(
        'div',
        {
          className: 'flex items-center cursor-pointer',
          onClick: () => onSort('name'),
        },
        'Name',
        sortBy.column === 'name' &&
          (sortBy.direction === 'asc'
            ? React.createElement(ChevronUp, { className: 'ml-1 h-4 w-4' })
            : React.createElement(ChevronDown, { className: 'ml-1 h-4 w-4' }))
      ),
      cell: (record) =>
        React.createElement(EditableNameCell, {
          record,
          nameFormat,
          editingRecord,
          onRecordFieldEdit,
          setEditingRecord,
          saveRecordFieldEdit,
        }),
      enableSorting: true,
      minWidth: 200,
      maxWidth: 300,
    },
    {
      id: 'address',
      header: React.createElement(
        'div',
        {
          className: 'flex items-center cursor-pointer',
          onClick: () => onSort('address'),
        },
        'Address',
        sortBy.column === 'address' &&
          (sortBy.direction === 'asc'
            ? React.createElement(ChevronUp, { className: 'ml-1 h-4 w-4' })
            : React.createElement(ChevronDown, { className: 'ml-1 h-4 w-4' }))
      ),
      cell: (record) =>
        React.createElement(EditableTextCell, {
          record,
          field: 'address',
          value: record.address,
          editingRecord,
          onRecordFieldEdit,
          setEditingRecord,
          saveRecordFieldEdit,
        }),
      enableSorting: true,
      minWidth: 250,
    },
    {
      id: 'city',
      header: React.createElement(
        'div',
        {
          className: 'flex items-center cursor-pointer',
          onClick: () => onSort('city'),
        },
        'City',
        sortBy.column === 'city' &&
          (sortBy.direction === 'asc'
            ? React.createElement(ChevronUp, { className: 'ml-1 h-4 w-4' })
            : React.createElement(ChevronDown, { className: 'ml-1 h-4 w-4' }))
      ),
      cell: (record) =>
        React.createElement(EditableTextCell, {
          record,
          field: 'city',
          value: record.city,
          editingRecord,
          onRecordFieldEdit,
          setEditingRecord,
          saveRecordFieldEdit,
        }),
      enableSorting: true,
      minWidth: 150,
    },
    {
      id: 'state',
      header: React.createElement(
        'div',
        {
          className: 'flex items-center cursor-pointer',
          onClick: () => onSort('state'),
        },
        'State',
        sortBy.column === 'state' &&
          (sortBy.direction === 'asc'
            ? React.createElement(ChevronUp, { className: 'ml-1 h-4 w-4' })
            : React.createElement(ChevronDown, { className: 'ml-1 h-4 w-4' }))
      ),
      cell: (record) => record.state || 'N/A',
      enableSorting: true,
      minWidth: 100,
      maxWidth: 120,
    },
    {
      id: 'zipCode',
      header: React.createElement(
        'div',
        {
          className: 'flex items-center cursor-pointer',
          onClick: () => onSort('zipCode'),
        },
        'ZIP',
        sortBy.column === 'zipCode' &&
          (sortBy.direction === 'asc'
            ? React.createElement(ChevronUp, { className: 'ml-1 h-4 w-4' })
            : React.createElement(ChevronDown, { className: 'ml-1 h-4 w-4' }))
      ),
      cell: (record) =>
        React.createElement(EditableTextCell, {
          record,
          field: 'zipCode',
          value: record.zipCode,
          editingRecord,
          onRecordFieldEdit,
          setEditingRecord,
          saveRecordFieldEdit,
        }),
      enableSorting: true,
      minWidth: 100,
      maxWidth: 120,
    },
    {
      id: 'phone',
      header: React.createElement(
        'div',
        {
          className: 'flex items-center cursor-pointer',
          onClick: () => onSort('phone'),
        },
        'Phone',
        sortBy.column === 'phone' &&
          (sortBy.direction === 'asc'
            ? React.createElement(ChevronUp, { className: 'ml-1 h-4 w-4' })
            : React.createElement(ChevronDown, { className: 'ml-1 h-4 w-4' }))
      ),
      cell: (record) =>
        React.createElement(EditableTextCell, {
          record,
          field: 'phone',
          value: record.phone,
          editingRecord,
          onRecordFieldEdit,
          setEditingRecord,
          saveRecordFieldEdit,
        }),
      enableSorting: true,
      minWidth: 150,
    },
    {
      id: 'email',
      header: React.createElement(
        'div',
        {
          className: 'flex items-center cursor-pointer',
          onClick: () => onSort('email'),
        },
        'Email',
        sortBy.column === 'email' &&
          (sortBy.direction === 'asc'
            ? React.createElement(ChevronUp, { className: 'ml-1 h-4 w-4' })
            : React.createElement(ChevronDown, { className: 'ml-1 h-4 w-4' }))
      ),
      cell: (record) =>
        React.createElement(EditableTextCell, {
          record,
          field: 'email',
          value: record.email,
          editingRecord,
          onRecordFieldEdit,
          setEditingRecord,
          saveRecordFieldEdit,
        }),
      enableSorting: true,
      minWidth: 200,
    },
    {
      id: 'status',
      header: React.createElement(
        'div',
        {
          className: 'flex items-center cursor-pointer',
          onClick: () => onSort('status'),
        },
        'Status',
        sortBy.column === 'status' &&
          (sortBy.direction === 'asc'
            ? React.createElement(ChevronUp, { className: 'ml-1 h-4 w-4' })
            : React.createElement(ChevronDown, { className: 'ml-1 h-4 w-4' }))
      ),
      cell: (record) => {
        const statusMap = {
          active: 'Active',
          doNotContact: 'Do Not Contact',
          returnedMail: 'Returned Mail',
        };
        return (
          statusMap[record.status as keyof typeof statusMap] ||
          record.status ||
          'Unknown'
        );
      },
      enableSorting: true,
      minWidth: 150,
    },
    {
      id: 'createdAt',
      header: React.createElement(
        'div',
        {
          className: 'flex items-center cursor-pointer',
          onClick: () => onSort('createdAt'),
        },
        'Created',
        sortBy.column === 'createdAt' &&
          (sortBy.direction === 'asc'
            ? React.createElement(ChevronUp, { className: 'ml-1 h-4 w-4' })
            : React.createElement(ChevronDown, { className: 'ml-1 h-4 w-4' }))
      ),
      cell: (record) => formatDate(record.createdAt),
      enableSorting: true,
      minWidth: 120,
    },
    {
      id: 'modifiedAt',
      header: React.createElement(
        'div',
        {
          className: 'flex items-center cursor-pointer',
          onClick: () => onSort('modifiedAt'),
        },
        'Modified',
        sortBy.column === 'modifiedAt' &&
          (sortBy.direction === 'asc'
            ? React.createElement(ChevronUp, { className: 'ml-1 h-4 w-4' })
            : React.createElement(ChevronDown, { className: 'ml-1 h-4 w-4' }))
      ),
      cell: (record) => formatDate(record.modifiedAt),
      enableSorting: true,
      minWidth: 120,
    },
    {
      id: 'modifiedBy',
      header: React.createElement(
        'div',
        {
          className: 'flex items-center cursor-pointer',
          onClick: () => onSort('modifiedBy'),
        },
        'Modified By',
        sortBy.column === 'modifiedBy' &&
          (sortBy.direction === 'asc'
            ? React.createElement(ChevronUp, { className: 'ml-1 h-4 w-4' })
            : React.createElement(ChevronDown, { className: 'ml-1 h-4 w-4' }))
      ),
      cell: (record) => record.modifiedBy || 'N/A',
      enableSorting: true,
      minWidth: 150,
    },
  ];
}
