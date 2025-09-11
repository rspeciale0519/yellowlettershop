'use client';

import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tag } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import type { TagFiltersSectionProps } from './types';

export const TagFiltersSection = ({
  tagFilter,
  availableTags,
  onTagFilterChange,
  onMatchTypeChange,
  isExpanded,
  onToggle,
}: TagFiltersSectionProps) => {
  return (
    <CollapsibleSection
      title='Tag Filters'
      icon={Tag}
      isOpen={isExpanded}
      onToggle={onToggle}
      badge={tagFilter?.tags?.length}
    >
      <div className='flex items-center gap-2'>
        <Select
          onValueChange={(value) =>
            onMatchTypeChange(value as 'any' | 'all')
          }
          value={tagFilter?.matchType || 'any'}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select match type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='any'>Any</SelectItem>
            <SelectItem value='all'>All</SelectItem>
          </SelectContent>
        </Select>
        <MultiSelect
          options={availableTags.map((tag) => ({
            value: tag.id,
            label: tag.name,
          }))}
          selected={tagFilter?.tags || []}
          onChange={onTagFilterChange}
          placeholder='Select tags...'
          className='w-full'
        />
      </div>
    </CollapsibleSection>
  );
};