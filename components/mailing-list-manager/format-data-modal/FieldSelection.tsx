'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ColumnDef } from '../customizable-table/CustomizableTable';

interface FieldSelectionProps {
  textColumns: ColumnDef<unknown>[];
  selectedColumns: string[];
  onToggleColumn: (columnId: string) => void;
  recordSelection: string;
  onRecordSelectionChange: (selection: string) => void;
  recordRange: {
    from: string;
    to: string;
    next: string;
    rest: string;
    record: string;
    startAt: string;
  };
  onRecordRangeChange: (range: any) => void;
}

export function FieldSelection({
  textColumns,
  selectedColumns,
  onToggleColumn,
  recordSelection,
  onRecordSelectionChange,
  recordRange,
  onRecordRangeChange,
}: FieldSelectionProps) {
  return (
    <div className='flex-1 overflow-hidden'>
      <div className='mb-4'>
        <Label className='text-base font-medium'>Field List</Label>
        <p className='text-sm text-muted-foreground mb-2'>
          Select the fields you want to format.
        </p>
      </div>

      <ScrollArea className='h-[300px] border rounded-md'>
        <div className='p-4 space-y-2'>
          {textColumns.map((column) => {
            const columnName =
              typeof column.header === 'string'
                ? column.header
                : column.id.charAt(0).toUpperCase() + column.id.slice(1);

            return (
              <div key={column.id} className='flex items-center space-x-2'>
                <Checkbox
                  id={`column-${column.id}`}
                  checked={selectedColumns.includes(column.id)}
                  onCheckedChange={() => onToggleColumn(column.id)}
                />
                <Label htmlFor={`column-${column.id}`}>{columnName}</Label>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className='mt-6'>
        <Label className='text-base font-medium'>Record Selection</Label>
        <RadioGroup
          value={recordSelection}
          onValueChange={onRecordSelectionChange}
          className='mt-2 space-y-2'
        >
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='record' id='record' />
            <Label htmlFor='record'>Record</Label>
            <Input
              value={recordRange.record}
              onChange={(e) =>
                onRecordRangeChange({ ...recordRange, record: e.target.value })
              }
              className='w-20 ml-2'
              disabled={recordSelection !== 'record'}
            />
          </div>

          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='fromTo' id='fromTo' />
            <Label htmlFor='fromTo'>From-To</Label>
            <Input
              value={recordRange.from}
              onChange={(e) =>
                onRecordRangeChange({ ...recordRange, from: e.target.value })
              }
              className='w-20 ml-2'
              disabled={recordSelection !== 'fromTo'}
            />
            <span>-</span>
            <Input
              value={recordRange.to}
              onChange={(e) =>
                onRecordRangeChange({ ...recordRange, to: e.target.value })
              }
              className='w-20'
              disabled={recordSelection !== 'fromTo'}
            />
          </div>

          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='next' id='next' />
            <Label htmlFor='next'>Next</Label>
            <Input
              value={recordRange.next}
              onChange={(e) =>
                onRecordRangeChange({ ...recordRange, next: e.target.value })
              }
              className='w-20 ml-2'
              disabled={recordSelection !== 'next'}
            />
            <Label htmlFor='next-start' className='ml-2'>
              Start at:
            </Label>
            <Input
              id='next-start'
              type='number'
              inputMode='numeric'
              min={1}
              value={recordRange.startAt}
              onChange={(e) =>
                onRecordRangeChange({ ...recordRange, startAt: e.target.value })
              }
              className='w-20 ml-2'
              disabled={recordSelection !== 'next'}
            />{' '}
          </div>

          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='rest' id='rest' />
            <Label htmlFor='rest'>Rest</Label>
            <Input
              value={recordRange.rest}
              onChange={(e) =>
                onRecordRangeChange({ ...recordRange, rest: e.target.value })
              }
              className='w-20 ml-2'
              disabled={recordSelection !== 'rest'}
            />
          </div>

          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='marked' id='marked' />
            <Label htmlFor='marked'>Marked</Label>
          </div>

          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='deleted' id='deleted' />
            <Label htmlFor='deleted'>Deleted</Label>
          </div>

          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='selection' id='selection' />
            <Label htmlFor='selection'>Selection</Label>
          </div>

          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='all' id='all' />
            <Label htmlFor='all'>All</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
