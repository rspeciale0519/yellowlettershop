'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Ban, MailX, Trash, X } from 'lucide-react';
import { TagsDropdown } from '../tags-dropdown';
import { CampaignUsageTooltip } from '../campaign-usage-tooltip';

interface Campaign {
  id: string;
  orderId: string;
  mailedDate: string;
}

interface MailingListRecord {
  id: string;
  record_data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    [key: string]: unknown;
  };
  validation_status: string;
  tags?: Array<{ id: string; name: string }>;
  campaigns?: Campaign[];
  status?: 'active' | 'doNotContact' | 'returnedMail';
  created_at: string;
  updated_at: string;
}

interface EditingRecord {
  id: string;
  field: string;
  value: unknown;
}

export interface RecordCellProps {
  record: MailingListRecord;
  onUpdateStatus: (
    id: string,
    status: 'active' | 'doNotContact' | 'returnedMail'
  ) => void;
  onDelete: (id: string) => void;
  onAddTag: (listId: string, tagId: string) => void;
  onRemoveTag: (listId: string, tagId: string) => void;
  onRecordFieldEdit: (id: string, field: string, value: string) => void;
  editingRecord: { id: string; field: string; value: string } | null;
  saveRecordFieldEdit: () => void;
  setEditingRecord: (
    value: EditingRecord | null
  ) => void;
  availableTags: { id: string; name: string }[];
  onOpenCampaignModal: (campaigns: Campaign[], title: string) => void;
}

export function SelectCell({
  record,
  selectedRecords,
  onCheckboxToggle,
}: {
  record: MailingListRecord;
  selectedRecords: string[];
  onCheckboxToggle: (id: string) => void;
}) {
  return (
    <Checkbox
      checked={selectedRecords.includes(record.id)}
      onCheckedChange={() => onCheckboxToggle(record.id)}
      aria-label={`Select ${record.firstName} ${record.lastName}`}
    />
  );
}

