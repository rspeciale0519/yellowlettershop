'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DateRangePicker } from '@/components/list-builder/mortgage-filters/components/date-range-picker';
import { X, Plus, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ColumnFilter, ColumnFilterOperator, Column, CombinedConjunction } from './types';


interface ColumnFiltersSectionProps {
  columnFilters: ColumnFilter[];
  columns: Column[];
  conjunction: CombinedConjunction;
  onAddFilter: () => void;
  onRemoveFilter: (id: string) => void;
  onUpdateFilter: (id: string, updates: Partial<ColumnFilter>) => void;
  onSetConjunction: (conjunction: CombinedConjunction) => void;
}

export function ColumnFiltersSection({
  columnFilters,
  columns,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter,
  conjunction,
  onSetConjunction,
}: ColumnFiltersSectionProps) {

  const getOperatorsForColumnType = (columnType: string) => {
    switch (columnType) {
      case 'text':
        return [
          { value: 'contains', label: 'Contains' },
          { value: 'equals', label: 'Equals' },
          { value: 'startsWith', label: 'Starts with' },
          { value: 'endsWith', label: 'Ends with' },
          { value: 'empty', label: 'Is empty' },
          { value: 'notEmpty', label: 'Is not empty' },
        ];
      case 'number':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'greaterThan', label: 'Greater than' },
          { value: 'lessThan', label: 'Less than' },
          { value: 'between', label: 'Between' },
          { value: 'empty', label: 'Is empty' },
          { value: 'notEmpty', label: 'Is not empty' },
        ];
      case 'date':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'greaterThan', label: 'After' },
          { value: 'lessThan', label: 'Before' },
          { value: 'between', label: 'Between' },
          { value: 'empty', label: 'Is empty' },
          { value: 'notEmpty', label: 'Is not empty' },
        ];
      case 'boolean':
        return [{ value: 'equals', label: 'Equals' }];
      default:
        return [
          { value: 'contains', label: 'Contains' },
          { value: 'equals', label: 'Equals' },
        ];
    }
  };

  const renderValueInput = (filter: ColumnFilter, columnType: string) => {
    const needsValueInput = !['empty', 'notEmpty'].includes(filter.operator);

    if (!needsValueInput) {
      return null;
    }

    switch (columnType) {
      case 'text':
        return (
          <Input
            value={(filter.value as string) || ''}
            onChange={(e) =>
              onUpdateFilter(filter.id, { value: e.target.value })
            }
            placeholder='Enter value'
            className='w-full'
          />
        );
      case 'number':
        if (filter.operator === 'between') {
          return (
            <div className='flex items-center gap-2'>
              <Input
                type='number'
                value={(filter.value as [number, number])?.[0] || ''}
                onChange={(e) => {
                  const currentValue = (filter.value as [number, number]) || [
                    0, 0,
                  ];
                  onUpdateFilter(filter.id, {
                    value: [Number(e.target.value), currentValue[1]],
                  });
                }}
                placeholder='Min'
                className='w-full'
              />
              <span>to</span>
              <Input
                type='number'
                value={(filter.value as [number, number])?.[1] || ''}
                onChange={(e) => {
                  const currentValue = (filter.value as [number, number]) || [
                    0, 0,
                  ];
                  onUpdateFilter(filter.id, {
                    value: [currentValue[0], Number(e.target.value)],
                  });
                }}
                placeholder='Max'
                className='w-full'
              />
            </div>
          );
        }
        return (
          <Input
            type='number'
            value={(filter.value as number) || ''}
            onChange={(e) =>
              onUpdateFilter(filter.id, { value: Number(e.target.value) })
            }
            placeholder='Enter value'
            className='w-full'
          />
        );
      case 'date':
        if (filter.operator === 'between') {
          const dateValue = filter.value as [Date, Date] | undefined;
          return (
            <DateRangePicker
              label="Date range"
              value={dateValue ? { from: dateValue[0].toISOString(), to: dateValue[1].toISOString() } : undefined}
              onChange={(value) => {
                const newValue = value ? [new Date(value.from), new Date(value.to)] as [Date, Date] : undefined;
                onUpdateFilter(filter.id, { value: newValue });
              }}
            />
          );
        }
        return (
          <div className='grid gap-2'>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !filter.value && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {filter.value ? (
                    format(filter.value as Date, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={(filter.value as Date) || undefined}
                  onSelect={(date) =>
                    onUpdateFilter(filter.id, { value: date })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        );
      case 'boolean':
        return (
          <Select
            value={filter.value?.toString() || ''}
            onValueChange={(value) =>
              onUpdateFilter(filter.id, { value: value === 'true' })
            }
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select value' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='true'>Yes</SelectItem>
              <SelectItem value='false'>No</SelectItem>
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            value={(filter.value as string) || ''}
            onChange={(e) =>
              onUpdateFilter(filter.id, { value: e.target.value })
            }
            placeholder='Enter value'
            className='w-full'
          />
        );
    }
  };

  return (
    <div className='mb-4'>
      <div className='bg-background p-4 rounded-lg hover:bg-accent/10 transition-colors'>
        <h3 className='text-base font-semibold mb-2'>Column Filters</h3>
        <p className='text-sm text-muted-foreground mb-3'>
          Search specific fields by selecting a column, operator, and value.
        </p>
        <div className='space-y-4'>
          {columnFilters.map((filter) => {
            const column = columns.find((col) => col.id === filter.columnId);
            const columnType = column?.type || 'text';

            return (
              <div key={filter.id} className='flex items-start gap-2'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-2 flex-1'>
                  <Select
                    value={filter.columnId}
                    onValueChange={(value) =>
                      onUpdateFilter(filter.id, { columnId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select column' />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((column) => (
                        <SelectItem key={column.id} value={column.id}>
                          {column.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filter.operator}
                    onValueChange={(value) =>
                      onUpdateFilter(filter.id, {
                        operator: value as ColumnFilterOperator,
                        value: ['empty', 'notEmpty'].includes(value)
                          ? undefined
                          : '',
                      } as Partial<ColumnFilter>)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select operator' />
                    </SelectTrigger>
                    <SelectContent>
                      {getOperatorsForColumnType(columnType).map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className='flex-1'>
                    {renderValueInput(filter, columnType)}
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onRemoveFilter(filter.id)}
                  className='flex-shrink-0'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            );
          })}
          <Button
            variant='outline'
            size='sm'
            onClick={onAddFilter}
            className='mt-2'
          >
            <Plus className='h-4 w-4 mr-2' />
            Add Column Filter
          </Button>
        </div>
      </div>
    </div>
  );
}
