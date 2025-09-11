'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Columns, Trash } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import type { ColumnFiltersSectionProps, ColumnFilter } from './types';

export const ColumnFiltersSection = ({
  columnFilters,
  onAddFilter,
  onRemoveFilter,
  onFilterChange,
  isExpanded,
  onToggle,
}: ColumnFiltersSectionProps) => {
  return (
    <CollapsibleSection
      title='Column Filters'
      icon={Columns}
      isOpen={isExpanded}
      onToggle={onToggle}
      badge={columnFilters.length}
    >
      <div className='space-y-2'>
        {columnFilters.map((filter) => (
          <div key={filter.id} className='flex items-center gap-2'>
            <Select
              onValueChange={(value) =>
                onFilterChange(filter.id, 'column', value)
              }
              value={filter.column}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select column' />
              </SelectTrigger>
              <SelectContent>
                {/* Populate with actual columns */}
                <SelectItem value='first_name'>First Name</SelectItem>
                <SelectItem value='last_name'>Last Name</SelectItem>
                <SelectItem value='address'>Address</SelectItem>
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) =>
                onFilterChange(filter.id, 'operator', value)
              }
              value={filter.operator}
            >
              <SelectTrigger>
                <SelectValue placeholder='Operator' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='contains'>Contains</SelectItem>
                <SelectItem value='equals'>Equals</SelectItem>
                <SelectItem value='not_equals'>Not Equals</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={filter.value}
              onChange={(e) =>
                onFilterChange(filter.id, 'value', e.target.value)
              }
              placeholder='Value'
            />
            <Button
              variant='ghost'
              size='icon'
              onClick={() => onRemoveFilter(filter.id)}
            >
              <Trash className='h-4 w-4' />
            </Button>
          </div>
        ))}
      </div>
      <Button
        onClick={onAddFilter}
        variant='outline'
        size='sm'
        className='mt-2'
      >
        + Add Filter
      </Button>
    </CollapsibleSection>
  );
};