export function ActionsCell({
  record,
  onUpdateStatus,
  onDelete,
}: {
  record: MailingListRecord;
  onUpdateStatus: (
    id: string,
    status: 'active' | 'doNotContact' | 'returnedMail'
  ) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className='flex items-center gap-1 flex-wrap'>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                onUpdateStatus(
                  record.id,
                  record.status === 'doNotContact' ? 'active' : 'doNotContact'
                )
              }
              className={`yellow-hover-button ${
                record.status === 'doNotContact'
                  ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                  : ''
              }`}
            >
              <Ban className='h-4 w-4' />
              <span className='sr-only'>
                {record.status === 'doNotContact'
                  ? 'Reactivate'
                  : 'Mark as Do Not Contact'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {record.status === 'doNotContact'
                ? 'Reactivate'
                : 'Mark as Do Not Contact'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                onUpdateStatus(
                  record.id,
                  record.status === 'returnedMail' ? 'active' : 'returnedMail'
                )
              }
              className={`yellow-hover-button ${
                record.status === 'returnedMail'
                  ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                  : ''
              }`}
            >
              <MailX className='h-4 w-4' />
              <span className='sr-only'>
                {record.status === 'returnedMail'
                  ? 'Reactivate'
                  : 'Mark as Returned Mail'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {record.status === 'returnedMail'
                ? 'Reactivate'
                : 'Mark as Returned Mail'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                console.log('Delete button clicked for record:', { id: record.id, record });
                onDelete(record.id);
              }}
              className='yellow-hover-button'
            >
              <Trash className='h-4 w-4' />
              <span className='sr-only'>Delete</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete Record</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function TagsCell({
  record,
  onAddTag,
  onRemoveTag,
  availableTags,
}: {
  record: MailingListRecord;
  onAddTag: (listId: string, tagId: string) => void;
  onRemoveTag: (listId: string, tagId: string) => void;
  availableTags: { id: string; name: string }[];
}) {
  return (
    <div className='flex flex-wrap gap-1 items-center'>
      {record.tags.map((tag: { id: string; name: string }, index: number) => (
        <Badge
          key={`${record.id}-${tag.id}-${index}`}
          variant='outline'
          className='flex items-center gap-1'
        >
          {tag.name}
          <button
            onClick={() => onRemoveTag(record.listId, tag.id)}
            className='text-muted-foreground hover:text-foreground'
          >
            <X className='h-3 w-3' />
          </button>
        </Badge>
      ))}
      <TagsDropdown
        listId={record.listId}
        currentTags={record.tags}
        availableTags={availableTags}
        onAddTag={(tagId) => onAddTag(record.listId, tagId)}
      />
    </div>
  );
}

export function CampaignsCell({
  record,
  onOpenCampaignModal,
}: {
  record: MailingListRecord;
  onOpenCampaignModal: (
    campaigns: { id: string; orderId: string; mailedDate: string }[],
    title: string
  ) => void;
}) {
  // Normalize campaign objects to the shape expected by CampaignUsageTooltip
  const campaigns = Array.isArray(record?.campaigns)
    ? record.campaigns.map((c: Campaign) => ({
        id: String(c?.id ?? ''),
        orderId: String(
          c?.orderId ?? c?.order_id ?? c?.orderNumber ?? c?.name ?? 'N/A'
        ),
        mailedDate: String(
          c?.mailedDate ?? c?.mailed_date ?? c?.date ?? c?.created_at ?? ''
        ),
      }))
    : [];

  return (
    <CampaignUsageTooltip
      campaigns={campaigns}
      onOpenModal={onOpenCampaignModal}
      title={'Campaign Usage'}
      isList={false}
    />
  );
}

// Extract duplicated editing logic into a reusable component
const EditableField = ({
  record,
  field,
  value,
  editingRecord,
  onRecordFieldEdit,
  setEditingRecord,
  saveRecordFieldEdit,
  className,
  suffix = '',
}: {
  record: MailingListRecord;
  field: string;
  value: string;
  editingRecord: { id: string; field: string; value: string } | null;
  onRecordFieldEdit: (id: string, field: string, value: string) => void;
  setEditingRecord: (value: { id: string; field: string; value: string } | null) => void;
  saveRecordFieldEdit: () => void;
  className?: string;
  suffix?: string;
}) => {
  return editingRecord && editingRecord.id === record.id && editingRecord.field === field ? (
    <Input
      value={editingRecord.value}
      onChange={(e) => setEditingRecord({ ...editingRecord, value: e.target.value })}
      onBlur={saveRecordFieldEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') saveRecordFieldEdit()
        if (e.key === 'Escape') setEditingRecord(null)
      }}
      autoFocus
      className={className || "w-24 h-8"}
    />
  ) : (
    <div
      className="cursor-pointer hover:underline"
      onClick={() => onRecordFieldEdit(record.id, field, value)}
    >
      {value}{suffix}
    </div>
  )
}

export function EditableNameCell({
  record,
  nameFormat,
  editingRecord,
  onRecordFieldEdit,
  setEditingRecord,
  saveRecordFieldEdit,
}: {
  record: MailingListRecord
  nameFormat: 'lastFirst' | 'firstLast'
  editingRecord: { id: string; field: string; value: string } | null
  onRecordFieldEdit: (id: string, field: string, value: string) => void
  setEditingRecord: (value: { id: string; field: string; value: any } | null) => void
  saveRecordFieldEdit: () => void
}) {
  return (
    <div className="flex gap-1">
      {nameFormat === 'lastFirst' ? (
        <>
          <EditableField
            record={record}
            field="lastName"
            value={record.lastName}
            editingRecord={editingRecord}
            onRecordFieldEdit={onRecordFieldEdit}
            setEditingRecord={setEditingRecord}
            saveRecordFieldEdit={saveRecordFieldEdit}
            suffix="," 
          />
          <EditableField
            record={record}
            field="firstName"
            value={record.firstName}
            editingRecord={editingRecord}
            onRecordFieldEdit={onRecordFieldEdit}
            setEditingRecord={setEditingRecord}
            saveRecordFieldEdit={saveRecordFieldEdit}
          />
        </>
      ) : (
        <>
          <EditableField
            record={record}
            field="firstName"
            value={record.firstName}
            editingRecord={editingRecord}
            onRecordFieldEdit={onRecordFieldEdit}
            setEditingRecord={setEditingRecord}
            saveRecordFieldEdit={saveRecordFieldEdit}
          />
          <EditableField
            record={record}
            field="lastName"
            value={record.lastName}
            editingRecord={editingRecord}
            onRecordFieldEdit={onRecordFieldEdit}
            setEditingRecord={setEditingRecord}
            saveRecordFieldEdit={saveRecordFieldEdit}
          />
        </>
      )}
    </div>
  )
}

export function EditableTextCell({
  record,
  field,
  value,
  editingRecord,
  onRecordFieldEdit,
  setEditingRecord,
  saveRecordFieldEdit,
}: {
  record: MailingListRecord;
  field: string;
  value: string;
  editingRecord: { id: string; field: string; value: string } | null;
  onRecordFieldEdit: (id: string, field: string, value: string) => void;
  setEditingRecord: (
    value: EditingRecord | null
  ) => void;
  saveRecordFieldEdit: () => void;
}) {
  return editingRecord &&
    editingRecord.id === record.id &&
    editingRecord.field === field ? (
    <Input
      value={editingRecord.value}
      onChange={(e) =>
        setEditingRecord({ ...editingRecord, value: e.target.value })
      }
      onBlur={saveRecordFieldEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') saveRecordFieldEdit();
        if (e.key === 'Escape') setEditingRecord(null);
      }}
      autoFocus
      className='w-full h-8'
    />
  ) : (
    <div
      className='cursor-pointer hover:underline'
      onClick={() => onRecordFieldEdit(record.id, field, value)}
    >
      {value || 'N/A'}
    </div>
  );
}
